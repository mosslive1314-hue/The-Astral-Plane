import { Gap, GapAnalysisResult, SubDemand, ProgressiveDeliveryResult } from '@/types/gap'
import { AgentOffer } from '@/types/center-tools'

export class GapIdentifier {
  async analyzeGaps(
    demand: string,
    offers: AgentOffer[],
    userPreferences?: Record<string, any>
  ): Promise<GapAnalysisResult> {
    const gaps: Gap[] = []

    const missingCapabilities = this.detectMissingCapabilities(demand, offers)
    gaps.push(...missingCapabilities)

    const missingResources = this.detectMissingResources(offers)
    gaps.push(...missingResources)

    const timingConstraints = this.detectTimingConstraints(demand, offers)
    gaps.push(...timingConstraints)

    const canProceed = this.canProceedWithoutSubDemands(gaps, userPreferences)

    const recommendedAction = this.determineRecommendedAction(gaps, canProceed)

    return {
      hasGap: gaps.length > 0,
      gaps,
      canProceedWithoutSubDemands: canProceed,
      recommendedAction,
      reasoning: this.generateReasoning(gaps, canProceed, recommendedAction)
    }
  }

  private detectMissingCapabilities(demand: string, offers: AgentOffer[]): Gap[] {
    const gaps: Gap[] = []

    const demandKeywords = this.extractKeywords(demand)
    const offeredCapabilities = new Set<string>()

    offers.forEach(offer => {
      if (offer.offer_content && offer.offer_content.capabilities) {
        offer.offer_content.capabilities.forEach((cap: string) => {
          offeredCapabilities.add(cap.toLowerCase())
        })
      }
    })

    demandKeywords.forEach(keyword => {
      const hasCapability = offers.some(offer => {
        const content = JSON.stringify(offer.offer_content).toLowerCase()
        return content.includes(keyword.toLowerCase())
      })

      if (!hasCapability && !offeredCapabilities.has(keyword.toLowerCase())) {
        gaps.push({
          id: `gap_cap_${Date.now()}_${gaps.length}`,
          sessionId: '',
          description: `Missing capability: ${keyword}`,
          severity: 'high',
          type: 'missing_capability',
          relatedOffers: offers.map(o => o.agent_id),
          suggestedSubDemands: [],
          createdAt: new Date().toISOString()
        })
      }
    })

    return gaps
  }

  private detectMissingResources(offers: AgentOffer[]): Gap[] {
    const gaps: Gap[] = []
    const requiredResources = ['budget', 'time', 'personnel', 'equipment']

    const offeredResources = new Set<string>()

    offers.forEach(offer => {
      if (offer.offer_content) {
        Object.keys(offer.offer_content).forEach(key => {
          if (requiredResources.includes(key)) {
            offeredResources.add(key)
          }
        })
      }
    })

    requiredResources.forEach(resource => {
      if (!offeredResources.has(resource)) {
        gaps.push({
          id: `gap_res_${Date.now()}_${gaps.length}`,
          sessionId: '',
          description: `Missing resource: ${resource}`,
          severity: 'medium',
          type: 'missing_resource',
          relatedOffers: offers.map(o => o.agent_id),
          suggestedSubDemands: [],
          createdAt: new Date().toISOString()
        })
      }
    })

    return gaps
  }

  private detectTimingConstraints(demand: string, offers: AgentOffer[]): Gap[] {
    const gaps: Gap[] = []

    const urgentKeywords = ['asap', 'urgent', 'immediately', 'today', 'tomorrow']
    const hasUrgentNeed = urgentKeywords.some(keyword => 
      demand.toLowerCase().includes(keyword)
    )

    if (hasUrgentNeed) {
      const slowestOffer = offers.reduce((max, offer) => {
        const estimatedTime = offer.offer_content?.estimatedTime || 999
        return estimatedTime > max ? estimatedTime : max
      }, 0)

      if (slowestOffer > 7) {
        gaps.push({
          id: `gap_time_${Date.now()}`,
          sessionId: '',
          description: `Timing constraint: Urgent need but slowest offer requires ${slowestOffer} days`,
          severity: 'high',
          type: 'timing_constraint',
          relatedOffers: offers.map(o => o.agent_id),
          suggestedSubDemands: [],
          createdAt: new Date().toISOString()
        })
      }
    }

    return gaps
  }

