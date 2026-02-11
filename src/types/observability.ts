export interface NegotiationTrace {
  negotiationId: string
  userId: string
  demandText: string
  startTime: string
  endTime?: string
  duration?: number
  stages: NegotiationStageTrace[]
  result: NegotiationResult
  metadata: {
    kStarValue: number
    thresholdUsed: number
    agentCount: number
    roundCount: number
  }
}

export interface NegotiationStageTrace {
  stageName: string
  stageType: 'formulation' | 'resonance' | 'offer_collection' | 'center_synthesis' | 'result'
  startTime: string
  endTime?: string
  duration?: number
  details: Record<string, any>
}

export interface NegotiationResult {
  status: 'pending' | 'success' | 'partial' | 'failed'
  outputType: 'plan' | 'machine_draft' | 'triggered_sub_demands'
  finalOutput?: any
  userFeedback?: 'accepted' | 'rejected' | 'modified' | 'pending'
  gapCount: number
  subDemandIds: string[]
}

export interface MetricsQuery {
  metric: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  groupBy?: string
  timeRange?: {
    start: string
    end: string
  }
  filters?: Record<string, any>
}

export interface MetricsResult {
  metric: string
  value: number
  timestamp: string
  dimensions?: Record<string, any>
}

export interface KPIDefinition {
  name: string
  description: string
  formula: string
  unit: string
  category: 'resonance' | 'offer_quality' | 'center_quality' | 'execution' | 'cost'
}

export const KPIS: KPIDefinition[] = [
  {
    name: 'resonance_precision_rate',
    description: '共振精准率 - Tier 2 通过 Agent 中 Offer 被 Center 采纳的比例',
    formula: 'adopted_offers / tier2_passed_agents',
    unit: 'percentage',
    category: 'resonance'
  },
  {
    name: 'surprise_discovery_rate',
    description: '意外发现率 - 最终方案中用户没有明确要求的参与者比例',
    formula: 'unexpected_participants / total_participants',
    unit: 'percentage',
    category: 'resonance'
  },
  {
    name: 'offer_adoption_rate',
    description: 'Offer 采纳率 - Center 使用的 Offer 数 / 收到的 Offer 数',
    formula: 'adopted_offers / total_offers',
    unit: 'percentage',
    category: 'offer_quality'
  },
  {
    name: 'plan_acceptance_rate',
    description: '方案接受率 - 用户接受数 / 总方案数',
    formula: 'accepted_plans / total_plans',
    unit: 'percentage',
    category: 'center_quality'
  },
  {
    name: 'formulation_modification_rate',
    description: 'Formulation 修改率 - 用户修改次数分布',
    formula: 'total_modifications / total_formulations',
    unit: 'percentage',
    category: 'offer_quality'
  },
  {
    name: 'execution_success_rate',
    description: '执行成功率 - 正面回声 / 总回声',
    formula: 'positive_echoes / total_echoes',
    unit: 'percentage',
    category: 'execution'
  },
  {
    name: 'negotiation_cost',
    description: '协商成本 - 每个成功协商的 LLM 成本',
    formula: 'total_tokens * token_price',
    unit: 'usd',
    category: 'cost'
  }
]
