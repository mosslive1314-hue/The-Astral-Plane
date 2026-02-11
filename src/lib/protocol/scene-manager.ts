import {
  Scene,
  SceneConfig,
  SceneStatus,
  SceneAgentRegistration,
  SceneStatistics,
  SceneTemplate
} from '@/types/scene'
import { HDCVector } from '@/types/hdc'
import { v4 as uuidv4 } from 'uuid'

export class SceneManager {
  private scenes: Map<string, Scene> = new Map()
  private agents: Map<string, SceneAgentRegistration[]> = new Map()
  private templates: Map<string, SceneTemplate> = new Map()
  private sceneVectors: Map<string, HDCVector> = new Map()

  createScene(
    name: string,
    description: string,
    ownerId: string,
    config: SceneConfig
  ): Scene {
    const sceneId = uuidv4()
    const scene: Scene = {
      id: sceneId,
      name,
      description,
      status: 'draft',
      config,
      ownerId,
      version: 1,
      createdAt: new Date().toISOString()
    }

    this.scenes.set(sceneId, scene)
    this.agents.set(sceneId, [])

    return scene
  }

  getScene(sceneId: string): Scene | undefined {
    return this.scenes.get(sceneId)
  }

  getAllScenes(ownerId?: string): Scene[] {
    const scenes = Array.from(this.scenes.values())
    if (ownerId) {
      return scenes.filter(s => s.ownerId === ownerId)
    }
    return scenes
  }

  getScenesByStatus(status: SceneStatus): Scene[] {
    return Array.from(this.scenes.values()).filter(s => s.status === status)
  }

  updateScene(sceneId: string, updates: Partial<Scene>): Scene | null {
    const scene = this.scenes.get(sceneId)
    if (!scene) return null

    const updatedScene = {
      ...scene,
      ...updates,
      version: scene.version + 1
    }
    this.scenes.set(sceneId, updatedScene)

    return updatedScene
  }

  activateScene(sceneId: string): Scene | null {
    const scene = this.scenes.get(sceneId)
    if (!scene) return null

    const activatedScene = {
      ...scene,
      status: 'active' as SceneStatus,
      activatedAt: new Date().toISOString()
    }

    this.scenes.set(sceneId, activatedScene)

    return activatedScene
  }

  pauseScene(sceneId: string): Scene | null {
    return this.updateScene(sceneId, { status: 'paused' })
  }

  archiveScene(sceneId: string): Scene | null {
    const scene = this.scenes.get(sceneId)
    if (!scene) return null

    const archivedScene = {
      ...scene,
      status: 'archived' as SceneStatus,
      archivedAt: new Date().toISOString()
    }

    this.scenes.set(sceneId, archivedScene)

    return archivedScene
  }

  deleteScene(sceneId: string): boolean {
    const deleted = this.scenes.delete(sceneId)
    if (deleted) {
      this.agents.delete(sceneId)
      this.sceneVectors.delete(sceneId)
    }
    return deleted
  }

  registerAgent(
    sceneId: string,
    agentId: string,
    userId: string,
    profileData: any,
    vector: HDCVector
  ): SceneAgentRegistration | null {
    const scene = this.scenes.get(sceneId)
    if (!scene || scene.status !== 'active') {
      return null
    }

    const registration: SceneAgentRegistration = {
      sceneId,
      agentId,
      userId,
      profileData,
      vector,
      registeredAt: new Date().toISOString()
    }

    const agents = this.agents.get(sceneId)
    if (agents) {
      agents.push(registration)
    }

    return registration
  }

  unregisterAgent(sceneId: string, agentId: string): boolean {
    const agents = this.agents.get(sceneId)
    if (!agents) return false

    const index = agents.findIndex(a => a.agentId === agentId)
    if (index === -1) return false

    agents.splice(index, 1)
    return true
  }

  getSceneAgents(sceneId: string): SceneAgentRegistration[] {
    return this.agents.get(sceneId) || []
  }

  getAgentCount(sceneId: string): number {
    return this.agents.get(sceneId)?.length || 0
  }

  getAgentVectors(sceneId: string): HDCVector[] {
    const agents = this.agents.get(sceneId) || []
    return agents.map(a => a.vector)
  }

  setSceneVector(sceneId: string, vector: HDCVector): void {
    this.sceneVectors.set(sceneId, vector)
  }

  getSceneVector(sceneId: string): HDCVector | undefined {
    return this.sceneVectors.get(sceneId)
  }

  registerTemplate(template: SceneTemplate): void {
    this.templates.set(template.id, template)
  }

  getTemplate(templateId: string): SceneTemplate | undefined {
    return this.templates.get(templateId)
  }

  getAllTemplates(): SceneTemplate[] {
    return Array.from(this.templates.values())
  }

  getSceneStatistics(sceneId: string): SceneStatistics | null {
    const scene = this.scenes.get(sceneId)
    const agents = this.agents.get(sceneId)

    if (!scene || !agents) return null

    return {
      sceneId,
      totalAgents: agents.length,
      activeNegotiations: 0,
      completedNegotiations: 0,
      totalDemands: 0,
      averageResonanceScore: 0,
      lastActivity: scene.createdAt
    }
  }

  checkAccess(sceneId: string, userId: string): boolean {
    const scene = this.scenes.get(sceneId)
    if (!scene) return false

    if (scene.ownerId === userId) return true

    const { accessType, accessControl } = scene.config

    if (accessType === 'public') {
      return true
    }

    if (accessType === 'invite_only' && accessControl) {
      return accessControl.allowedUserIds?.includes(userId) || false
    }

    if (accessType === 'private' && accessControl) {
      return accessControl.allowedUserIds?.includes(userId) || false
    }

    return false
  }

  canAcceptMoreAgents(sceneId: string): boolean {
    const scene = this.scenes.get(sceneId)
    if (!scene || scene.status !== 'active') return false

    const maxAgents = scene.config.maxAgents
    if (maxAgents === undefined) return true

    return this.getAgentCount(sceneId) < maxAgents
  }

  getScenesForUser(userId: string): Scene[] {
    return Array.from(this.scenes.values()).filter(scene => {
      return this.checkAccess(scene.id, userId)
    })
  }

  getDraftScenes(): Scene[] {
    return this.getScenesByStatus('draft')
  }

  getActiveScenes(): Scene[] {
    return this.getScenesByStatus('active')
  }

  getPausedScenes(): Scene[] {
    return this.getScenesByStatus('paused')
  }

  getArchivedScenes(): Scene[] {
    return this.getScenesByStatus('archived')
  }
}

export const sceneManager = new SceneManager()
