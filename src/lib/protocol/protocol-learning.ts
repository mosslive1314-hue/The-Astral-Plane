import { metricsCollector } from '../observability/metrics-collector'

export interface LearningRecord {
  id: string
  type: 'k_star_optimization' | 'formulation_pattern' | 'center_tool_pattern' | 'scene_failure'
  sceneId?: string
  negotiationId?: string
  data: Record<string, any>
  timestamp: string
  outcome: 'success' | 'failure' | 'partial'
}

export interface KStarLearningData {
  sceneId: string
  kValue: number
  minThreshold?: number
  maxThreshold?: number
  successRate: number
  averageResonanceScore: number
  participantCount: number
  negotiationCount: number
  timestamp: string
}

export interface FormulationPatternData {
  patternId: string
  patternType: string
  clarifications: string[]
  confirmationRate: number
  averageModificationCount: number
  userSatisfaction: number
  usageCount: number
  timestamp: string
}

export interface CenterToolPatternData {
  toolName: string
  callContext: string
  successRate: number
  averageExecutionTime: number
  userActionType: string
  usageCount: number
  timestamp: string
}

export interface SceneFailureAnalysis {
  sceneId: string
  failureType: string
  failureReason: string
  negotiationId?: string
  affectedUsers: number
  timestamp: string
  suggestedFixes: string[]
}

export interface ProtocolInsight {
  category: 'k_star' | 'formulation' | 'center_tools' | 'scene_management'
  insight: string
  confidence: number
  supportingData: Record<string, any>
  recommendedActions: string[]
  timestamp: string
}

export class ProtocolLearningEngine {
  private learningRecords: Map<string, LearningRecord> = new Map()
  private kStarData: Map<string, KStarLearningData[]> = new Map()
  private formulationPatterns: Map<string, FormulationPatternData[]> = new Map()
  private centerToolPatterns: Map<string, CenterToolPatternData[]> = new Map()
  private sceneFailures: Map<string, SceneFailureAnalysis[]> = new Map()

  recordKStarUsage(data: Omit<KStarLearningData, 'timestamp'>): void {
    const record: KStarLearningData = {
      ...data,
      timestamp: new Date().toISOString()
    }

    const key = data.sceneId
    const existing = this.kStarData.get(key) || []
    existing.push(record)
    this.kStarData.set(key, existing)

    this.recordLearning({
      type: 'k_star_optimization',
      sceneId: data.sceneId,
      data: record,
      outcome: 'success',
      timestamp: record.timestamp
    })
  }

  getOptimalKStarForScene(sceneId: string): {
    recommendedK: number
    recommendedThreshold?: number
    confidence: number
    reasoning: string
  } | null {
    const records = this.kStarData.get(sceneId)
    if (!records || records.length === 0) {
      return null
    }

    const kValueGroups = new Map<number, KStarLearningData[]>()

    for (const record of records) {
      const group = kValueGroups.get(record.kValue) || []
      group.push(record)
      kValueGroups.set(record.kValue, group)
    }

    let bestK = 0
    let bestScore = 0
    let bestThreshold: number | undefined

    for (const [kValue, group] of kValueGroups.entries()) {
      const avgSuccessRate = group.reduce((sum, r) => sum + r.successRate, 0) / group.length
      const avgResonance = group.reduce((sum, r) => sum + r.averageResonanceScore, 0) / group.length

      const score = avgSuccessRate * 0.7 + avgResonance * 0.3

      if (score > bestScore) {
        bestScore = score
        bestK = kValue
        bestThreshold = group[0].minThreshold
      }
    }

    const confidence = Math.min(records.length / 10, 1)

    return {
      recommendedK: bestK,
      recommendedThreshold: bestThreshold,
      confidence,
      reasoning: `Based on ${records.length} historical negotiations, k=${bestK} achieved best success rate`
    }
  }

  recordFormulationPattern(data: Omit<FormulationPatternData, 'timestamp'>): void {
    const record: FormulationPatternData = {
      ...data,
      timestamp: new Date().toISOString()
    }

    const key = data.patternType
    const existing = this.formulationPatterns.get(key) || []
    existing.push(record)
    this.formulationPatterns.set(key, existing)

    this.recordLearning({
      type: 'formulation_pattern',
      data: record,
      outcome: record.confirmationRate > 0.7 ? 'success' : 'partial',
      timestamp: record.timestamp
    })
  }

