from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Callable, Optional

import numpy as np

from .models import (
    AgentParticipant,
    AgentState,
    DemandSnapshot,
    NegotiationSession,
    NegotiationState,
    Offer,
    TraceChain,
    generate_id,
)
from .events import (
    NegotiationEvent,
    barrier_complete,
    center_tool_call,
    formulation_ready,
    offer_received,
    plan_ready,
    resonance_activated,
    sub_negotiation_started,
)
from .protocols import (
    Encoder,
    EventPusher,
    PlatformLLMClient,
    ProfileDataSource,
    ResonanceDetector,
    Skill,
    Vector,
)

logger = logging.getLogger(__name__)

VALID_TRANSITIONS: dict[NegotiationState, set[NegotiationState]] = {
    NegotiationState.CREATED: {NegotiationState.FORMULATING, NegotiationState.COMPLETED},
    NegotiationState.FORMULATING: {NegotiationState.FORMULATED, NegotiationState.COMPLETED},
    NegotiationState.FORMULATED: {NegotiationState.ENCODING, NegotiationState.COMPLETED},
    NegotiationState.ENCODING: {NegotiationState.OFFERING, NegotiationState.COMPLETED},
    NegotiationState.OFFERING: {NegotiationState.BARRIER_WAITING, NegotiationState.COMPLETED},
    NegotiationState.BARRIER_WAITING: {NegotiationState.SYNTHESIZING, NegotiationState.COMPLETED},
    NegotiationState.SYNTHESIZING: {NegotiationState.SYNTHESIZING, NegotiationState.COMPLETED},
    NegotiationState.COMPLETED: set(),
}

