export interface HDCVector {
  data: number[]
  dimension: number
}

export interface ProfileData {
  userId: string
  displayName: string
  skills: string[]
  experiences: string[]
  preferences: string[]
  values?: string[]
  projects?: string[]
  socialConnections?: string[]
  metadata?: Record<string, any>
}

export interface Lens {
  type: 'full_dimension' | 'focus'
  domain?: string
}

export interface ResonanceScore {
  agentId: string
  score: number
  normalized: number
}

export interface KStarConfig {
  k: number
  minThreshold?: number
  maxThreshold?: number
}

export interface ResonanceResult {
  agentId: string
  resonated: boolean
  score: number
  threshold: number
}
