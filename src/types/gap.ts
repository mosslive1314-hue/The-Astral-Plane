export interface Gap {
  id: string
  sessionId: string
  description: string
  severity: 'high' | 'medium' | 'low'
  type: 'missing_capability' | 'missing_resource' | 'timing_constraint' | 'other'
  relatedOffers: string[]
  suggestedSubDemands: SubDemand[]
  createdAt: string
}

export interface SubDemand {
  id: string
  parentDemandId: string
  parentSessionId: string
  gapId: string
  content: string
  context: {
    originalDemand: string
    gapDescription: string
    relatedOffers: string[]
  }
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

export interface GapAnalysisResult {
  hasGap: boolean
  gaps: Gap[]
  canProceedWithoutSubDemands: boolean
  recommendedAction: 'deliver_with_gap' | 'recursive' | 'compromise'
  reasoning: string
}

export interface ProgressiveDeliveryResult {
  mainPlan: any
  gaps: Gap[]
  recursiveSessionIds: string[]
  status: 'delivering_main' | 'processing_gaps' | 'all_complete'
}
