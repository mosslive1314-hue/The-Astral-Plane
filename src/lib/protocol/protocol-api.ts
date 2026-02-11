import { sceneManager } from './scene-manager'
import { resonanceEngine } from '../hdc/resonance'
import { negotiationStateManager } from '../negotiation/state-manager'
import { protocolEventBus } from './event-bus'
import { hdEncoder } from '../hdc/encoder'
import { ProfileDataSource, Projector } from '../hdc/profile-datasource'
import { DemandFormulationSkill } from '../skills/demand-formulation-skill'
import { SceneConfig, UserAction, FormulationResult } from '@/types/scene'
import { HDCVector, ProfileData } from '@/types/hdc'
import { v4 as uuidv4 } from 'uuid'

interface DemandFormulationOutput {
  enrichedDemand: string
  keywords: string[]
  confidence: number
  suggestedActions?: string[]
}

interface CreateSceneConfig {
  name: string
  description: string
  config: SceneConfig
  ownerId: string
}

interface RegisterAgentConfig {
  sceneId: string
  agentId: string
  userId: string
  profileDataSource: ProfileDataSource
}

interface SubmitDemandConfig {
  sceneId: string
  userId: string
  intent: string
  context?: Record<string, any>
}

interface ConfirmFormulationConfig {
  demandId: string
  confirmedText: string
}

