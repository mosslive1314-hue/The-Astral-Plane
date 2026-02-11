import { NextResponse } from 'next/server'
import { agentPool } from '@/lib/agent-pool'
import { hdEncoder } from '@/lib/hdc/encoder'
import { DemandFormulationSkill } from '@/lib/skills/demand-formulation-skill'
import { protocolAPI } from '@/lib/protocol/protocol-api'
import { protocolEventBus } from '@/lib/protocol/event-bus'
import { v4 as uuidv4 } from 'uuid'

interface NegotiationFlowRequest {
  userId: string
  sceneId?: string
  originalDemand: string
  context?: Record<string, any>
}

interface NegotiationFlowResponse {
  success: boolean
  negotiationId?: string
  formulation?: {
    originalText: string
    enrichedText: string
    extractedTags: string[]
    confidence: number
  }
  activatedAgents?: Array<{
    agentId: string
    agentName: string
    score: number
  }>
  offers?: Array<{
    agentId: string
    agentName: string
    offer: string
    confidence: number
    estimatedTime: string
    estimatedCost: number
    reasoning: string
  }>
  error?: string
}

export async function POST(req: Request) {
  try {
    const request: NegotiationFlowRequest = await req.json()

    const { userId, sceneId, originalDemand, context } = request

    if (!userId || !originalDemand) {
      return NextResponse.json<NegotiationFlowResponse>({
        success: false,
        error: 'Missing required fields: userId and originalDemand'
      }, { status: 400 })
    }

    const negotiationId = uuidv4()

    console.log(`[Negotiation Flow] Starting negotiation ${negotiationId}`)

    const response: NegotiationFlowResponse = {
      success: true,
      negotiationId
    }

    await agentPool.initialize()

    const formulationSkill = new DemandFormulationSkill()
    const formulationResult = await formulationSkill.execute(
      { userId, sessionId: negotiationId, roundNumber: 1, timestamp: new Date().toISOString() },
      { originalIntent: originalDemand, userProfile: {}, context }
    )

    let enrichedText = originalDemand

    if (formulationResult.success && formulationResult.data) {
      const outputData = formulationResult.data as any

      let keywords: string[] = []
      let confidence = 0.5

      if (typeof outputData === 'string') {
        enrichedText = outputData
      } else if (outputData) {
        enrichedText = outputData.enrichedDemand || outputData || originalDemand
        keywords = outputData.keywords || []
        confidence = outputData.confidence || 0.5
      }

      response.formulation = {
        originalText: originalDemand,
        enrichedText,
        extractedTags: keywords,
        confidence
      }

      const demandVector = await hdEncoder.textToHyperVector(
        await hdEncoder.encodeText(enrichedText)
      )

      const matches = await agentPool.findResonantAgents(demandVector, 0.1, 5)

      if (matches.length > 0) {
        response.activatedAgents = matches.map(m => ({
          agentId: m.agent.id,
          agentName: m.agent.name,
          score: m.score
        }))

        protocolEventBus.publishResonanceActivated({
          negotiationId,
          activatedAgentCount: matches.length,
          resonanceScores: matches.map(m => ({
            agentId: m.agent.id,
            score: m.score
          })),
          scoreDistribution: {
            min: Math.min(...matches.map(m => m.score)),
            max: Math.max(...matches.map(m => m.score)),
            avg: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
            median: matches[Math.floor(matches.length / 2)].score
          },
          timestamp: new Date().toISOString()
        })

        const offers = []
        for (const match of matches) {
          const offer = await agentPool.generateOffer(
            match.agent.id,
            enrichedText,
            context
          )
          if (offer) {
            offers.push(offer)

            protocolEventBus.publishOfferReceived({
              negotiationId,
              agentId: offer.agentId,
              offer: {
                content: offer.offer,
                confidence: offer.confidence,
                estimatedTime: offer.estimatedTime,
                estimatedCost: offer.estimatedCost,
                reasoning: offer.reasoning
              },
              timestamp: new Date().toISOString()
            })
          }
        }

        response.offers = offers

        protocolEventBus.publishBarrierComplete({
          negotiationId,
          totalOffers: offers.length
        })

        if (sceneId) {
          const sceneResult = await protocolAPI.submitDemand({
            sceneId,
            userId,
            intent: originalDemand,
            context: context || {}
          })
        }
      } else {
        console.log(`[Negotiation Flow] No agents found for demand`)
      }
    } else {
      console.error(`[Negotiation Flow] Formulation failed: ${formulationResult.error}`)
      response.formulation = {
        originalText: originalDemand,
        enrichedText: originalDemand,
        extractedTags: [],
        confidence: 0.3
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Negotiation Flow] Error:', error)
    return NextResponse.json<NegotiationFlowResponse>({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}
