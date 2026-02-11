import { HDCVector } from '@/types/hdc'
import { hdEncoder } from './hdc/encoder'

export interface AgentProfile {
  id: string
  name: string
  description: string
  capabilities: string[]
  expertise: string[]
  experience: string
  availability: 'available' | 'busy' | 'offline'
  rating: number
  completedTasks: number
  vector?: HDCVector
}

export interface AgentOffer {
  agentId: string
  agentName: string
  offer: string
  confidence: number
  estimatedTime: string
  estimatedCost: number
  reasoning: string
}

class AgentPool {
  private agents: Map<string, AgentProfile> = new Map()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    const mockAgents: Omit<AgentProfile, 'vector'>[] = [
      {
        id: 'agent-001',
        name: 'TechArchitect',
        description: '资深架构师，擅长系统设计和性能优化',
        capabilities: ['system_design', 'architecture', 'performance', 'scalability'],
        expertise: ['云计算', '微服务', '数据库优化', '分布式系统'],
        experience: '10年+架构设计经验',
        availability: 'available',
        rating: 4.8,
        completedTasks: 156
      },
      {
        id: 'agent-002',
        name: 'CodeNinja',
        description: '全栈开发工程师，精通多种编程语言和框架',
        capabilities: ['frontend', 'backend', 'devops', 'fullstack'],
        expertise: ['React', 'Node.js', 'Python', 'Go', 'Docker'],
        experience: '8年开发经验',
        availability: 'available',
        rating: 4.7,
        completedTasks: 234
      },
      {
        id: 'agent-003',
        name: 'DataWizard',
        description: '数据科学家，专注于机器学习和数据分析',
        capabilities: ['ml', 'data_analysis', 'visualization', 'statistics'],
        expertise: ['机器学习', '深度学习', 'Python', 'SQL', 'Tableau'],
        experience: '6年数据科学经验',
        availability: 'available',
        rating: 4.9,
        completedTasks: 189
      },
      {
        id: 'agent-004',
        name: 'UXMaster',
        description: '用户体验设计师，注重用户需求和行为研究',
        capabilities: ['ui_design', 'ux_research', 'prototyping', 'user_testing'],
        expertise: ['Figma', '用户研究', '交互设计', '设计系统'],
        experience: '7年UX设计经验',
        availability: 'busy',
        rating: 4.6,
        completedTasks: 145
      },
      {
        id: 'agent-005',
        name: 'CloudExpert',
        description: '云架构师，精通AWS、Azure、GCP等云平台',
        capabilities: ['cloud_infra', 'devops', 'security', 'migration'],
        expertise: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'],
        experience: '9年云服务经验',
        availability: 'available',
        rating: 4.8,
        completedTasks: 198
      },
      {
        id: 'agent-006',
        name: 'ProductGuru',
        description: '产品经理，擅长需求分析和产品规划',
        capabilities: ['product_management', 'requirements', 'roadmap', 'agile'],
        expertise: ['需求分析', '产品规划', '敏捷开发', '市场调研'],
        experience: '8年产品经验',
        availability: 'available',
        rating: 4.7,
        completedTasks: 167
      },
      {
        id: 'agent-007',
        name: 'SecurityGuard',
        description: '网络安全专家，专注系统安全防护',
        capabilities: ['security', 'penetration_testing', 'compliance', 'auditing'],
        expertise: ['网络安全', '渗透测试', '合规', '审计'],
        experience: '10年安全经验',
        availability: 'available',
        rating: 4.9,
        completedTasks: 134
      },
      {
        id: 'agent-008',
        name: 'AIResearcher',
        description: 'AI研究员，专注于大语言模型和自然语言处理',
        capabilities: ['llm', 'nlp', 'fine_tuning', 'prompt_engineering'],
        expertise: ['GPT', 'LLaMA', 'NLP', '提示工程'],
        experience: '5年AI研究经验',
        availability: 'available',
        rating: 4.8,
        completedTasks: 112
      }
    ]