export class ProtocolAPI {
  async createScene(config: CreateSceneConfig): Promise<{ success: boolean; sceneId?: string; error?: string }> {
    try {
      const scene = sceneManager.createScene(
        config.name,
        config.description,
        config.ownerId,
        config.config
      )

      if (config.config.template) {
        sceneManager.registerTemplate(config.config.template)
      }

      if (config.config.autoActivation) {
        sceneManager.activateScene(scene.id)
      }

      return { success: true, sceneId: scene.id }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async registerAgent(config: RegisterAgentConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const scene = sceneManager.getScene(config.sceneId)
      if (!scene) {
        return { success: false, error: 'Scene not found' }
      }

      if (!sceneManager.checkAccess(config.sceneId, config.userId)) {
        return { success: false, error: 'Access denied' }
      }

      if (!sceneManager.canAcceptMoreAgents(config.sceneId)) {
        return { success: false, error: 'Scene is full' }
      }

      const profileData = await config.profileDataSource.getProfile(config.userId)
      const vector = await Projector.project(
        config.profileDataSource,
        config.userId,
        { type: 'full_dimension' }
      )

      sceneManager.registerAgent(
        config.sceneId,
        config.agentId,
        config.userId,
        profileData,
        vector
      )

      resonanceEngine.registerAgent(config.agentId, vector)

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async submitDemand(config: SubmitDemandConfig): Promise<{ success: boolean; demandId?: string; error?: string }> {
    try {
      const scene = sceneManager.getScene(config.sceneId)
      if (!scene) {
        return { success: false, error: 'Scene not found' }
      }

      if (!sceneManager.checkAccess(config.sceneId, config.userId)) {
        return { success: false, error: 'Access denied' }
      }

      const demandId = uuidv4()

      const formulationSkill = new DemandFormulationSkill()
      const formulationResult = await formulationSkill.execute(
        { userId: config.userId, sessionId: demandId, roundNumber: 1, timestamp: new Date().toISOString() },
        { originalIntent: config.intent, userProfile: {}, context: config.context }
      )

      if (!formulationResult.success) {
        return { success: false, error: formulationResult.error || 'Formulation failed' }
      }

      const outputData = formulationResult.data as DemandFormulationOutput

      const formulationData: FormulationResult = {
        demandId,
        originalText: config.intent,
        enrichedText: outputData.enrichedDemand,
        clarifications: [],
        extractedTags: outputData.keywords,
        confidence: outputData.confidence,
        timestamp: new Date().toISOString()
      }

      protocolEventBus.publishFormulationReady(formulationData)

      const negotiationId = uuidv4()
      const demandVector = await hdEncoder.encodeText(config.intent)
      const hyperVector = hdEncoder.textToHyperVector(demandVector)

      const session = negotiationStateManager.createSession(
        negotiationId,
        config.userId,
        config.intent,
        hyperVector.data,
        scene.config.kStarConfig
      )

      const sceneAgents = sceneManager.getSceneAgents(config.sceneId)
      for (const agentRegistration of sceneAgents) {
        negotiationStateManager.registerAgent(
          negotiationId,
          agentRegistration.agentId,
          0
        )
      }

      const resonanceResults = resonanceEngine.detectResonance(
        hyperVector,
        scene.config.kStarConfig
      )

      const activatedAgents = resonanceResults.map(r => ({
        agentId: r.agentId,
        score: r.score
      }))

      const resonanceActivation = {
        negotiationId,
        activatedAgentCount: activatedAgents.length,
        resonanceScores: activatedAgents,
        scoreDistribution: this.calculateScoreDistribution(activatedAgents),
        timestamp: new Date().toISOString()
      }

      protocolEventBus.publishResonanceActivated(resonanceActivation)

      for (const result of resonanceResults) {
        negotiationStateManager.updateAgentStatus(negotiationId, result.agentId, 'active')
      }

      return { success: true, demandId }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async confirmFormulation(config: ConfirmFormulationConfig): Promise<{ success: boolean; negotiationId?: string; error?: string }> {
    try {
      const negotiationId = config.demandId

      const session = negotiationStateManager.getSession(negotiationId)
      if (!session) {
        return { success: false, error: 'Negotiation not found' }
      }

      const finalDemandText = config.confirmedText
      const demandVector = await hdEncoder.encodeText(finalDemandText)
      const hyperVector = hdEncoder.textToHyperVector(demandVector)

      const resonanceResults = resonanceEngine.detectResonance(
        hyperVector,
        session.k_star_config
      )

      const activatedAgents = resonanceResults.map(r => ({
        agentId: r.agentId,
        score: r.score
      }))

      const resonanceActivation = {
        negotiationId,
        activatedAgentCount: activatedAgents.length,
        resonanceScores: activatedAgents,
        scoreDistribution: this.calculateScoreDistribution(activatedAgents),
        timestamp: new Date().toISOString()
      }

      protocolEventBus.publishResonanceActivated(resonanceActivation)

      const pendingAgentIds = resonanceResults.map(r => r.agentId)
      negotiationStateManager.createWaitBarrier(
        negotiationId,
        pendingAgentIds,
        () => {
          const allOffers = negotiationStateManager.getRepliedAgents(negotiationId)
          protocolEventBus.publishBarrierComplete({
            negotiationId,
            totalOffers: allOffers.length
          })
        }
      )

      return { success: true, negotiationId }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async userAction(action: UserAction): Promise<{ success: boolean; error?: string }> {
    try {
      const session = negotiationStateManager.getSession(action.negotiationId)
      if (!session) {
        return { success: false, error: 'Negotiation not found' }
      }

      switch (action.type) {
        case 'accept':
          negotiationStateManager.updateSessionStatus(action.negotiationId, 'completed')
          break

        case 'modify':
          break

        case 'reject':
          negotiationStateManager.updateSessionStatus(action.negotiationId, 'completed')
          break

        case 'request_revision':
          negotiationStateManager.updateSessionStatus(action.negotiationId, 'negotiating')
          break

        default:
          return { success: false, error: 'Invalid action type' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getScene(sceneId: string): Promise<{ success: boolean; scene?: any; error?: string }> {
    try {
      const scene = sceneManager.getScene(sceneId)
      if (!scene) {
        return { success: false, error: 'Scene not found' }
      }

      const stats = sceneManager.getSceneStatistics(sceneId)

      return {
        success: true,
        scene: {
          ...scene,
          statistics: stats
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getScenes(userId?: string): Promise<{ success: boolean; scenes?: any[]; error?: string }> {
    try {
      const scenes = sceneManager.getAllScenes(userId)

      const scenesWithStats = await Promise.all(
        scenes.map(async scene => {
          const stats = sceneManager.getSceneStatistics(scene.id)
          return {
            ...scene,
            statistics: stats
          }
        })
      )

      return { success: true, scenes: scenesWithStats }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getNegotiationStatus(negotiationId: string): Promise<{ success: boolean; status?: any; error?: string }> {
    try {
      const session = negotiationStateManager.getSession(negotiationId)
      if (!session) {
        return { success: false, error: 'Negotiation not found' }
      }

      const stats = negotiationStateManager.getSessionStats(negotiationId)

      return {
        success: true,
        status: {
          session,
          statistics: stats
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  private calculateScoreDistribution(scores: Array<{ agentId: string; score: number }>): {
    min: number
    max: number
    avg: number
    median: number
  } {
    if (scores.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 }
    }

    const values = scores.map(s => s.score)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length

    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2

    return { min, max, avg, median }
  }
}

export const protocolAPI = new ProtocolAPI()