  getEffectiveFormulationPatterns(): Array<{
    patternType: string
    effectiveness: number
    recommended: boolean
    sampleSize: number
  }> {
    const results: Array<{
      patternType: string
      effectiveness: number
      recommended: boolean
      sampleSize: number
    }> = []

    for (const [patternType, records] of this.formulationPatterns.entries()) {
      const avgConfirmationRate = records.reduce((sum, r) => sum + r.confirmationRate, 0) / records.length
      const avgSatisfaction = records.reduce((sum, r) => sum + r.userSatisfaction, 0) / records.length
      const effectiveness = (avgConfirmationRate * 0.6) + (avgSatisfaction * 0.4)

      results.push({
        patternType,
        effectiveness,
        recommended: effectiveness > 0.7 && records.length >= 5,
        sampleSize: records.length
      })
    }

    return results.sort((a, b) => b.effectiveness - a.effectiveness)
  }

  recordCenterToolUsage(data: Omit<CenterToolPatternData, 'timestamp'>): void {
    const record: CenterToolPatternData = {
      ...data,
      timestamp: new Date().toISOString()
    }

    const key = data.toolName
    const existing = this.centerToolPatterns.get(key) || []
    existing.push(record)
    this.centerToolPatterns.set(key, existing)

    this.recordLearning({
      type: 'center_tool_pattern',
      negotiationId: data.callContext,
      data: record,
      outcome: record.successRate > 0.8 ? 'success' : 'partial',
      timestamp: record.timestamp
    })
  }

  getCenterToolInsights(): Array<{
    toolName: string
    averageSuccessRate: number
    optimalContexts: string[]
    averageExecutionTime: number
    totalUsage: number
  }> {
    const insights: Array<{
      toolName: string
      averageSuccessRate: number
      optimalContexts: string[]
      averageExecutionTime: number
      totalUsage: number
    }> = []

    for (const [toolName, records] of this.centerToolPatterns.entries()) {
      const avgSuccessRate = records.reduce((sum, r) => sum + r.successRate, 0) / records.length
      const avgExecutionTime = records.reduce((sum, r) => sum + r.averageExecutionTime, 0) / records.length

      const contextGroups = new Map<string, number>()
      for (const record of records) {
        const count = contextGroups.get(record.callContext) || 0
        contextGroups.set(record.callContext, count + 1)
      }

      const optimalContexts = Array.from(contextGroups.entries())
        .filter(([_, count]) => count >= 3)
        .map(([context, _]) => context)
        .slice(0, 5)

      insights.push({
        toolName,
        averageSuccessRate: avgSuccessRate,
        optimalContexts,
        averageExecutionTime: avgExecutionTime,
        totalUsage: records.length
      })
    }

    return insights.sort((a, b) => b.averageSuccessRate - a.averageSuccessRate)
  }

  recordSceneFailure(data: Omit<SceneFailureAnalysis, 'timestamp'>): void {
    const record: SceneFailureAnalysis = {
      ...data,
      timestamp: new Date().toISOString()
    }

    const key = data.sceneId
    const existing = this.sceneFailures.get(key) || []
    existing.push(record)
    this.sceneFailures.set(key, existing)

    this.recordLearning({
      type: 'scene_failure',
      sceneId: data.sceneId,
      negotiationId: data.negotiationId,
      data: record,
      outcome: 'failure',
      timestamp: record.timestamp
    })
  }

  analyzeSceneFailures(sceneId?: string): Array<{
    failureType: string
    frequency: number
    severity: 'high' | 'medium' | 'low'
    commonCauses: string[]
    suggestedFixes: string[]
  }> {
    const allFailures: SceneFailureAnalysis[] = []

    if (sceneId) {
      allFailures.push(...(this.sceneFailures.get(sceneId) || []))
    } else {
      for (const failures of this.sceneFailures.values()) {
        allFailures.push(...failures)
      }
    }

    const failureGroups = new Map<string, SceneFailureAnalysis[]>()

    for (const failure of allFailures) {
      const group = failureGroups.get(failure.failureType) || []
      group.push(failure)
      failureGroups.set(failure.failureType, group)
    }

    const analyses: Array<{
      failureType: string
      frequency: number
      severity: 'high' | 'medium' | 'low'
      commonCauses: string[]
      suggestedFixes: string[]
    }> = []

    for (const [failureType, failures] of failureGroups.entries()) {
      const severity = failures.length > 10 ? 'high' : failures.length > 5 ? 'medium' : 'low'

      const reasonGroups = new Map<string, number>()
      for (const failure of failures) {
        const count = reasonGroups.get(failure.failureReason) || 0
        reasonGroups.set(failure.failureReason, count + 1)
      }

      const commonCauses = Array.from(reasonGroups.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason, _]) => reason)

      const allFixes = failures.flatMap(f => f.suggestedFixes)
      const suggestedFixes = [...new Set(allFixes)].slice(0, 5)