class NegotiationEngine:
    def __init__(
        self,
        encoder: Encoder,
        resonance_detector: ResonanceDetector,
        event_pusher: EventPusher,
        offer_timeout_s: float = 30.0,
        confirmation_timeout_s: float = 300.0,
    ):
        self._encoder = encoder
        self._resonance_detector = resonance_detector
        self._event_pusher = event_pusher
        self._offer_timeout = offer_timeout_s
        self._confirmation_timeout = confirmation_timeout_s
        self._tool_handlers: dict[str, Any] = {}
        self._confirmation_events: dict[str, asyncio.Event] = {}
        self._confirmation_data: dict[str, dict[str, Any]] = {}

    def register_tool_handler(self, handler: Any) -> None:
        name = handler.tool_name
        if name == "output_plan":
            raise ValueError("output_plan is built-in and cannot be overridden.")
        self._tool_handlers[name] = handler

    def confirm_formulation(self, negotiation_id: str, confirmed_text: str | None = None) -> bool:
        if negotiation_id not in self._confirmation_events:
            return False
        self._confirmation_data[negotiation_id] = {"confirmed_text": confirmed_text}
        self._confirmation_events[negotiation_id].set()
        return True

    def is_awaiting_confirmation(self, negotiation_id: str) -> bool:
        return negotiation_id in self._confirmation_events

    async def start_negotiation(
        self,
        session: NegotiationSession,
        adapter: ProfileDataSource,
        llm_client: PlatformLLMClient,
        center_skill: Skill,
        formulation_skill: Optional[Skill] = None,
        offer_skill: Optional[Skill] = None,
        sub_negotiation_skill: Optional[Skill] = None,
        gap_recursion_skill: Optional[Skill] = None,
        agent_vectors: Optional[dict[str, Vector]] = None,
        k_star: int = 5,
        agent_display_names: Optional[dict[str, str]] = None,
        register_session: Optional[Callable[[NegotiationSession], None]] = None,
    ) -> NegotiationSession:
        logger.info(f"Starting negotiation {session.negotiation_id}")

        if session.state != NegotiationState.CREATED:
            raise ValueError(f"Session must be in CREATED state, got {session.state}")

        if formulation_skill:
            await self._run_formulation(session, adapter, formulation_skill)

        await self._run_encoding(session, agent_vectors or {}, k_star, llm_client)

        if offer_skill:
            await self._run_offers(session, adapter, offer_skill, agent_display_names or {})

        await self._run_synthesis(
            session,
            adapter,
            llm_client,
            center_skill,
            sub_negotiation_skill,
            gap_recursion_skill,
            register_session,
            agent_display_names or {},
        )

        session.completed_at = session.trace.completed_at if session.trace else None
        return session

    async def _transition_state(
        self, session: NegotiationSession, new_state: NegotiationState
    ) -> None:
        current = session.state
        valid = VALID_TRANSITIONS.get(current, set())
        if new_state not in valid:
            raise ValueError(
                f"Invalid state transition: {current} -> {new_state}. "
                f"Valid transitions: {valid}"
            )
        session.state = new_state
        logger.debug(f"Session {session.negotiation_id}: {current} -> {new_state}")

    async def _push_event(self, event: NegotiationEvent) -> None:
        try:
            await self._event_pusher.push(event)
        except Exception as e:
            logger.error(f"Failed to push event {event.event_type}: {e}")

    async def _run_formulation(
        self,
        session: NegotiationSession,
        adapter: ProfileDataSource,
        formulation_skill: Skill,
    ) -> None:
        await self._transition_state(session, NegotiationState.FORMULATING)

        try:
            user_agent_id = session.demand.user_id or "user_default"
            profile = await adapter.get_profile(user_agent_id)

            result = await formulation_skill.execute({
                "raw_intent": session.demand.raw_intent,
                "agent_id": user_agent_id,
                "profile_data": profile,
                "adapter": adapter,
            })

            session.demand.formulated_text = result.get("formulated_text", session.demand.raw_intent)
            session.demand.metadata["enrichments"] = result.get("enrichments", {})

            await self._push_event(
                formulation_ready(
                    negotiation_id=session.negotiation_id,
                    raw_intent=session.demand.raw_intent,
                    formulated_text=session.demand.formulated_text,
                    enrichments=result.get("enrichments"),
                )
            )

            await self._transition_state(session, NegotiationState.FORMULATED)

        except Exception as e:
            logger.error(f"Formulation failed: {e}")
            session.demand.formulated_text = session.demand.raw_intent
            await self._transition_state(session, NegotiationState.FORMULATED)

    async def _run_encoding(
        self,
        session: NegotiationSession,
        agent_vectors: dict[str, Vector],
        k_star: int,
        llm_client: PlatformLLMClient,
    ) -> None:
        await self._transition_state(session, NegotiationState.ENCODING)

        demand_text = session.demand.formulated_text or session.demand.raw_intent
        demand_vector = await self._encoder.encode(demand_text)

        if agent_vectors:
            results = await self._resonance_detector.detect(
                demand_vector, agent_vectors, k_star
            )

            session.participants = []
            for agent_id, score in results:
                session.participants.append(
                    AgentParticipant(
                        agent_id=agent_id,
                        display_name=agent_id,
                        resonance_score=score,
                    )
                )

            await self._push_event(
                resonance_activated(
                    negotiation_id=session.negotiation_id,
                    activated_count=len(session.participants),
                    agents=[
                        {"agent_id": p.agent_id, "display_name": p.display_name, "resonance_score": p.resonance_score}
                        for p in session.participants
                    ],
                )
            )

    async def _run_offers(
        self,
        session: NegotiationSession,
        adapter: ProfileDataSource,
        offer_skill: Skill,
        display_names: dict[str, str],
    ) -> None:
        await self._transition_state(session, NegotiationState.OFFERING)

        demand_text = session.demand.formulated_text or session.demand.raw_intent

        tasks = []
        for participant in session.participants:
            task = self._generate_single_offer(
                session, participant, adapter, offer_skill, demand_text, display_names
            )
            tasks.append(task)

        await asyncio.gather(*tasks, return_exceptions=True)

        await self._transition_state(session, NegotiationState.BARRIER_WAITING)

        exited_count = sum(1 for p in session.participants if p.state == AgentState.EXITED)
        offers_received = len(session.collected_offers)

        await self._push_event(
            barrier_complete(
                negotiation_id=session.negotiation_id,
                total_participants=len(session.participants),
                offers_received=offers_received,
                exited_count=exited_count,
            )
        )

    async def _generate_single_offer(
        self,
        session: NegotiationSession,
        participant: AgentParticipant,
        adapter: ProfileDataSource,
        offer_skill: Skill,
        demand_text: str,
        display_names: dict[str, str],
    ) -> None:
        try:
            profile = await adapter.get_profile(participant.agent_id)

            result = await asyncio.wait_for(
                offer_skill.execute({
                    "agent_id": participant.agent_id,
                    "demand_text": demand_text,
                    "profile_data": profile,
                    "adapter": adapter,
                }),
                timeout=self._offer_timeout,
            )

            participant.offer = Offer(
                agent_id=participant.agent_id,
                content=result.get("content", ""),
                capabilities=result.get("capabilities", []),
                confidence=result.get("confidence", 0.0),
            )
            participant.state = AgentState.REPLIED

            await self._push_event(
                offer_received(
                    negotiation_id=session.negotiation_id,
                    agent_id=participant.agent_id,
                    display_name=display_names.get(participant.agent_id, participant.agent_id),
                    content=participant.offer.content,
                    capabilities=participant.offer.capabilities,
                )
            )

        except asyncio.TimeoutError:
            participant.state = AgentState.EXITED
            logger.warning(f"Offer from {participant.agent_id} timed out")
        except Exception as e:
            participant.state = AgentState.EXITED
            logger.error(f"Offer generation failed for {participant.agent_id}: {e}")

    async def _run_synthesis(
        self,
        session: NegotiationSession,
        adapter: ProfileDataSource,
        llm_client: PlatformLLMClient,
        center_skill: Skill,
        sub_negotiation_skill: Optional[Skill],
        gap_recursion_skill: Optional[Skill],
        register_session: Optional[Callable[[NegotiationSession], None]],
        display_names: dict[str, str],
    ) -> None:
        await self._transition_state(session, NegotiationState.SYNTHESIZING)

        history: list[dict[str, Any]] = []
        center_round = 0

        while session.center_rounds < session.max_center_rounds:
            center_round += 1
            session.center_rounds = center_round

            tools_restricted = session.tools_restricted

            context = {
                "demand": session.demand,
                "offers": [p.offer for p in session.participants if p.offer],
                "llm_client": llm_client,
                "participants": session.participants,
                "round_number": center_round,
                "history": history,
                "tools_restricted": tools_restricted,
            }

            result = await center_skill.execute(context)
            tool_calls = result.get("tool_calls", [])

            if not tool_calls:
                logger.warning("Center returned no tool calls, treating as output_plan")
                session.plan_output = result.get("content", "")
                break

            for tool_call in tool_calls:
                tool_name = tool_call.get("name")
                tool_args = tool_call.get("arguments", {})

                await self._push_event(
                    center_tool_call(
                        negotiation_id=session.negotiation_id,
                        tool_name=tool_name,
                        tool_args=tool_args,
                        round_number=center_round,
                    )
                )

                if tool_name == "output_plan":
                    session.plan_output = tool_args.get("plan_text", "")
                    await self._transition_state(session, NegotiationState.COMPLETED)
                    return

                elif tool_name == "ask_agent":
                    await self._handle_ask_agent(session, tool_args, adapter, center_skill, display_names, history)

                elif tool_name == "start_discovery" and sub_negotiation_skill:
                    await self._handle_start_discovery(session, tool_args, llm_client, sub_negotiation_skill, history)

                elif tool_name == "create_sub_demand" and gap_recursion_skill:
                    sub_session = await self._handle_create_sub_demand(
                        session, tool_args, adapter, llm_client, center_skill,
                        sub_negotiation_skill, gap_recursion_skill, register_session, display_names, history
                    )

                elif tool_name in self._tool_handlers:
                    handler = self._tool_handlers[tool_name]
                    handler_result = await handler.handle(
                        session, tool_args, {
                            "adapter": adapter,
                            "llm_client": llm_client,
                            "display_names": display_names,
                            "neg_context": {
                                "center_skill": center_skill,
                                "sub_negotiation_skill": sub_negotiation_skill,
                                "gap_recursion_skill": gap_recursion_skill,
                            },
                            "engine": self,
                        }
                    )
                    history.append({
                        "type": "custom_tool",
                        "tool": tool_name,
                        "args": tool_args,
                        "result": handler_result,
                    })

        if not session.plan_output:
            session.plan_output = "No plan generated. Center exhausted rounds without calling output_plan."

        await self._push_event(
            plan_ready(
                negotiation_id=session.negotiation_id,
                plan_text=session.plan_output,
                center_rounds=session.center_rounds,
                participating_agents=[p.agent_id for p in session.participants if p.offer],
            )
        )

        await self._transition_state(session, NegotiationState.COMPLETED)

    async def _handle_ask_agent(
        self,
        session: NegotiationSession,
        tool_args: dict[str, Any],
        adapter: ProfileDataSource,
        center_skill: Skill,
        display_names: dict[str, str],
        history: list[dict[str, Any]],
    ) -> None:
        agent_id = tool_args.get("agent_id")
        question = tool_args.get("question", "")

        participant = next((p for p in session.participants if p.agent_id == agent_id), None)
        if not participant:
            logger.warning(f"Agent {agent_id} not found in participants")
            return

        try:
            profile = await adapter.get_profile(agent_id)
            response = await adapter.chat(
                agent_id,
                [{"role": "user", "content": question}],
            )

            history.append({
                "type": "agent_reply",
                "agent_id": agent_id,
                "question": question,
                "response": response,
            })

        except Exception as e:
            logger.error(f"ask_agent failed for {agent_id}: {e}")
            history.append({
                "type": "agent_reply",
                "agent_id": agent_id,
                "question": question,
                "response": f"[Error: {str(e)}]",
            })

    async def _handle_start_discovery(
        self,
        session: NegotiationSession,
        tool_args: dict[str, Any],
        llm_client: PlatformLLMClient,
        sub_negotiation_skill: Skill,
        history: list[dict[str, Any]],
    ) -> None:
        agent_a_id = tool_args.get("agent_a")
        agent_b_id = tool_args.get("agent_b")
        reason = tool_args.get("reason", "")

        participant_a = next((p for p in session.participants if p.agent_id == agent_a_id), None)
        participant_b = next((p for p in session.participants if p.agent_id == agent_b_id), None)

        if not participant_a or not participant_b:
            logger.warning(f"One or both agents not found for discovery")
            return

        try:
            result = await sub_negotiation_skill.execute({
                "agent_a": {
                    "agent_id": participant_a.agent_id,
                    "display_name": participant_a.display_name,
                    "offer": participant_a.offer.content if participant_a.offer else None,
                    "profile": {},
                },
                "agent_b": {
                    "agent_id": participant_b.agent_id,
                    "display_name": participant_b.display_name,
                    "offer": participant_b.offer.content if participant_b.offer else None,
                    "profile": {},
                },
                "reason": reason,
                "llm_client": llm_client,
            })

            history.append({
                "type": "discovery",
                "agent_a": agent_a_id,
                "agent_b": agent_b_id,
                "reason": reason,
                "result": result,
            })

        except Exception as e:
            logger.error(f"Discovery failed: {e}")

    async def _handle_create_sub_demand(
        self,
        session: NegotiationSession,
        tool_args: dict[str, Any],
        adapter: ProfileDataSource,
        llm_client: PlatformLLMClient,
        center_skill: Skill,
        sub_negotiation_skill: Optional[Skill],
        gap_recursion_skill: Skill,
        register_session: Optional[Callable[[NegotiationSession], None]],
        display_names: dict[str, str],
        history: list[dict[str, Any]],
    ) -> Optional[NegotiationSession]:
        if session.depth >= 1:
            logger.warning("Max recursion depth reached, cannot create sub-demand")
            return None

        gap_description = tool_args.get("gap_description", "")

        try:
            result = await gap_recursion_skill.execute({
                "gap_description": gap_description,
                "demand_context": session.demand.formatted_text or session.demand.raw_intent,
                "llm_client": llm_client,
            })

            sub_demand_text = result.get("sub_demand_text", gap_description)

            sub_session = NegotiationSession(
                negotiation_id=generate_id("sub"),
                demand=DemandSnapshot(
                    raw_intent=sub_demand_text,
                    user_id=session.demand.user_id,
                    scene_id=session.demand.scene_id,
                ),
                parent_negotiation_id=session.negotiation_id,
                depth=session.depth + 1,
            )

            if register_session:
                register_session(sub_session)

            session.sub_session_ids.append(sub_session.negotiation_id)

            await self._push_event(
                sub_negotiation_started(
                    negotiation_id=session.negotiation_id,
                    sub_negotiation_id=sub_session.negotiation_id,
                    gap_description=gap_description,
                )
            )

            history.append({
                "type": "sub_demand",
                "sub_session_id": sub_session.negotiation_id,
                "gap_description": gap_description,
                "result": result,
            })

            try:
                await self.start_negotiation(
                    session=sub_session,
                    adapter=adapter,
                    llm_client=llm_client,
                    center_skill=center_skill,
                    sub_negotiation_skill=sub_negotiation_skill,
                    gap_recursion_skill=gap_recursion_skill,
                    agent_vectors={},
                    k_star=0,
                    agent_display_names=display_names,
                    register_session=register_session,
                )
            except Exception as e:
                logger.error(f"Sub-negotiation failed: {e}")

            return sub_session

        except Exception as e:
            logger.error(f"create_sub_demand failed: {e}")
            return None
