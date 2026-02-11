import asyncio
import logging
import numpy as np
from towow import (
    EngineBuilder,
    NegotiationSession,
    DemandSnapshot,
    DemandFormulationSkill,
    OfferGenerationSkill,
    CenterCoordinatorSkill,
    SubNegotiationSkill,
    GapRecursionSkill,
    LoggingEventPusher,
)
from towow.adapters.agentcraft_adapter import AgentcraftAdapter
from towow.infra.llm_client import ClaudePlatformClient
from towow.hdc.encoder_mock import MockEmbeddingEncoder
from towow.hdc.resonance import CosineResonanceDetector
from llm_provider import get_llm_provider
from agents_db import REAL_AGENTS, get_agent_profile_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_towow_sdk():
    logger.info("Starting TongYao SDK test with mock encoder...")

    agentcraft_adapter = AgentcraftAdapter()

    llm = get_llm_provider()
    api_key = getattr(llm, '_api_key', None) or "dummy"
    llm_client = ClaudePlatformClient(api_key=api_key)

    encoder = MockEmbeddingEncoder()

    agent_vectors = {}
    display_names = {}
    for agent_data in REAL_AGENTS:
        agent_id = agent_data.get("id")
        if not agent_id:
            continue
        try:
            profile_text = get_agent_profile_text(agent_data)
            vector = await encoder.encode(profile_text)
            agent_vectors[agent_id] = vector
            display_names[agent_id] = agent_data.get("name", agent_id)
            logger.info(f"Encoded agent {agent_id}: {agent_data.get('name')}")
        except Exception as e:
            logger.warning(f"Failed to encode agent {agent_id}: {e}")

    logger.info(f"Encoded {len(agent_vectors)} agents")

    engine, defaults = (
        EngineBuilder()
        .with_adapter(agentcraft_adapter)
        .with_llm_client(llm_client)
        .with_center_skill(CenterCoordinatorSkill())
        .with_formulation_skill(DemandFormulationSkill())
        .with_offer_skill(OfferGenerationSkill())
        .with_sub_negotiation_skill(SubNegotiationSkill())
        .with_gap_recursion_skill(GapRecursionSkill())
        .with_event_pusher(LoggingEventPusher())
        .with_agent_vectors(agent_vectors)
        .with_k_star(3)
        .with_display_names(display_names)
        .build()
    )

    session = NegotiationSession(
        negotiation_id="test_neg_001",
        demand=DemandSnapshot(
            raw_intent="我需要一个技术合伙人来开发AI产品",
            user_id="test_user",
        ),
    )

    async def auto_confirm():
        for _ in range(60):
            await asyncio.sleep(1)
            if engine.is_awaiting_confirmation(session.negotiation_id):
                engine.confirm_formulation(session.negotiation_id)
                logger.info(f"Auto-confirmed formulation for {session.negotiation_id}")
                return

    confirm_task = asyncio.create_task(auto_confirm())

    try:
        result = await engine.start_negotiation(session=session, **defaults)

        logger.info(f"Negotiation completed!")
        logger.info(f"Final state: {result.state.value}")
        logger.info(f"Formulation: {result.demand.formulated_text}")
        logger.info(f"Participants: {len(result.participants)}")
        logger.info(f"Offers received: {len(result.collected_offers)}")
        logger.info(f"Center rounds: {result.center_rounds}")
        logger.info(f"Plan: {result.plan_output[:200]}..." if result.plan_output else "No plan")

        if result.trace:
            logger.info(f"Trace entries: {len(result.trace.entries)}")
            for entry in result.trace.entries[:5]:
                logger.info(f"  - {entry.step}")

        return {
            "success": True,
            "state": result.state.value,
            "plan": result.plan_output,
            "participants": len(result.participants),
            "offers": len(result.collected_offers),
            "rounds": result.center_rounds,
        }

    except Exception as e:
        logger.error(f"Negotiation failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
        }
    finally:
        confirm_task.cancel()

if __name__ == "__main__":
    result = asyncio.run(test_towow_sdk())
    print("\n=== Test Result ===")
    print(result)
