from __future__ import annotations

import asyncio
import os
from typing import Optional

import numpy as np

from towow.core.errors import EncodingError
from towow.core.protocols import Vector

os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

def _get_model(model_name: str):
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer(model_name)
    except Exception as e:
        raise EncodingError(f"Failed to load SentenceTransformer: {e}. Try using MockEmbeddingEncoder instead.")

class EmbeddingEncoder:
    DEFAULT_MODEL = "all-MiniLM-L6-v2"

    def __init__(self, model_name: Optional[str] = None):
        self._model_name = model_name or self.DEFAULT_MODEL
        self._model = None

    @property
    def model(self):
        if self._model is None:
            try:
                self._model = _get_model(self._model_name)
            except Exception as e:
                raise EncodingError(
                    f"Failed to load model '{self._model_name}': {e}"
                ) from e
        return self._model

    async def encode(self, text: str) -> Vector:
        if not text or not text.strip():
            raise EncodingError("Cannot encode empty text")
        try:
            loop = asyncio.get_running_loop()
            vec = await loop.run_in_executor(
                None, lambda: self.model.encode(text, normalize_embeddings=True)
            )
            return np.asarray(vec, dtype=np.float32)
        except EncodingError:
            raise
        except Exception as e:
            raise EncodingError(f"Encoding failed: {e}") from e

    async def batch_encode(self, texts: list[str]) -> list[Vector]:
        if not texts:
            return []
        for i, t in enumerate(texts):
            if not t or not t.strip():
                raise EncodingError(f"Cannot encode empty text at index {i}")
        try:
            loop = asyncio.get_running_loop()
            vecs = await loop.run_in_executor(
                None,
                lambda: self.model.encode(texts, normalize_embeddings=True),
            )
            return [np.asarray(v, dtype=np.float32) for v in vecs]
        except EncodingError:
            raise
        except Exception as e:
            raise EncodingError(f"Batch encoding failed: {e}") from e
