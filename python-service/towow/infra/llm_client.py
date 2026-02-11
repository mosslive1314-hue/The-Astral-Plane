from __future__ import annotations

import logging
from typing import Any, Optional

from towow.core.errors import LLMError

logger = logging.getLogger(__name__)

class ClaudePlatformClient:
    def __init__(
        self,
        api_key: str,
        model: str = "claude-sonnet-4-5-20250929",
        max_tokens: int = 4096,
    ):
        try:
            import anthropic
            self._client = anthropic.AsyncAnthropic(api_key=api_key)
        except ImportError:
            self._client = None
            logger.warning("anthropic package not available, ClaudePlatformClient will fail")
        self._model = model
        self._max_tokens = max_tokens

    async def chat(
        self,
        messages: list[dict[str, Any]],
        system_prompt: Optional[str] = None,
        tools: Optional[list[dict[str, Any]]] = None,
    ) -> dict[str, Any]:
        if self._client is None:
            raise LLMError("anthropic package not installed")

        try:
            kwargs: dict[str, Any] = {
                "model": self._model,
                "max_tokens": self._max_tokens,
                "messages": messages,
            }
            if system_prompt:
                kwargs["system"] = system_prompt
            if tools:
                kwargs["tools"] = tools

            response = await self._client.messages.create(**kwargs)
            return self._parse_response(response)

        except Exception as e:
            logger.error(f"Platform LLM API error: {e}")
            raise LLMError(f"Platform LLM call failed: {e}") from e

    def _parse_response(self, response: Any) -> dict[str, Any]:
        text_parts: list[str] = []
        tool_calls: list[dict[str, Any]] = []

        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "tool_use":
                tool_calls.append({
                    "name": block.name,
                    "arguments": block.input,
                    "id": block.id,
                })

        content = "".join(text_parts) if text_parts else None

        return {
            "content": content,
            "tool_calls": tool_calls if tool_calls else None,
            "stop_reason": response.stop_reason,
        }
