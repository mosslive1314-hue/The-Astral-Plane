import { API_CONFIG } from './constants'
import type { OAuthTokens } from '@/types'

export interface StructuredAction {
  type: string
  parameters: Record<string, any>
  confidence: number
}

export interface ActResponse {
  content: string
  actions?: StructuredAction[]
  reasoning?: string
}

// 使用 SecondMe Act API 进行结构化动作判断
export async function sendActRequest(
  tokens: OAuthTokens,
  prompt: string,
  context?: {
    availableActions?: string[]
    constraints?: string[]
  }
): Promise<ActResponse> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/act`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.access_token}`,
    },
    body: JSON.stringify({
      prompt,
      context,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to send act request')
  }

  return response.json()
}

// 解析结构化动作
export function parseActions(response: ActResponse): StructuredAction[] {
  return response.actions || []
}

// 模拟结构化动作（用于演示）
export function mockActResponse(prompt: string): ActResponse {
  const actions: StructuredAction[] = []

  // 根据关键词识别意图
  if (prompt.includes('购买') || prompt.includes('买')) {
    actions.push({
      type: 'purchase_skill',
      parameters: { skillName: extractSkillName(prompt) },
      confidence: 0.85,
    })
  }

  if (prompt.includes('组合') || prompt.includes('融合')) {
    actions.push({
      type: 'combine_skills',
      parameters: {
        skill1: extractSkillName(prompt, 1),
        skill2: extractSkillName(prompt, 2),
      },
      confidence: 0.9,
    })
  }

  if (prompt.includes('升级')) {
    actions.push({
      type: 'upgrade_skill',
      parameters: { skillName: extractSkillName(prompt) },
      confidence: 0.8,
    })
  }

  if (actions.length === 0) {
    actions.push({
      type: 'chat',
      parameters: { message: prompt },
      confidence: 0.5,
    })
  }

  return {
    content: generateResponse(actions),
    actions,
    reasoning: '基于关键词匹配和意图识别',
  }
}

function extractSkillName(prompt: string, index: number = 0): string {
  const skills = ['Python 编程大师', 'UI 设计灵感', '技术写作', '数据分析技能']
  return skills[index % skills.length]
}

function generateResponse(actions: StructuredAction[]): string {
  if (actions[0]?.type === 'purchase_skill') {
    return `我理解您想购买 ${actions[0].parameters.skillName}。正在为您查找...`
  }
  if (actions[0]?.type === 'combine_skills') {
    return `好的，将为您组合 ${actions[0].parameters.skill1} 和 ${actions[0].parameters.skill2}`
  }
  if (actions[0]?.type === 'upgrade_skill') {
    return `正在升级 ${actions[0].parameters.skillName}...`
  }
  return '我明白了，请问还有什么可以帮助您的吗？'
}
