from __future__ import annotations

import re
from abc import ABC, abstractmethod
from typing import Any

class BaseSkill(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        ...

    @abstractmethod
    def _build_prompt(self, context: dict[str, Any]) -> tuple[str, list[dict[str, str]]]:
        ...

    @staticmethod
    def _strip_code_fence(text: str) -> str:
        stripped = text.strip()
        match = re.match(r"^```(?:json)?\s*\n?(.*?)\n?\s*```$", stripped, re.DOTALL)
        if match:
            return match.group(1).strip()
        return stripped

    def _validate_output(self, raw_output: str, context: dict[str, Any]) -> dict[str, Any]:
        return {"content": raw_output}
