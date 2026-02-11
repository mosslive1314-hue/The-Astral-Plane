import {
  NegotiationStatus,
  AgentStatus,
  NegotiationSession,
  NegotiationAgent,
  NegotiationRound,
  WaitBarrier
} from '@/types/negotiation'

export class NegotiationStateManager {
  private sessions: Map<string, NegotiationSession> = new Map()
  private agents: Map<string, Map<string, NegotiationAgent>> = new Map()
  private rounds: Map<string, NegotiationRound[]> = new Map()
  private barriers: Map<string, WaitBarrier> = new Map()

  createSession(
    sessionId: string,
    userId: string,
    demandText: string,
    demandVector: number[],
    kStarConfig: { k: number; threshold?: number }
  ): NegotiationSession {
    const session: NegotiationSession = {
      id: sessionId,
      user_id: userId,
      demand_text: demandText,
      demand_vector: demandVector,
      k_star_config: kStarConfig,
      status: 'negotiating',
      created_at: new Date().toISOString()
    }

    this.sessions.set(sessionId, session)
    this.agents.set(sessionId, new Map())
    this.rounds.set(sessionId, [])

    return session
  }

  getSession(sessionId: string): NegotiationSession | undefined {
    return this.sessions.get(sessionId)
  }

  updateSessionStatus(sessionId: string, status: NegotiationStatus): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = status
      if (status === 'completed') {
        session.completed_at = new Date().toISOString()
      }
    }
  }

  registerAgent(
    sessionId: string,
    agentId: string,
    resonanceScore: number
  ): NegotiationAgent {
    const agent: NegotiationAgent = {
      id: `${sessionId}-${agentId}`,
      session_id: sessionId,
      agent_id: agentId,
      status: 'active',
      resonance_score: resonanceScore,
      created_at: new Date().toISOString()
    }

    const agents = this.agents.get(sessionId)
    if (agents) {
      agents.set(agentId, agent)
    }

    return agent
  }

  updateAgentStatus(
    sessionId: string,
    agentId: string,
    status: AgentStatus
  ): void {
    const agents = this.agents.get(sessionId)
    const agent = agents?.get(agentId)

    if (agent) {
      agent.status = status
      if (status === 'replied') {
        agent.replied_at = new Date().toISOString()
      } else if (status === 'exited') {
        agent.exited_at = new Date().toISOString()
      }
    }
  }

  submitOffer(
    sessionId: string,
    agentId: string,
    offer: Record<string, any>
  ): void {
    const agents = this.agents.get(sessionId)
    const agent = agents?.get(agentId)

    if (agent) {
      agent.offer = offer
      agent.status = 'replied'
      agent.replied_at = new Date().toISOString()
    }
  }

  agentExit(sessionId: string, agentId: string): void {
    this.updateAgentStatus(sessionId, agentId, 'exited')
    this.removeFromBarrier(sessionId, agentId)
  }

  createWaitBarrier(
    sessionId: string,
    pendingAgentIds: string[],
    onComplete: () => void
  ): WaitBarrier {
    const pendingAgentsSet = new Set(pendingAgentIds)
    const barrier: WaitBarrier = {
      sessionId,
      pendingAgents: pendingAgentsSet,
      onAgentResponse: (agentId: string, response: any) => {
        pendingAgentsSet.delete(agentId)
        if (pendingAgentsSet.size === 0) {
          onComplete()
        }
      },
      onAgentExit: (agentId: string) => {
        pendingAgentsSet.delete(agentId)
        if (pendingAgentsSet.size === 0) {
          onComplete()
        }
      },
      onComplete
    }

    this.barriers.set(sessionId, barrier)
    return barrier
  }

  removeFromBarrier(sessionId: string, agentId: string): void {
    const barrier = this.barriers.get(sessionId)
    if (barrier) {
      barrier.onAgentExit(agentId)
    }
  }

  agentResponded(sessionId: string, agentId: string, response: any): void {
    const barrier = this.barriers.get(sessionId)
    if (barrier) {
      barrier.onAgentResponse(agentId, response)
    }
  }

  getActiveAgents(sessionId: string): NegotiationAgent[] {
    const agents = this.agents.get(sessionId)
    if (!agents) return []

    return Array.from(agents.values()).filter(a => a.status !== 'exited')
  }

  getRepliedAgents(sessionId: string): NegotiationAgent[] {
    const agents = this.agents.get(sessionId)
    if (!agents) return []

    return Array.from(agents.values()).filter(a => a.status === 'replied')
  }

  getPendingAgents(sessionId: string): string[] {
    const barrier = this.barriers.get(sessionId)
    if (!barrier) return []

    return Array.from(barrier.pendingAgents)
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.agents.delete(sessionId)
    this.rounds.delete(sessionId)
    this.barriers.delete(sessionId)
  }

  getSessionStats(sessionId: string): {
    totalAgents: number
    activeAgents: number
    repliedAgents: number
    exitedAgents: number
  } | null {
    const agents = this.agents.get(sessionId)
    if (!agents) return null

    const allAgents = Array.from(agents.values())
    return {
      totalAgents: allAgents.length,
      activeAgents: allAgents.filter(a => a.status === 'active').length,
      repliedAgents: allAgents.filter(a => a.status === 'replied').length,
      exitedAgents: allAgents.filter(a => a.status === 'exited').length
    }
  }
}

export const negotiationStateManager = new NegotiationStateManager()
