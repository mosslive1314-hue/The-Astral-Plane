import { HDCVector, KStarConfig, ResonanceResult, ResonanceScore } from '@/types/hdc'
import { hdEncoder } from './encoder'

interface AgentProfile {
  id: string
  vector: HDCVector
}

export class ResonanceEngine {
  private agents: Map<string, AgentProfile> = new Map()

  registerAgent(agentId: string, vector: HDCVector) {
    this.agents.set(agentId, { id: agentId, vector })
  }

  unregisterAgent(agentId: string) {
    this.agents.delete(agentId)
  }

  calculateResonanceScores(demandVector: HDCVector): ResonanceScore[] {
    const scores: ResonanceScore[] = []

    for (const [agentId, agent] of this.agents.entries()) {
      const score = hdEncoder.similarity(demandVector, agent.vector)
      scores.push({
        agentId,
        score,
        normalized: score
      })
    }

    return scores.sort((a, b) => b.score - a.score)
  }

  calculateThreshold(scores: ResonanceScore[], config: KStarConfig): number {
    const k = config.k
    const validK = Math.min(k, scores.length)

    if (validK === 0) {
      return config.minThreshold || 0.5
    }

    const threshold = scores[validK - 1].score

    let finalThreshold = threshold
    if (config.minThreshold !== undefined) {
      finalThreshold = Math.max(finalThreshold, config.minThreshold)
    }
    if (config.maxThreshold !== undefined) {
      finalThreshold = Math.min(finalThreshold, config.maxThreshold)
    }

    return finalThreshold
  }

  filterByThreshold(scores: ResonanceScore[], threshold: number): ResonanceResult[] {
    return scores.map(s => ({
      agentId: s.agentId,
      resonated: s.score > threshold,
      score: s.score,
      threshold
    })).filter(r => r.resonated)
  }

  detectResonance(demandVector: HDCVector, config: KStarConfig): ResonanceResult[] {
    const allScores = this.calculateResonanceScores(demandVector)
    const threshold = this.calculateThreshold(allScores, config)
    const resonatedAgents = this.filterByThreshold(allScores, threshold)

    return resonatedAgents
  }

  getAgentCount(): number {
    return this.agents.size
  }

  getAverageVector(): HDCVector {
    if (this.agents.size === 0) {
      throw new Error('No agents registered')
    }

    const dim = DIMENSION
    const avgData = new Array(dim).fill(0)

    for (const agent of this.agents.values()) {
      for (let i = 0; i < dim; i++) {
        avgData[i] += agent.vector.data[i]
      }
    }

    for (let i = 0; i < dim; i++) {
      avgData[i] = avgData[i] / this.agents.size >= 0.5 ? 1 : 0
    }

    return {
      data: avgData,
      dimension: dim
    }
  }
}

export const resonanceEngine = new ResonanceEngine()

const DIMENSION = 10000
