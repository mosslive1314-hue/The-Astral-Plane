from __future__ import annotations

import logging
from typing import Any, AsyncGenerator, Optional

from towow.core.errors import AdapterError
from .base import BaseAdapter
from agents_db import REAL_AGENTS, get_agent_profile_text

logger = logging.getLogger(__name__)

class AgentcraftAdapter(BaseAdapter):
    def __init__(self, agent_profiles: dict[str, dict[str, Any]] | None = None):
        self._profiles = agent_profiles if agent_profiles is not None else REAL_AGENTS

    async def get_profile(self, agent_id: str) -> dict[str, Any]:
        return self._profiles.get(agent_id, {"agent_id": agent_id})

    async def chat(
        self,
        agent_id: str,
        messages: list[dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> str:
        try:
            from llm_provider import get_llm_provider
            llm = get_llm_provider()

            profile_text = get_agent_profile_text(self._profiles.get(agent_id, {}))

            full_messages = []
            if system_prompt:
                full_messages.append({"role": "system", "content": system_prompt})

            profile_context = f"\n\nYour profile:\n{profile_text}"
            for msg in messages:
                if msg["role"] == "user":
                    full_messages.append({
                        "role": "user",
                        "content": msg["content"] + profile_context
                    })
                else:
                    full_messages.append(msg)

            response = await llm.chat(full_messages)
            return response

        except Exception as e:
            logger.error(f"Chat failed for agent {agent_id}: {e}")
            raise AdapterError(f"Chat failed: {e}") from e

    async def chat_stream(
        self,
        agent_id: str,
        messages: list[dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        response = await self.chat(agent_id, messages, system_prompt)
        yield response
