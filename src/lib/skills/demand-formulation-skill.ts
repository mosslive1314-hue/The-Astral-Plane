import { BaseSkill } from './base-skill'
import { SkillContext, SkillResult } from '@/types/skill'

interface DemandFormulationInput {
  originalIntent: string
  userProfile: any
  context?: any
}

interface DemandFormulationOutput {
  enrichedDemand: string
  keywords: string[]
  confidence: number
  suggestedActions?: string[]
}

export class DemandFormulationSkill extends BaseSkill {
  name = 'demand_formulation'
  role = '需求理解与表达者'
  responsibility = '基于用户 Profile 和上下文，将原始意图丰富化为更准确的需求表达'
  inputType = '原始用户意图 + Profile Data'
  outputType = '丰富化后的需求文本'
  principles = [
    '理解"要求"背后的"需求"（张力）',
    '保留用户意图，补充上下文而非替换',
    '丰富化程度由用户控制'
  ]
  constraints = [
    '输出需经用户确认后才广播',
    '这是可插拔扩展点，用户可自定义丰富化逻辑'
  ]
  invocationPhase = '协商流程 ②'

  async execute(
    context: SkillContext,
    input: DemandFormulationInput,
    config?: any
  ): Promise<SkillResult> {
    const validation = this.validateInput(input)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        timestamp: new Date().toISOString()
      }
    }

    const prompt = this.buildPrompt(input, context)

    const result = await this.callLLM(prompt, config)

    this.logExecution(context, result)

    if (!result.success) {
      return result
    }

    const textContent = typeof result.data === 'string' && result.data
      ? result.data
      : typeof result.data === 'object'
      ? JSON.stringify(result.data)
      : input.originalIntent

    if (!textContent || textContent.trim() === '') {
      console.warn('[DemandFormulation] Empty LLM response, using original intent')
      return {
        ...result,
        data: {
          enrichedDemand: input.originalIntent,
          keywords: [],
          confidence: 0.5
        }
      }
    }

    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      let parsedData: any = null

      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0])
        } catch (e) {
          console.warn('[DemandFormulation] JSON parse error:', e)
        }
      }

      if (parsedData && parsedData.enrichedDemand) {
        return {
          ...result,
          data: {
            enrichedDemand: parsedData.enrichedDemand,
            keywords: Array.isArray(parsedData.keywords) ? parsedData.keywords : [],
            confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0.7
          }
        }
      }

      return {
        ...result,
        data: {
          enrichedDemand: textContent,
          keywords: [],
          confidence: 0.7
        }
      }
    } catch (error) {
      console.warn('[DemandFormulation] Parse failed, using raw response')
      return {
        ...result,
        data: {
          enrichedDemand: textContent,
          keywords: [],
          confidence: 0.7
        }
      }
    }
  }

  private buildPrompt(input: DemandFormulationInput, context: SkillContext): string {
    const userProfile = input.userProfile || {}
    const profileContext = this.buildProfileContext(userProfile)

    return `分析用户需求并返回JSON。

用户需求: ${input.originalIntent}

返回格式:
{"enrichedDemand":"详细的需求描述","keywords":["关键词1","关键词2"],"confidence":0.9}

直接返回JSON，不要其他文字。`
  }

  private buildProfileContext(profile: any): string {
    const parts: string[] = []

    if (profile.skills && profile.skills.length > 0) {
      parts.push(`技能: ${profile.skills.join(', ')}`)
    }

    if (profile.experiences && profile.experiences.length > 0) {
      parts.push(`经历: ${profile.experiences.join(', ')}`)
    }

    if (profile.preferences && profile.preferences.length > 0) {
      parts.push(`偏好: ${profile.preferences.join(', ')}`)
    }

    if (profile.values && profile.values.length > 0) {
      parts.push(`价值观: ${profile.values.join(', ')}`)
    }

    return parts.join('\n') || '暂无详细信息'
  }
}
