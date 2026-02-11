import { HDCVector } from '@/types/hdc'
import { hdEncoder } from '../hdc/encoder'

export interface SceneAsAgent {
  sceneId: string
  vector: HDCVector
  context: Record<string, any>
  resonanceHistory: Array<{
    targetId: string
    targetType: 'scene' | 'demand' | 'agent'
    score: number
    timestamp: string
  }>
  createdAt: string
  lastUpdated: string
}

export interface SceneResonanceResult {
  sceneId: string
  resonated: boolean
  score: number
  threshold: number
}

export class SceneAsAgentManager {
  private sceneAgents: Map<string, SceneAsAgent> = new Map()

  async projectSceneToAgent(
    sceneId: string,
    sceneContext: Record<string, any>
  ): Promise<SceneAsAgent> {
    const contextText = this.sceneContextToText(sceneContext)
    const embedding = await hdEncoder.encodeText(contextText)
    const vector = hdEncoder.textToHyperVector(embedding)

    const sceneAsAgent: SceneAsAgent = {
      sceneId,
      vector,
      context: sceneContext,
      resonanceHistory: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    this.sceneAgents.set(sceneId, sceneAsAgent)

    return sceneAsAgent
  }

  private sceneContextToText(context: Record<string, any>): string {
    const parts: string[] = []

    if (context.name) parts.push(`场景名称: ${context.name}`)
    if (context.description) parts.push(`描述: ${context.description}`)
    if (context.category) parts.push(`类别: ${context.category}`)
    if (context.tags && Array.isArray(context.tags)) {
      parts.push(`标签: ${context.tags.join(', ')}`)
    }
    if (context.domain) parts.push(`领域: ${context.domain}`)
    if (context.requiredSkills && Array.isArray(context.requiredSkills)) {
      parts.push(`所需技能: ${context.requiredSkills.join(', ')}`)
    }
    if (context.objectives && Array.isArray(context.objectives)) {
      parts.push(`目标: ${context.objectives.join('; ')}`)
    }

    return parts.join('\n')
  }

  getSceneAsAgent(sceneId: string): SceneAsAgent | undefined {
    return this.sceneAgents.get(sceneId)
  }

  getAllSceneAgents(): SceneAsAgent[] {
    return Array.from(this.sceneAgents.values())
  }

  updateSceneVector(sceneId: string, newContext: Record<string, any>): SceneAsAgent | null {
    const existing = this.sceneAgents.get(sceneId)
    if (!existing) return null

    const updated: SceneAsAgent = {
      ...existing,
      context: newContext,
      lastUpdated: new Date().toISOString()
    }

    this.sceneAgents.set(sceneId, updated)

    return updated
  }

  recordResonance(
    sceneId: string,
    targetId: string,
    targetType: 'scene' | 'demand' | 'agent',
    score: number
  ): void {
    const sceneAgent = this.sceneAgents.get(sceneId)
    if (!sceneAgent) return

    sceneAgent.resonanceHistory.push({
      targetId,
      targetType,
      score,
      timestamp: new Date().toISOString()
    })

    sceneAgent.lastUpdated = new Date().toISOString()
  }

  getSceneResonanceHistory(sceneId: string): SceneAsAgent['resonanceHistory'] {
    const sceneAgent = this.sceneAgents.get(sceneId)
    return sceneAgent?.resonanceHistory || []
  }

  async calculateSceneResonance(
    sceneId: string,
    targetVector: HDCVector,
    threshold?: number
  ): Promise<SceneResonanceResult> {
    const sceneAgent = this.sceneAgents.get(sceneId)
    if (!sceneAgent) {
      throw new Error('Scene not found')
    }

    const score = hdEncoder.similarity(sceneAgent.vector, targetVector)
    const effectiveThreshold = threshold ?? 0.5

    return {
      sceneId,
      resonated: score >= effectiveThreshold,
      score,
      threshold: effectiveThreshold
    }
  }

  findResonantScenes(
    targetVector: HDCVector,
    minScore: number = 0.5,
    maxResults?: number
  ): SceneResonanceResult[] {
    const results: SceneResonanceResult[] = []

    for (const sceneAgent of this.sceneAgents.values()) {
      const score = hdEncoder.similarity(sceneAgent.vector, targetVector)
      if (score >= minScore) {
        results.push({
          sceneId: sceneAgent.sceneId,
          resonated: true,
          score,
          threshold: minScore
        })
      }
    }

    results.sort((a, b) => b.score - a.score)

    if (maxResults) {
      return results.slice(0, maxResults)
    }

    return results
  }

  async findRelatedScenes(
    sceneId: string,
    minScore: number = 0.5,
    maxResults: number = 5
  ): Promise<Array<{ relatedSceneId: string; score: number }>> {
    const sourceScene = this.sceneAgents.get(sceneId)
    if (!sourceScene) {
      return []
    }

    const related: Array<{ relatedSceneId: string; score: number }> = []

    for (const [id, sceneAgent] of this.sceneAgents.entries()) {
      if (id === sceneId) continue

      const score = hdEncoder.similarity(sourceScene.vector, sceneAgent.vector)
      if (score >= minScore) {
        related.push({
          relatedSceneId: id,
          score
        })
      }
    }

    related.sort((a, b) => b.score - a.score)

    return related.slice(0, maxResults)
  }

  mergeSceneContexts(sceneIds: string[]): Record<string, any> {
    const contexts = sceneIds
      .map(id => this.sceneAgents.get(id)?.context)
      .filter(Boolean) as Record<string, any>[]

    if (contexts.length === 0) {
      return {}
    }

    const merged: Record<string, any> = {}

    for (const context of contexts) {
      for (const [key, value] of Object.entries(context)) {
        if (!merged[key]) {
          merged[key] = value
        } else if (Array.isArray(merged[key]) && Array.isArray(value)) {
          merged[key] = [...new Set([...merged[key], ...value])]
        }
      }
    }

    return merged
  }

  deleteSceneAsAgent(sceneId: string): boolean {
    return this.sceneAgents.delete(sceneId)
  }

  clearAll(): void {
    this.sceneAgents.clear()
  }

  getStatistics(): {
    totalScenes: number
    averageResonanceHistorySize: number
    scenesWithResonanceHistory: number
  } {
    const totalScenes = this.sceneAgents.size
    const scenesWithResonanceHistory = Array.from(this.sceneAgents.values()).filter(
      s => s.resonanceHistory.length > 0
    ).length

    const totalHistorySize = Array.from(this.sceneAgents.values()).reduce(
      (sum, s) => sum + s.resonanceHistory.length,
      0
    )

    const averageResonanceHistorySize = totalScenes > 0
      ? totalHistorySize / totalScenes
      : 0

    return {
      totalScenes,
      averageResonanceHistorySize,
      scenesWithResonanceHistory
    }
  }
}

export const sceneAsAgentManager = new SceneAsAgentManager()
