import { ProtocolEvent, EventSubscription, FormulationResult, ResonanceActivationData, OfferReceivedData, CenterToolCallData, PlanReadyData, SubNegotiationStartedData, ExecutionProgressData, EchoReceivedData } from '@/types/scene'
import { v4 as uuidv4 } from 'uuid'

export class ProtocolEventBus {
  private subscriptions: Map<string, EventSubscription> = new Map()
  private eventHistory: ProtocolEvent[] = []
  private maxHistorySize: number = 1000

  subscribe(
    callback: (event: ProtocolEvent) => void,
    filters?: {
      negotiationId?: string
      sceneId?: string
      eventTypes?: string[]
    }
  ): string {
    const subscriptionId = uuidv4()
    const subscription: EventSubscription = {
      id: subscriptionId,
      callback,
      filters
    }

    this.subscriptions.set(subscriptionId, subscription)

    return subscriptionId
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId)
  }

  publish(event: ProtocolEvent): void {
    this.addToHistory(event)

    for (const subscription of this.subscriptions.values()) {
      if (this.shouldDeliver(event, subscription)) {
        try {
          subscription.callback(event)
        } catch (error) {
          console.error('[ProtocolEventBus] Error in subscriber callback:', error)
        }
      }
    }
  }

  private shouldDeliver(event: ProtocolEvent, subscription: EventSubscription): boolean {
    if (!subscription.filters) {
      return true
    }

    const { eventTypes, negotiationId, sceneId } = subscription.filters

    if (eventTypes && !eventTypes.includes(event.type)) {
      return false
    }

    if (negotiationId) {
      const eventData = event.data as any
      if (eventData.negotiationId !== negotiationId) {
        return false
      }
    }

    if (sceneId) {
      const eventData = event.data as any
      if (eventData.sceneId && eventData.sceneId !== sceneId) {
        return false
      }
    }

    return true
  }

  private addToHistory(event: ProtocolEvent): void {
    this.eventHistory.push(event)

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
  }

  getEventHistory(filters?: {
    eventType?: string
    negotiationId?: string
    limit?: number
  }): ProtocolEvent[] {
    let filtered = [...this.eventHistory]

    if (filters?.eventType) {
      filtered = filtered.filter(e => e.type === filters.eventType)
    }

    if (filters?.negotiationId) {
      filtered = filtered.filter(e => {
        const data = e.data as any
        return data.negotiationId === filters.negotiationId
      })
    }

    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit)
    }

    return filtered
  }

  clearHistory(): void {
    this.eventHistory = []
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size
  }

  clearAllSubscriptions(): void {
    this.subscriptions.clear()
  }

  publishFormulationReady(data: FormulationResult): void {
    this.publish({
      type: 'formulation.ready',
      data
    })
  }

  publishResonanceActivated(data: ResonanceActivationData): void {
    this.publish({
      type: 'resonance.activated',
      data
    })
  }

  publishOfferReceived(data: OfferReceivedData): void {
    this.publish({
      type: 'offer.received',
      data
    })
  }

  publishBarrierComplete(data: { negotiationId: string; totalOffers: number }): void {
    this.publish({
      type: 'barrier.complete',
      data
    })
  }

  publishCenterToolCall(data: CenterToolCallData): void {
    this.publish({
      type: 'center.tool_call',
      data
    })
  }

  publishPlanReady(data: PlanReadyData): void {
    this.publish({
      type: 'plan.ready',
      data
    })
  }

  publishSubNegotiationStarted(data: SubNegotiationStartedData): void {
    this.publish({
      type: 'sub_negotiation.started',
      data
    })
  }

  publishExecutionProgress(data: ExecutionProgressData): void {
    this.publish({
      type: 'execution.progress',
      data
    })
  }

  publishEchoReceived(data: EchoReceivedData): void {
    this.publish({
      type: 'echo.received',
      data
    })
  }
}

export const protocolEventBus = new ProtocolEventBus()
