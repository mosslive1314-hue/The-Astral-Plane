from __future__ import annotations

import hashlib
import numpy as np

from towow.core.errors import EncodingError
from towow.core.protocols import Vector

class MockEmbeddingEncoder:
    def __init__(self, model_name: str | None = None):
        self._model_name = model_name or "mock_encoder"
        self._dimension = 768

    async def encode(self, text: str) -> Vector:
        if not text or not text.strip():
            raise EncodingError("Cannot encode empty text")

        hash_obj = hashlib.md5(text.encode('utf-8'))
        hash_bytes = hash_obj.digest()

        vec = np.zeros(self._dimension, dtype=np.float32)

        for i, byte in enumerate(hash_bytes):
            idx = (i * 32) % self._dimension
            vec[idx] = byte / 255.0

        for i in range(self._dimension):
            if vec[i] == 0:
                vec[i] = (hashlib.md5(f"{text}_{i}".encode()).digest()[0] / 255.0)

        norm = np.linalg.norm(vec)
        if norm > 1e-10:
            vec = vec / norm

        return vec

    async def batch_encode(self, texts: list[str]) -> list[Vector]:
        if not texts:
            return []
        for i, t in enumerate(texts):
            if not t or not t.strip():
                raise EncodingError(f"Cannot encode empty text at index {i}")
        return [await self.encode(t) for t in texts]
