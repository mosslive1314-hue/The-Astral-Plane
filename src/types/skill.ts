export interface SkillInterface {
  name: string
  role: string
  responsibility: string
  inputType: string
  outputType: string
  principles: string[]
  constraints: string[]
  invocationPhase: string
}

export interface SkillContext {
  userId: string
  sessionId: string
  roundNumber: number
  timestamp: string
  metadata?: Record<string, any>
}

export interface SkillResult {
  success: boolean
  data?: any
  error?: string
  reasoning?: string
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  timestamp: string
}

export interface SkillExecutionConfig {
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}
