from __future__ import annotations

import numpy as np

from towow.core.protocols import Vector

class CosineResonanceDetector:
    async def detect(
        self,
        demand_vector: Vector,
        agent_vectors: dict[str, Vector],
        k_star: int,
    ) -> list[tuple[str, float]]:
        if k_star <= 0 or not agent_vectors:
            return []

        demand_norm = np.linalg.norm(demand_vector)
        if demand_norm < 1e-10:
            return []

        results: list[tuple[str, float]] = []
        for agent_id, agent_vec in agent_vectors.items():
            agent_norm = np.linalg.norm(agent_vec)
            if agent_norm < 1e-10:
                results.append((agent_id, 0.0))
                continue
            sim = float(
                np.dot(demand_vector, agent_vec) / (demand_norm * agent_norm)
            )
            results.append((agent_id, sim))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:k_star]
