import { API_CONFIG } from './constants'
import type { OAuthTokens } from '@/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  stream?: boolean
}

export async function sendChatMessage(
  tokens: OAuthTokens,
  messages: ChatMessage[],
  userId?: string
): Promise<ChatMessage> {
  // 调用我们自己的 API Route，而不是直接调外部 API
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      userId, // 传递用户 ID 以获取上下文
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.details || errorData.error || `Request failed with status ${response.status}`)
  }

  const data = await response.json()

  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: data.content || '我暂时无法回答这个问题。',
    timestamp: Date.now(),
  }
}

export async function sendChatMessageWithAct(
  tokens: OAuthTokens,
  message: string
): Promise<{ content: string; actions?: any[] }> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.access_token}`,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      act: true, // 启用结构化动作判断
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to send chat message with act')
  }

  return response.json()
}