    for (const agent of mockAgents) {
      const profile = agent as AgentProfile
      const description = `${agent.name} ${agent.description} ${agent.capabilities.join(' ')} ${agent.expertise.join(' ')}`
      profile.vector = await hdEncoder.textToHyperVector(
        await hdEncoder.encodeText(description)
      )
      this.agents.set(agent.id, profile)
    }

    this.initialized = true
    console.log(`[AgentPool] Initialized with ${this.agents.size} agents`)
  }

  getAllAgents(): AgentProfile[] {
    return Array.from(this.agents.values())
  }

  getAgent(id: string): AgentProfile | undefined {
    return this.agents.get(id)
  }

  getAvailableAgents(): AgentProfile[] {
    return this.getAllAgents().filter(a => a.availability === 'available')
  }

  async findResonantAgents(
    demandVector: HDCVector,
    threshold: number = 0.6,
    limit: number = 5
  ): Promise<Array<{ agent: AgentProfile; score: number }>> {
    await this.initialize()

    const results: Array<{ agent: AgentProfile; score: number }> = []

    for (const agent of this.getAvailableAgents()) {
      if (!agent.vector) continue

      const score = this.calculateSimilarity(demandVector, agent.vector)
      if (score >= threshold) {
        results.push({ agent, score })
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  private calculateSimilarity(vec1: HDCVector, vec2: HDCVector): number {
    const len1 = vec1.data.length
    const len2 = vec2.data.length

    if (len1 !== len2) {
      throw new Error('Vector dimensions do not match')
    }

    let matches = 0
    for (let i = 0; i < len1; i++) {
      if (vec1.data[i] === vec2.data[i]) {
        matches++
      }
    }

    return matches / len1
  }

  async generateOffer(
    agentId: string,
    demand: string,
    context?: Record<string, any>
  ): Promise<AgentOffer | null> {
    const agent = this.getAgent(agentId)
    if (!agent) return null

    const offerTemplates = [
      {
        pattern: /(设计|UI|UX|界面|用户体验)/i,
        offer: '我可以为您的需求提供完整的用户体验设计方案，包括用户研究、交互设计和视觉设计。',
        estimatedTime: '3-5天',
        estimatedCost: 5000
      },
      {
        pattern: /(开发|编程|代码|应用|网站)/i,
        offer: '我可以为您提供完整的开发服务，从前端到后端的完整实现。',
        estimatedTime: '5-10天',
        estimatedCost: 8000
      },
      {
        pattern: /(架构|系统|设计|可扩展|性能)/i,
        offer: '我可以为您设计高可用、可扩展的系统架构方案。',
        estimatedTime: '2-4天',
        estimatedCost: 6000
      },
      {
        pattern: /(数据|分析|机器学习|AI|模型)/i,
        offer: '我可以为您提供数据分析和机器学习解决方案。',
        estimatedTime: '4-7天',
        estimatedCost: 7000
      },
      {
        pattern: /(云|部署|运维|CI\/CD)/i,
        offer: '我可以帮您完成云平台部署和运维自动化配置。',
        estimatedTime: '2-3天',
        estimatedCost: 4000
      },
      {
        pattern: /(安全|防护|渗透|合规)/i,
        offer: '我可以为您提供安全评估和防护方案。',
        estimatedTime: '3-5天',
        estimatedCost: 5500
      }
    ]

    const matchedTemplate = offerTemplates.find(t => t.pattern.test(demand))

    return {
      agentId: agent.id,
      agentName: agent.name,
      offer: matchedTemplate?.offer || `我可以帮助您完成这个需求，基于我的${agent.expertise.join('、')}专长。`,
      confidence: 0.8 + Math.random() * 0.15,
      estimatedTime: matchedTemplate?.estimatedTime || '3-7天',
      estimatedCost: matchedTemplate?.estimatedCost || 6000,
      reasoning: `根据需求"${demand.substring(0, 50)}..."，结合我的${agent.capabilities.join('、')}能力，我认为可以提供专业服务。`
    }
  }

  async updateAgentAvailability(agentId: string, availability: AgentProfile['availability']): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    agent.availability = availability
    return true
  }

  async incrementCompletedTasks(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    agent.completedTasks++
    return true
  }
}

export const agentPool = new AgentPool()
