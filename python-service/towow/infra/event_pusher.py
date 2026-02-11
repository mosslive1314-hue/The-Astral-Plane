from __future__ import annotations

import logging
from typing import Any

from towow.core.events import NegotiationEvent

logger = logging.getLogger(__name__)

class NullEventPusher:
    async def push(self, event: NegotiationEvent) -> None:
        pass

    async def push_many(self, events: list[NegotiationEvent]) -> None:
        pass

class LoggingEventPusher:
    async def push(self, event: NegotiationEvent) -> None:
        logger.info(
            "Event [%s] %s: %s",
            event.negotiation_id,
            event.event_type.value,
            {k: str(v)[:100] for k, v in event.data.items()},
        )

    async def push_many(self, events: list[NegotiationEvent]) -> None:
        for event in events:
            await self.push(event)
