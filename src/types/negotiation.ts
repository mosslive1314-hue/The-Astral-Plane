export type NegotiationStatus = 'negotiating' | 'completed'

export type AgentStatus = 'active' | 'replied' | 'exited'

export interface NegotiationSession {
  id: string
  user_id: string
  demand_text: string
  demand_vector: number[]
  k_star_config: {
    k: number
    threshold?: number
  }
  status: NegotiationStatus
  created_at: string
  completed_at?: string
}

export interface NegotiationAgent {
  id: string
  session_id: string
  agent_id: string
  status: AgentStatus
  resonance_score: number
  offer?: Record<string, any>
  created_at: string
  replied_at?: string
  exited_at?: string
}

export interface NegotiationRound {
  id: string
  session_id: string
  round_number: number
  message: string
  agent_responses: Map<string, Record<string, any>>
  created_at: string
}

export interface WaitBarrier {
  sessionId: string
  pendingAgents: Set<string>
  onAgentResponse: (agentId: string, response: any) => void
  onAgentExit: (agentId: string) => void
  onComplete: () => void
}
