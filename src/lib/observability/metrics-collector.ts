import {
  NegotiationTrace,
  NegotiationStageTrace,
  NegotiationResult,
  MetricsQuery,
  MetricsResult,
  KPIDefinition,
  KPIS
} from '@/types/observability'

export class MetricsCollector {
  private traces: Map<string, NegotiationTrace> = new Map()
  private stageTraces: Map<string, NegotiationStageTrace[]> = new Map()
  private metrics: Map<string, MetricsResult[]> = new Map()

  startTrace(
    negotiationId: string,
    userId: string,
    demandText: string,
    metadata: any
  ): NegotiationTrace {
    const trace: NegotiationTrace = {
      negotiationId,
      userId,
      demandText,
      startTime: new Date().toISOString(),
      stages: [],
      result: {
        status: 'pending',
        outputType: 'plan',
        gapCount: 0,
        subDemandIds: []
      },
      metadata
    }

    this.traces.set(negotiationId, trace)
    return trace
  }

  endTrace(
    negotiationId: string,
    result: Partial<NegotiationResult>
  ): NegotiationTrace | null {
    const trace = this.traces.get(negotiationId)
    if (!trace) return null

    trace.endTime = new Date().toISOString()
    trace.duration = new Date(trace.endTime).getTime() - new Date(trace.startTime).getTime()
    trace.result = { ...trace.result, ...result }

    return trace
  }

  startStage(
    negotiationId: string,
    stageName: string,
    stageType: NegotiationStageTrace['stageType']
  ): NegotiationStageTrace {
    const stage: NegotiationStageTrace = {
      stageName,
      stageType,
      startTime: new Date().toISOString(),
      details: {}
    }

    if (!this.stageTraces.has(negotiationId)) {
      this.stageTraces.set(negotiationId, [])
    }

    this.stageTraces.get(negotiationId)!.push(stage)

    return stage
  }

  endStage(
    negotiationId: string,
    stageName: string,
    details: Record<string, any>
  ): NegotiationStageTrace | null {
    const stages = this.stageTraces.get(negotiationId)
    if (!stages) return null

    const stage = stages.find(s => s.stageName === stageName)
    if (!stage) return null

    stage.endTime = new Date().toISOString()
    stage.duration = new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()
    stage.details = { ...stage.details, ...details }

    return stage
  }

  recordMetric(
    metric: string,
    value: number,
    dimensions?: Record<string, any>
  ): void {
    const result: MetricsResult = {
      metric,
      value,
      timestamp: new Date().toISOString(),
      dimensions
    }

    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, [])
    }

    this.metrics.get(metric)!.push(result)
  }

  async queryMetrics(query: MetricsQuery): Promise<MetricsResult[]> {
    let results = this.metrics.get(query.metric) || []

    if (query.filters) {
      results = this.applyFilters(results, query.filters)
    }

    if (query.timeRange) {
      results = this.applyTimeRange(results, query.timeRange)
    }

    return this.aggregate(results, query.aggregation)
  }

  private applyFilters(
    results: MetricsResult[],
    filters: Record<string, any>
  ): MetricsResult[] {
    return results.filter(result => {
      for (const [key, value] of Object.entries(filters)) {
        if (result.dimensions?.[key] !== value) {
          return false
        }
      }
      return true
    })
  }

  private applyTimeRange(
    results: MetricsResult[],
    timeRange: { start: string; end: string }
  ): MetricsResult[] {
    const start = new Date(timeRange.start).getTime()
    const end = new Date(timeRange.end).getTime()

    return results.filter(result => {
      const timestamp = new Date(result.timestamp).getTime()
      return timestamp >= start && timestamp <= end
    })
  }

  private aggregate(
    results: MetricsResult[],
    aggregation?: MetricsQuery['aggregation']
  ): MetricsResult[] {
    if (!aggregation || aggregation === 'count' || results.length === 0) {
      return results
    }

    const values = results.map(r => r.value)

    let aggregatedValue: number

    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((sum, v) => sum + v, 0)
        break
      case 'avg':
        aggregatedValue = values.reduce((sum, v) => sum + v, 0) / values.length
        break
      case 'min':
        aggregatedValue = Math.min(...values)
        break
      case 'max':
        aggregatedValue = Math.max(...values)
        break
      default:
        aggregatedValue = values.reduce((sum, v) => sum + v, 0) / values.length
    }

    return [{
      metric: results[0].metric,
      value: aggregatedValue,
      timestamp: new Date().toISOString()
    }]
  }

  calculateKPI(kpiName: string, filters?: Record<string, any>): number | null {
    const kpi = KPIS.find(k => k.name === kpiName)
    if (!kpi) {
      console.warn(`KPI not found: ${kpiName}`)
      return null
    }

    const variables = this.extractKPIVariables(kpi.formula, filters)
    return this.evaluateFormula(kpi.formula, variables)
  }

  private extractKPIVariables(
    formula: string,
    filters?: Record<string, any>
  ): Record<string, number> {
    const variables: Record<string, number> = {}

    const traces = Array.from(this.traces.values())
    const filteredTraces = filters ? 
      traces.filter(t => this.matchesFilters(t, filters)) : 
      traces

    const tier2Agents = traces.reduce((sum, t) => 
      sum + (t.metadata.agentCount || 0), 0
    )

    variables['tier2_passed_agents'] = tier2Agents
    variables['total_offers'] = traces.reduce((sum, t) => 
      sum + (t.stages.find(s => s.stageType === 'offer_collection')?.details?.offerCount || 0), 0
    )

    return variables
  }

  private evaluateFormula(formula: string, variables: Record<string, number>): number {
    const safeFormula = formula.replace(/(\w+)/g, (match) => {
      return variables[match] !== undefined ? variables[match].toString() : '0'
    })

    try {
      return eval(safeFormula)
    } catch (error) {
      console.error('Formula evaluation failed:', formula, error)
      return 0
    }
  }

  private matchesFilters(trace: NegotiationTrace, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if ((trace.metadata as Record<string, any>)[key] !== value) {
        return false
      }
    }
    return true
  }

  getTrace(negotiationId: string): NegotiationTrace | undefined {
    return this.traces.get(negotiationId)
  }

  getAllTraces(): NegotiationTrace[] {
    return Array.from(this.traces.values())
  }

  exportTraces(format: 'json' | 'csv' = 'json'): string {
    const traces = Array.from(this.traces.values())

    if (format === 'json') {
      return JSON.stringify(traces, null, 2)
    }

    return this.tracesToCSV(traces)
  }

  private tracesToCSV(traces: NegotiationTrace[]): string {
    const headers = ['negotiationId', 'userId', 'demandText', 'startTime', 'endTime', 'duration', 'status', 'outputType', 'gapCount']
    const rows = traces.map(t => [
      t.negotiationId,
      t.userId,
      t.demandText.substring(0, 50),
      t.startTime,
      t.endTime || '',
      t.duration || 0,
      t.result.status,
      t.result.outputType,
      t.result.gapCount
    ])

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  clearTraces(): void {
    this.traces.clear()
    this.stageTraces.clear()
    this.metrics.clear()
  }
}

export const metricsCollector = new MetricsCollector()
