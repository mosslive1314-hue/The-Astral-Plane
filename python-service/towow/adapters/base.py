from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Optional

logger = logging.getLogger(__name__)

class BaseAdapter(ABC):
    @abstractmethod
    async def get_profile(self, agent_id: str) -> dict[str, Any]:
        ...

    @abstractmethod
    async def chat(
        self,
        agent_id: str,
        messages: list[dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> str:
        ...

    @abstractmethod
    async def chat_stream(
        self,
        agent_id: str,
        messages: list[dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        ...