  private canProceedWithoutSubDemands(
    gaps: Gap[],
    userPreferences?: Record<string, any>
  ): boolean {
    const highSeverityGaps = gaps.filter(g => g.severity === 'high')
    
    if (highSeverityGaps.length === 0) {
      return true
    }

    if (userPreferences?.allowPartialDelivery) {
      return true
    }

    return false
  }

  private determineRecommendedAction(
    gaps: Gap[],
    canProceed: boolean
  ): 'deliver_with_gap' | 'recursive' | 'compromise' {
    if (gaps.length === 0) {
      return 'deliver_with_gap'
    }

    const highSeverityGaps = gaps.filter(g => g.severity === 'high')

    if (highSeverityGaps.length > 0 && !canProceed) {
      return 'recursive'
    }

    if (gaps.some(g => g.type === 'timing_constraint')) {
      return 'compromise'
    }

    return 'deliver_with_gap'
  }

  private generateReasoning(
    gaps: Gap[],
    canProceed: boolean,
    action: string
  ): string {
    const gapSummary = gaps.map(g => `${g.type}: ${g.description}`).join('; ')
    
    if (gaps.length === 0) {
      return 'All requirements met. Proceeding with current offers.'
    }

    return `Found ${gaps.length} gap(s): ${gapSummary}. ` +
           `Recommended action: ${action}. ` +
           `Can proceed immediately: ${canProceed}.`
  }

  async createSubDemands(
    gaps: Gap[],
    parentSessionId: string,
    parentDemandId: string,
    parentDemandText: string
  ): Promise<SubDemand[]> {
    const subDemands: SubDemand[] = []

    for (const gap of gaps) {
      const subDemand = await this.generateSubDemand(
        gap,
        parentSessionId,
        parentDemandId,
        parentDemandText
      )
      subDemands.push(subDemand)
    }

    return subDemands
  }

  private async generateSubDemand(
    gap: Gap,
    parentSessionId: string,
    parentDemandId: string,
    parentDemandText: string
  ): Promise<SubDemand> {
    const priority = gap.severity

    const content = this.generateSubDemandContent(gap, parentDemandText)

    return {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parentDemandId,
      parentSessionId,
      gapId: gap.id,
      content,
      context: {
        originalDemand: parentDemandText,
        gapDescription: gap.description,
        relatedOffers: gap.relatedOffers
      },
      priority,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  }

  private generateSubDemandContent(gap: Gap, parentDemandText: string): string {
    const templates: Record<string, string> = {
      missing_capability: `Need someone with ${gap.description.replace('Missing capability: ', '')} capability to support: ${parentDemandText}`,
      missing_resource: `Need ${gap.description.replace('Missing resource: ', '')} to support: ${parentDemandText}`,
      timing_constraint: `Need expedited delivery for: ${parentDemandText}`,
      other: `Address this gap: ${gap.description}`
    }

    return templates[gap.type] || templates.other
  }

  async progressiveDelivery(
    mainPlan: any,
    gaps: Gap[],
    parentSessionId: string,
    parentDemandId: string,
    parentDemandText: string
  ): Promise<ProgressiveDeliveryResult> {
    const subDemands: SubDemand[] = []

    for (const gap of gaps) {
      if (gap.severity === 'high') {
        const subDemand = await this.generateSubDemand(
          gap,
          parentSessionId,
          parentDemandId,
          parentDemandText
        )
        subDemands.push(subDemand)
      }
    }

    return {
      mainPlan,
      gaps,
      recursiveSessionIds: [],
      status: subDemands.length > 0 ? 'processing_gaps' : 'all_complete'
    }
  }

  private extractKeywords(text: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is']
    
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .filter((word, index, self) => self.indexOf(word) === index)
      .slice(0, 10)
  }
}

export const gapIdentifier = new GapIdentifier()
