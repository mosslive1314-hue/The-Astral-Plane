import { HDCVector } from './hdc'
import { KStarConfig } from './hdc'

export type SceneStatus = 'draft' | 'active' | 'paused' | 'archived'

export type SceneAccessType = 'public' | 'invite_only' | 'private'

export interface SceneTemplate {
  id: string
  name: string
  description: string
  version: string
  requiredFields: string[]
  optionalFields: string[]
  customMetadata?: Record<string, any>
}

export interface SceneConfig {
  template?: SceneTemplate
  kStarConfig: KStarConfig
  accessType: SceneAccessType
  accessControl?: {
    allowedUserIds?: string[]
    inviteCodes?: string[]
    organizationId?: string
  }
  maxAgents?: number
  autoActivation?: boolean
  metadata?: Record<string, any>
}

export interface Scene {
  id: string
  name: string
  description: string
  status: SceneStatus
  config: SceneConfig
  ownerId: string
  version: number
  vector?: HDCVector
  createdAt: string
  activatedAt?: string
  archivedAt?: string
  metadata?: Record<string, any>
}

export interface SceneAgentRegistration {
  sceneId: string
  agentId: string
  userId: string
  profileData: any
  vector: HDCVector
  registeredAt: string
}

export interface SceneStatistics {
  sceneId: string
  totalAgents: number
  activeNegotiations: number
  completedNegotiations: number
  totalDemands: number
  averageResonanceScore: number
  lastActivity: string
}

export interface FormulationResult {
  demandId: string
  originalText: string
  enrichedText: string
  clarifications: string[]
  extractedTags: string[]
  confidence: number
  timestamp: string
}

export interface ResonanceActivationData {
  negotiationId: string
  activatedAgentCount: number
  resonanceScores: Array<{
    agentId: string
    score: number
  }>
  scoreDistribution: {
    min: number
    max: number
    avg: number
    median: number
  }
  timestamp: string
}

export interface OfferReceivedData {
  negotiationId: string
  agentId: string
  offer: Record<string, any>
  timestamp: string
}

export interface CenterToolCallData {
  negotiationId: string
  toolName: string
  parameters: Record<string, any>
  result?: any
  timestamp: string
}

export interface PlanReadyData {
  negotiationId: string
  planType: 'text_plan' | 'machine_draft'
  content: Record<string, any>
  timestamp: string
}

export interface SubNegotiationStartedData {
  parentNegotiationId: string
  subNegotiationId: string
  gapId: string
  subDemandText: string
  timestamp: string
}

export interface ExecutionProgressData {
  negotiationId: string
  machineId?: string
  progress: number
  status: string
  message?: string
  timestamp: string
}

export interface EchoReceivedData {
  negotiationId: string
  machineId: string
  echoType: string
  data: Record<string, any>
  timestamp: string
}

export interface FormulationReadyEvent {
  type: 'formulation.ready'
  data: FormulationResult
}

export interface ResonanceActivatedEvent {
  type: 'resonance.activated'
  data: ResonanceActivationData
}

export interface OfferReceivedEvent {
  type: 'offer.received'
  data: OfferReceivedData
}

export interface BarrierCompleteEvent {
  type: 'barrier.complete'
  data: { negotiationId: string; totalOffers: number }
}

export interface CenterToolCallEvent {
  type: 'center.tool_call'
  data: CenterToolCallData
}

export interface PlanReadyEvent {
  type: 'plan.ready'
  data: PlanReadyData
}

export interface SubNegotiationStartedEvent {
  type: 'sub_negotiation.started'
  data: SubNegotiationStartedData
}

export interface ExecutionProgressEvent {
  type: 'execution.progress'
  data: ExecutionProgressData
}

export interface EchoReceivedEvent {
  type: 'echo.received'
  data: EchoReceivedData
}

export type ProtocolEvent =
  | FormulationReadyEvent
  | ResonanceActivatedEvent
  | OfferReceivedEvent
  | BarrierCompleteEvent
  | CenterToolCallEvent
  | PlanReadyEvent
  | SubNegotiationStartedEvent
  | ExecutionProgressEvent
  | EchoReceivedEvent

export interface EventSubscription {
  id: string
  callback: (event: ProtocolEvent) => void
  filters?: {
    negotiationId?: string
    sceneId?: string
    eventTypes?: string[]
  }
}

export type UserActionType = 'accept' | 'modify' | 'reject' | 'request_revision'

export interface UserAction {
  type: UserActionType
  negotiationId: string
  timestamp: string
  content?: string
  modifications?: Record<string, any>
}
