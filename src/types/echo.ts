export interface EchoEvent {
  id: string
  type: EchoEventType
  source: string
  data: Record<string, any>
  timestamp: string
}

export type EchoEventType = 
  | 'order_created'
  | 'progress_updated'
  | 'task_delivered'
  | 'contract_completed'
  | 'payment_settled'
  | 'service_presented'
  | 'arbitration_result'

export interface EchoSignal {
  eventId: string
  eventType: EchoEventType
  agentId: string
  resonance: number
  signalStrength: 'weak' | 'medium' | 'strong'
  projection: {
    dimensions: string[]
    features: Record<string, number>
  }
  timestamp: string
}

export interface EchoSubscription {
  id: string
  agentId: string
  eventTypes: EchoEventType[]
  callback: (signal: EchoSignal) => void
  active: boolean
  createdAt: string
}

export interface EchoSource {
  subscribe(callback: (signal: EchoSignal) => void): EchoSubscription
  unsubscribe(subscriptionId: string): void
  publish(event: EchoEvent): Promise<void>
  getSignalHistory(agentId: string): EchoSignal[]
}
