const TOWOW_API_URL = process.env.NEXT_PUBLIC_TOWOW_API_URL || 'http://localhost:8000'

import { HDCVector, KStarConfig, ResonanceResult } from '@/types/hdc'
import { hdEncoder } from './hdc/encoder'
import { resonanceEngine } from './hdc/resonance'

export type { KStarConfig }
export { resonanceEngine }

export interface UserInfo {
  name: string
  bio?: string
  avatar?: string
  shades: string[]
}

export interface RequirementFormulation {
  original: string
  enriched: string
  keywords: string[]
  context: Record<string, any>
  confidence: number
}

export interface AgentOffer {
  id: string
  session_id: string
  agent_id: string
  agent_name: string
  offer_content: Record<string, any>
  confidence: number
  resonance_score: number
  created_at: string
}

export interface NegotiationSession {
  id: string
  user_id: string
  requirement: string
  formulated_requirement: Record<string, any>
  status: string
  offers: AgentOffer[]
  final_solution?: Record<string, any>
  error_message?: string
  created_at: string
  completed_at?: string
  expected_agents: number
  collected_offers: number
}

export interface VectorEncodingResponse {
  vector: number[]
  model: string
  dimension: number
}

export interface ResonatingAgent {
  id: string
  name: string
  level: number
  resonance_score: number
  status: string
}

export interface MatchedAgent {
  id: string
  name: string
  avatar?: string
  bio: string
  skills: string[]
  level: number
  satisfaction_rate: number
  response_time_minutes: number
  resonance_score: number
}

export interface OAuth2AuthUrlResponse {
  auth_url: string
}

export interface OAuth2UserInfoResponse {
  user_id: string
  nickname: string
  avatar?: string
  shades: string[]
  soft_memory?: {
    facts: any[]
    relationships: any[]
    preferences: any[]
  }
}

export interface MigrateResponse {
  success: boolean
  message: string
  tables_created: string[]
  tables_existed: string[]
  errors: string[]
}

export class TowowAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${TOWOW_API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '请求失败' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  static async getSecondMeUserInfo(token: string): Promise<UserInfo> {
    return this.request<UserInfo>('/api/secondme/user/info', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  static async getOAuth2AuthUrl(redirectUri: string = 'http://localhost:3000/api/auth/callback'): Promise<OAuth2AuthUrlResponse> {
    return this.request<OAuth2AuthUrlResponse>('/api/secondme/oauth/url', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  static async exchangeOAuth2Code(code: string, state?: string): Promise<OAuth2UserInfoResponse> {
    return this.request<OAuth2UserInfoResponse>('/api/secondme/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    })
  }

  static async migrateDatabase(): Promise<MigrateResponse> {
    return this.request<MigrateResponse>('/api/db/migrate', {
      method: 'POST',
    })
  }

  static async encodeVector(text: string): Promise<VectorEncodingResponse> {
    return this.request<VectorEncodingResponse>('/api/encode/vector', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  static async formulateRequirement(original: string): Promise<RequirementFormulation> {
    return this.request<RequirementFormulation>('/api/formulate/requirement', {
      method: 'POST',
      body: JSON.stringify({ original }),
    })
  }

  static async findResonatingAgents(
    requirementVector: number[],
    limit: number = 10,
    minConfidence: number = 0.3
  ): Promise<AgentOffer[]> {
    return this.request<AgentOffer[]>('/api/negotiation/resonate', {
      method: 'POST',
      body: JSON.stringify({
        requirement_vector: requirementVector,
        limit,
        min_confidence: minConfidence,
      }),
    })
  }

  static async startNegotiation(
    userId: string,
    requirement: string,
    k: number = 5
  ): Promise<{
    sessionId: string
    formulation: string
    matchedAgents: Array<{
      agentId: string
      name: string
      resonanceScore: number
    }>
    status: string
  }> {
    return this.request('/api/negotiation/start', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        requirement,
        k
      }),
    })
  }

  static async getNegotiationStatus(
    sessionId: string
  ): Promise<NegotiationSession> {
    return this.request<NegotiationSession>(`/api/negotiation/${sessionId}/status`)
  }

  static async submitAgentOffer(
    sessionId: string,
    agentId: string,
    agentName: string,
    offerContent: Record<string, any>,
    confidence: number,
    resonanceScore: number
  ): Promise<{ status: string; message: string }> {
    return this.request(`/api/negotiation/${sessionId}/offer`, {
      method: 'POST',
      body: JSON.stringify({
        agent_id: agentId,
        agent_name: agentName,
        offer_content: offerContent,
        confidence,
        resonance_score: resonanceScore,
      }),
    })
  }

  static async syncAgents(): Promise<{
    status: string
    results: {
      total: number
      success: number
      failed: number
      errors: string[]
    }
  }> {
    return this.request('/api/admin/sync-agents', {
      method: 'POST',
    })
  }

  static async createNegotiationSession(
    userId: string,
    requirement: string
  ): Promise<NegotiationSession> {
    return this.request<NegotiationSession>('/api/negotiation/session', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        requirement,
      }),
    })
  }

  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }
}

export async function broadcastRequirement(
  requirement: string,
  kStarConfig: KStarConfig = { k: 10 }
): Promise<{
  formulation: RequirementFormulation
  vector: HDCVector
  agents: AgentOffer[]
}> {
  try {
    const demandVector = await hdEncoder.encodeDemand(requirement)

    const resonanceResults = resonanceEngine.detectResonance(demandVector, kStarConfig)

    const formulation = await TowowAPI.formulateRequirement(requirement)

    const agents: AgentOffer[] = resonanceResults.map((r, idx) => ({
      id: `${Date.now()}-${idx}`,
      session_id: '',
      agent_id: r.agentId,
      agent_name: `Agent ${r.agentId.substring(0, 8)}`,
      offer_content: {},
      confidence: r.score,
      resonance_score: r.score,
      created_at: new Date().toISOString(),
    }))

    return {
      formulation,
      vector: demandVector,
      agents,
    }
  } catch (error) {
    console.error('广播需求失败:', error)
    throw error
  }
}

export async function startRealNegotiation(
  userId: string,
  requirement: string,
  k: number = 5
): Promise<{
  sessionId: string
  formulation: string
  matchedAgents: Array<{
    agentId: string
    name: string
    resonanceScore: number
  }>
  status: string
}> {
  try {
    const result = await TowowAPI.startNegotiation(userId, requirement, k)

    return {
      sessionId: result.sessionId,
      formulation: result.formulation,
      matchedAgents: result.matchedAgents,
      status: result.status,
    }
  } catch (error) {
    console.error('启动协商失败:', error)
    throw error
  }
}

export async function pollNegotiationStatus(
  sessionId: string,
  onProgress?: (session: NegotiationSession) => void,
  interval: number = 1000
): Promise<NegotiationSession> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const session = await TowowAPI.getNegotiationStatus(sessionId)

        if (onProgress) {
          onProgress(session)
        }

        if (
          session.status === 'completed' ||
          session.status === 'failed' ||
          session.status === 'timeout' ||
          session.status === 'insufficient_offers'
        ) {
          resolve(session)
        } else {
          setTimeout(poll, interval)
        }
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}

export async function registerAgentVector(
  agentId: string,
  profileData: any
): Promise<HDCVector> {
  try {
    const vector = await hdEncoder.encodeProfile(profileData)
    resonanceEngine.registerAgent(agentId, vector)
    return vector
  } catch (error) {
    console.error('注册 Agent 向量失败:', error)
    throw error
  }
}