      analyses.push({
        failureType,
        frequency: failures.length,
        severity,
        commonCauses,
        suggestedFixes
      })
    }

    return analyses.sort((a, b) => b.frequency - a.frequency)
  }

  generateProtocolInsights(): ProtocolInsight[] {
    const insights: ProtocolInsight[] = []

    const optimalKStars = this.getOptimalKStarForScene('all')
    if (optimalKStars) {
      insights.push({
        category: 'k_star',
        insight: `Recommended k* value is ${optimalKStars.recommendedK} with ${Math.round(optimalKStars.confidence * 100)}% confidence`,
        confidence: optimalKStars.confidence,
        supportingData: optimalKStars,
        recommendedActions: [
          `Use k=${optimalKStars.recommendedK} as default for new scenes`,
          'Monitor success rates to validate recommendation'
        ],
        timestamp: new Date().toISOString()
      })
    }

    const effectivePatterns = this.getEffectiveFormulationPatterns()
    const topPatterns = effectivePatterns.filter(p => p.recommended).slice(0, 3)
    if (topPatterns.length > 0) {
      insights.push({
        category: 'formulation',
        insight: `${topPatterns.length} formulation patterns show high effectiveness (>70%)`,
        confidence: Math.min(topPatterns.reduce((sum, p) => sum + p.effectiveness, 0) / topPatterns.length, 1),
        supportingData: { patterns: topPatterns },
        recommendedActions: topPatterns.map(p => `Prioritize pattern: ${p.patternType}`),
        timestamp: new Date().toISOString()
      })
    }

    const toolInsights = this.getCenterToolInsights()
    const lowSuccessTools = toolInsights.filter(t => t.averageSuccessRate < 0.6)
    if (lowSuccessTools.length > 0) {
      insights.push({
        category: 'center_tools',
        insight: `${lowSuccessTools.length} tools have below-average success rates and may need optimization`,
        confidence: 0.8,
        supportingData: { tools: lowSuccessTools },
        recommendedActions: lowSuccessTools.map(t => `Review and optimize: ${t.toolName}`),
        timestamp: new Date().toISOString()
      })
    }

    const failureAnalyses = this.analyzeSceneFailures()
    const criticalFailures = failureAnalyses.filter(f => f.severity === 'high')
    if (criticalFailures.length > 0) {
      insights.push({
        category: 'scene_management',
        insight: `${criticalFailures.length} failure types require immediate attention`,
        confidence: 1,
        supportingData: { failures: criticalFailures },
        recommendedActions: criticalFailures.flatMap(f => f.suggestedFixes).slice(0, 5),
        timestamp: new Date().toISOString()
      })
    }

    return insights
  }

  private recordLearning(record: Omit<LearningRecord, 'id'>): void {
    const fullRecord: LearningRecord = {
      ...record,
      id: `lr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    this.learningRecords.set(fullRecord.id, fullRecord)
  }

  getLearningRecords(filters?: {
    type?: LearningRecord['type']
    sceneId?: string
    outcome?: LearningRecord['outcome']
    limit?: number
  }): LearningRecord[] {
    let records = Array.from(this.learningRecords.values())

    if (filters?.type) {
      records = records.filter(r => r.type === filters.type)
    }

    if (filters?.sceneId) {
      records = records.filter(r => r.sceneId === filters.sceneId)
    }

    if (filters?.outcome) {
      records = records.filter(r => r.outcome === filters.outcome)
    }

    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    if (filters?.limit) {
      records = records.slice(0, filters.limit)
    }

    return records
  }

  clearLearningData(): void {
    this.learningRecords.clear()
    this.kStarData.clear()
    this.formulationPatterns.clear()
    this.centerToolPatterns.clear()
    this.sceneFailures.clear()
  }

  exportLearningData(): Record<string, any> {
    return {
      kStarData: Array.from(this.kStarData.entries()),
      formulationPatterns: Array.from(this.formulationPatterns.entries()),
      centerToolPatterns: Array.from(this.centerToolPatterns.entries()),
      sceneFailures: Array.from(this.sceneFailures.entries()),
      learningRecords: Array.from(this.learningRecords.values())
    }
  }

  importLearningData(data: Record<string, any>): void {
    if (data.kStarData) {
      for (const [key, value] of data.kStarData) {
        this.kStarData.set(key, value as KStarLearningData[])
      }
    }

    if (data.formulationPatterns) {
      for (const [key, value] of data.formulationPatterns) {
        this.formulationPatterns.set(key, value as FormulationPatternData[])
      }
    }

    if (data.centerToolPatterns) {
      for (const [key, value] of data.centerToolPatterns) {
        this.centerToolPatterns.set(key, value as CenterToolPatternData[])
      }
    }

    if (data.sceneFailures) {
      for (const [key, value] of data.sceneFailures) {
        this.sceneFailures.set(key, value as SceneFailureAnalysis[])
      }
    }

    if (data.learningRecords) {
      for (const record of data.learningRecords) {
        this.learningRecords.set(record.id, record as LearningRecord)
      }
    }
  }
}

export const protocolLearningEngine = new ProtocolLearningEngine()
