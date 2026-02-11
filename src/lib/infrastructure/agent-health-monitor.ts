import { AgentHealthStatus, RetryConfig, AgentServiceError } from '@/types/infrastructure'

export class AgentHealthMonitor {
  private healthStatus: Map<string, AgentHealthStatus> = new Map()
  private errorLog: Map<string, AgentServiceError[]> = new Map()
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  }

  registerAgent(agentId: string): void {
    this.healthStatus.set(agentId, {
      agentId,
      isReachable: true,
      lastPing: new Date().toISOString(),
      consecutiveFailures: 0,
      status: 'active'
    })
  }

  unregisterAgent(agentId: string): void {
    this.healthStatus.delete(agentId)
    this.errorLog.delete(agentId)
  }

  async checkAgentHealth(agentId: string): Promise<boolean> {
    const status = this.healthStatus.get(agentId)
    if (!status) {
      return false
    }

    try {
      const response = await fetch(`/api/agents/${agentId}/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        status.isReachable = true
        status.lastPing = new Date().toISOString()
        status.consecutiveFailures = 0
        status.status = 'active'
        return true
      } else {
        this.markAgentUnreachable(agentId, 'error', `HTTP ${response.status}`)
        return false
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.markAgentUnreachable(agentId, 'timeout', 'Request timeout')
      } else {
        this.markAgentUnreachable(agentId, 'unreachable', String(error))
      }
      return false
    }
  }

  private markAgentUnreachable(
    agentId: string,
    errorType: 'timeout' | 'error' | 'unreachable',
    errorMessage: string
  ): void {
    const status = this.healthStatus.get(agentId)
    if (!status) return

    status.isReachable = false
    status.consecutiveFailures++
    status.status = status.consecutiveFailures >= 3 ? 'unavailable' : 'active'

    const error: AgentServiceError = {
      agentId,
      errorType,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }

    if (!this.errorLog.has(agentId)) {
      this.errorLog.set(agentId, [])
    }
    this.errorLog.get(agentId)!.push(error)

    if (status.consecutiveFailures >= this.retryConfig.maxRetries) {
      status.status = 'unavailable'
    }
  }

  async withRetry<T>(
    agentId: string,
    operation: () => Promise<T>
  ): Promise<T | null> {
    let retryCount = 0
    let delay = this.retryConfig.retryDelay

    while (retryCount <= this.retryConfig.maxRetries) {
      try {
        const result = await operation()

        const status = this.healthStatus.get(agentId)
        if (status) {
          status.consecutiveFailures = 0
          status.status = 'active'
          status.lastPing = new Date().toISOString()
        }

        return result
      } catch (error) {
        retryCount++
        
        const status = this.healthStatus.get(agentId)
        if (status) {
          status.consecutiveFailures++
        }

        const errorLog: AgentServiceError = {
          agentId,
          errorType: 'error',
          error: String(error),
          timestamp: new Date().toISOString(),
          retryAttempt: retryCount
        }

        if (!this.errorLog.has(agentId)) {
          this.errorLog.set(agentId, [])
        }
        this.errorLog.get(agentId)!.push(errorLog)

        if (retryCount <= this.retryConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= this.retryConfig.backoffMultiplier
        }
      }
    }

    const status = this.healthStatus.get(agentId)
    if (status) {
      status.status = 'unavailable'
    }

    return null
  }

  getHealthStatus(agentId: string): AgentHealthStatus | undefined {
    return this.healthStatus.get(agentId)
  }

  getAllHealthStatus(): AgentHealthStatus[] {
    return Array.from(this.healthStatus.values())
  }

  getUnavailableAgents(): AgentHealthStatus[] {
    return Array.from(this.healthStatus.values()).filter(s => s.status === 'unavailable')
  }

  getErrorLog(agentId: string): AgentServiceError[] {
    return this.errorLog.get(agentId) || []
  }

  resetAgentStatus(agentId: string): void {
    const status = this.healthStatus.get(agentId)
    if (status) {
      status.consecutiveFailures = 0
      status.status = 'active'
      status.isReachable = true
      status.lastPing = new Date().toISOString()
    }
    this.errorLog.delete(agentId)
  }

  configureRetry(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config }
  }
}

export const agentHealthMonitor = new AgentHealthMonitor()
