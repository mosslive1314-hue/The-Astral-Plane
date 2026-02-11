export interface ToolCall {
  tool: string
  parameters: Record<string, any>
  result?: any
  timestamp: string
}

export interface PlanOutput {
  type: 'plan'
  content: string
  summary?: string
}

export interface MachineConfig {
  type: 'contract'
  title: string
  description: string
  participants: string[]
  tasks: MachineTask[]
  timeline?: string
  payment?: PaymentConfig
}

export interface MachineTask {
  id: string
  title: string
  description: string
  assignee?: string
  deadline?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

export interface PaymentConfig {
  currency: string
  total: number
  distribution: Record<string, number>
}

export interface AgentQuestion {
  agent_id: string
  question: string
  context?: Record<string, any>
}

export interface DiscoveryConfig {
  agent_a: string
  agent_b: string
  reason: string
  max_rounds?: number
}

export interface SubDemandConfig {
  parent_demand_id: string
  gap_description: string
  priority?: 'high' | 'medium' | 'low'
}

export interface CenterContext {
  demand_text: string
  offers: AgentOffer[]
  user_preferences?: Record<string, any>
  constraints?: Record<string, any>
  round_number: number
  max_rounds: number
  previous_plans?: string[]
}

export interface AgentOffer {
  agent_id: string
  agent_name: string
  offer_content: Record<string, any>
  confidence: number
  resonance_score: number
}

export interface ToolExecutionResult {
  tool: string
  success: boolean
  result?: any
  error?: string
  timestamp: string
}
