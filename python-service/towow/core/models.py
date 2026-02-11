from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

def generate_id(prefix: str = "") -> str:
    uid = uuid.uuid4().hex[:12]
    return f"{prefix}_{uid}" if prefix else uid

class AgentType(str, Enum):
    EDGE = "edge"
    SERVICE = "service"

class SourceType(str, Enum):
    SECONDME = "secondme"
    CLAUDE = "claude"
    TEMPLATE = "template"
    CUSTOM = "custom"

@dataclass
class AgentIdentity:
    agent_id: str
    display_name: str
    source_type: SourceType
    agent_type: AgentType = AgentType.EDGE
    parent_id: Optional[str] = None
    scene_id: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

class AccessPolicy(str, Enum):
    OPEN = "open"
    INVITE = "invite"

class SceneStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"

@dataclass
class SceneDefinition:
    scene_id: str
    name: str
    description: str
    organizer_id: str
    expected_responders: int = 10
    access_policy: AccessPolicy = AccessPolicy.OPEN
    status: SceneStatus = SceneStatus.ACTIVE
    agent_ids: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

class NegotiationState(str, Enum):
    CREATED = "created"
    FORMULATING = "formulating"
    FORMULATED = "formulated"
    ENCODING = "encoding"
    OFFERING = "offering"
    BARRIER_WAITING = "barrier_waiting"
    SYNTHESIZING = "synthesizing"
    COMPLETED = "completed"

class AgentState(str, Enum):
    ACTIVE = "active"
    REPLIED = "replied"
    EXITED = "exited"

@dataclass
class AgentParticipant:
    agent_id: str
    display_name: str
    resonance_score: float = 0.0
    state: AgentState = AgentState.ACTIVE
    offer: Optional[Offer] = None

@dataclass
class Offer:
    agent_id: str
    content: str
    capabilities: list[str] = field(default_factory=list)
    confidence: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

@dataclass
class DemandSnapshot:
    raw_intent: str
    formulated_text: Optional[str] = None
    user_id: Optional[str] = None
    scene_id: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)

@dataclass
class NegotiationSession:
    negotiation_id: str
    demand: DemandSnapshot
    state: NegotiationState = NegotiationState.CREATED
    participants: list[AgentParticipant] = field(default_factory=list)
    center_rounds: int = 0
    max_center_rounds: int = 2
    plan_output: Optional[str] = None
    parent_negotiation_id: Optional[str] = None
    depth: int = 0
    sub_session_ids: list[str] = field(default_factory=list)
    trace: Optional[TraceChain] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    event_history: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def active_participants(self) -> list[AgentParticipant]:
        return [p for p in self.participants if p.state == AgentState.ACTIVE]

    @property
    def pending_participants(self) -> list[AgentParticipant]:
        return [p for p in self.participants if p.state == AgentState.ACTIVE]

    @property
    def collected_offers(self) -> list[Offer]:
        return [p.offer for p in self.participants if p.offer is not None]

    @property
    def is_barrier_met(self) -> bool:
        return all(
            p.state in (AgentState.REPLIED, AgentState.EXITED)
            for p in self.participants
        )

    @property
    def tools_restricted(self) -> bool:
        return self.center_rounds >= self.max_center_rounds

@dataclass
class TraceEntry:
    step: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    duration_ms: Optional[float] = None
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)

@dataclass
class TraceChain:
    negotiation_id: str
    entries: list[TraceEntry] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    def add_entry(self, step: str, **kwargs) -> TraceEntry:
        entry = TraceEntry(step=step, **kwargs)
        self.entries.append(entry)
        return entry

    def to_dict(self) -> dict[str, Any]:
        return {
            "negotiation_id": self.negotiation_id,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "entries": [
                {
                    "step": e.step,
                    "timestamp": e.timestamp.isoformat(),
                    "duration_ms": e.duration_ms,
                    "input_summary": e.input_summary,
                    "output_summary": e.output_summary,
                    "metadata": e.metadata,
                }
                for e in self.entries
            ],
        }
