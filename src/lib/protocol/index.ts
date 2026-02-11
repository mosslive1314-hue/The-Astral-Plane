import { sceneManager } from './scene-manager'
import { templateManager } from './template-manager'
import { protocolAPI } from './protocol-api'
import { protocolEventBus } from './event-bus'
import { protocolLearningEngine } from './protocol-learning'
import { sceneAsAgentManager } from './scene-as-agent'

export function initializeProtocolLayer(): void {
  templateManager.initializeDefaultTemplates()

  console.log('[Protocol Layer] Initialized successfully')
}

export {
  sceneManager,
  templateManager,
  protocolAPI,
  protocolEventBus,
  protocolLearningEngine,
  sceneAsAgentManager
}

export * from './event-bus'
export * from './protocol-learning'
export * from './scene-as-agent'
export * from './scene-manager'
export * from './template-manager'
export * from '../../types/scene'
