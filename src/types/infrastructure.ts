export interface AgentHealthStatus {
  agentId: string
  isReachable: boolean
  lastPing: string
  consecutiveFailures: number
  status: 'active' | 'unavailable' | 'exiting'
}

export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
}

export interface AgentServiceError {
  agentId: string
  errorType: 'timeout' | 'error' | 'unreachable'
  error: string
  timestamp: string
  retryAttempt?: number
}
