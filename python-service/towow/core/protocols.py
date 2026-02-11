from __future__ import annotations

from typing import Any, AsyncGenerator, Optional, Protocol, runtime_checkable

import numpy as np

from .models import (
    AgentIdentity,
    AgentParticipant,
    DemandSnapshot,
    NegotiationSession,
    Offer,
    SceneDefinition,
)
from .events import NegotiationEvent

Vector = np.ndarray

@runtime_checkable
class Encoder(Protocol):
    async def encode(self, text: str) -> Vector:
        ...

    async def batch_encode(self, texts: list[str]) -> list[Vector]:
        ...

@runtime_checkable
class ResonanceDetector(Protocol):
    async def detect(
        self,
        demand_vector: Vector,
        agent_vectors: dict[str, Vector],
        k_star: int,
    ) -> list[tuple[str, float]]:
        ...

@runtime_checkable
class ProfileDataSource(Protocol):
    async def get_profile(self, agent_id: str) -> dict[str, Any]:
        ...

    async def chat(
        self,
        agent_id: str,
        messages: list[dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> str:
        ...

    async def chat_stream(
        self,
        agent_id: str,
        messages: list[dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        ...

@runtime_checkable
class PlatformLLMClient(Protocol):
    async def chat(
        self,
        messages: list[dict[str, Any]],
        system_prompt: Optional[str] = None,
        tools: Optional[list[dict[str, Any]]] = None,
    ) -> dict[str, Any]:
        ...

@runtime_checkable
class Skill(Protocol):
    @property
    def name(self) -> str:
        ...

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        ...

@runtime_checkable
class EventPusher(Protocol):
    async def push(self, event: NegotiationEvent) -> None:
        ...

    async def push_many(self, events: list[NegotiationEvent]) -> None:
        ...

@runtime_checkable
class CenterToolHandler(Protocol):
    @property
    def tool_name(self) -> str:
        ...

    async def handle(
        self,
        session: NegotiationSession,
        tool_args: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any] | None:
        ...
