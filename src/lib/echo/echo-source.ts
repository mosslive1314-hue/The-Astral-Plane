import { EchoEvent, EchoSignal, EchoSubscription, EchoSource, EchoEventType } from '@/types/echo'
import { hdEncoder } from '../hdc/encoder'
import { HDCVector } from '@/types/hdc'

export abstract class BaseEchoSource implements EchoSource {
  protected subscriptions: Map<string, EchoSubscription> = new Map()
  protected signalHistory: Map<string, EchoSignal[]> = new Map()
  protected eventIdCounter = 0

  subscribe(callback: (signal: EchoSignal) => void): EchoSubscription {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const subscription: EchoSubscription = {
      id: subscriptionId,
      agentId: '',
      eventTypes: [],
      callback,
      active: true,
      createdAt: new Date().toISOString()
    }

    this.subscriptions.set(subscriptionId, subscription)

    return subscription
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      subscription.active = false
      this.subscriptions.delete(subscriptionId)
    }
  }

  protected createEventId(): string {
    return `event_${++this.eventIdCounter}`
  }

  protected addToHistory(agentId: string, signal: EchoSignal): void {
    if (!this.signalHistory.has(agentId)) {
      this.signalHistory.set(agentId, [])
    }

    const history = this.signalHistory.get(agentId)!
    history.push(signal)

    if (history.length > 100) {
      history.shift()
    }
  }

  protected async calculateResonance(
    agentId: string,
    event: EchoEvent,
    agentVector?: HDCVector
  ): Promise<number> {
    if (!agentVector) {
      return Promise.resolve(0.5)
    }

    const eventText = this.extractEventText(event)
    const eventVector = hdEncoder.textToHyperVector(
      await hdEncoder.encodeText(eventText)
    )

    return hdEncoder.similarity(agentVector, eventVector)
  }

  private extractEventText(event: EchoEvent): string {
    const textParts: string[] = []

    textParts.push(event.type)

    if (event.data.title) textParts.push(event.data.title)
    if (event.data.description) textParts.push(event.data.description)
    if (event.data.status) textParts.push(event.data.status)
    if (event.data.outcome) textParts.push(event.data.outcome)

    return textParts.join(' ')
  }

  protected determineSignalStrength(resonance: number): 'weak' | 'medium' | 'strong' {
    if (resonance < 0.3) return 'weak'
    if (resonance < 0.7) return 'medium'
    return 'strong'
  }

  abstract publish(event: EchoEvent): Promise<void>

  getSignalHistory(agentId: string): EchoSignal[] {
    return this.signalHistory.get(agentId) || []
  }

  getActiveSubscriptions(): EchoSubscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.active)
  }
}

export class MockEchoSource extends BaseEchoSource {
  private eventLog: EchoEvent[] = []

  async publish(event: EchoEvent): Promise<void> {
    event.id = this.createEventId()
    this.eventLog.push(event)

    console.log('[MockEchoSource] Event published:', {
      type: event.type,
      source: event.source,
      timestamp: event.timestamp
    })
  }

  getEventLog(): EchoEvent[] {
    return [...this.eventLog]
  }

  clearEventLog(): void {
    this.eventLog = []
  }
}

export class WOWOKEchoSource extends BaseEchoSource {
  private mcpClient: any
  private isInitialized = false

  constructor(mcpClient?: any) {
    super()
    if (mcpClient) {
      this.mcpClient = mcpClient
    }
  }

  async initialize(): Promise<boolean> {
    try {
      if (!this.mcpClient) {
        console.log('[WOWOKEchoSource] No MCP client provided, using local simulation')
        this.isInitialized = true
        return true
      }

      await this.mcpClient.connect()
      this.isInitialized = true
      console.log('[WOWOKEchoSource] Initialized successfully')
      return true
    } catch (error) {
      console.error('[WOWOKEchoSource] Initialization failed:', error)
      this.isInitialized = false
      return false
    }
  }

  async publish(event: EchoEvent): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[WOWOKEchoSource] Not initialized, skipping publish')
      return
    }

    event.id = this.createEventId()

    if (!this.mcpClient) {
      this.mockPublish(event)
      return
    }

    try {
      await this.mcpClient.publishEvent(event)
      console.log('[WOWOKEchoSource] Event published to WOWOK chain:', event.id)
    } catch (error) {
      console.error('[WOWOKEchoSource] Failed to publish event:', error)
    }
  }

  private mockPublish(event: EchoEvent): void {
    console.log('[WOWOKEchoSource] Mock publishing event:', {
      type: event.type,
      source: event.source,
      data: event.data
    })
  }

  async subscribeToAgentEvents(
    agentId: string,
    callback: (signal: EchoSignal) => void
  ): Promise<EchoSubscription> {
    const subscription = this.subscribe(callback)
    subscription.agentId = agentId

    subscription.eventTypes = [
      'order_created',
      'progress_updated',
      'task_delivered',
      'contract_completed',
      'payment_settled'
    ]

    if (!this.mcpClient) {
      console.log('[WOWOKEchoSource] Mock subscription for agent:', agentId)
    }

    return subscription
  }

  getSignalHistory(agentId: string): EchoSignal[] {
    return super.getSignalHistory(agentId)
  }

  isConnected(): boolean {
    return this.isInitialized
  }
}

export const createEchoSource = (type: 'mock' | 'wowok', mcpClient?: any): BaseEchoSource => {
  switch (type) {
    case 'mock':
      return new MockEchoSource()
    case 'wowok':
      return new WOWOKEchoSource(mcpClient)
    default:
      return new MockEchoSource()
  }
}
