'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { mockActResponse, parseActions } from '@/lib/act-api'
import type { StructuredAction } from '@/lib/act-api'
import { Sparkles, Zap, ChevronRight, Lightbulb } from 'lucide-react'

const examplePrompts = [
  '我想购买 Python 编程大师技能',
  '把 UI 设计和数据分析师技能组合起来',
  '升级我的技术写作技能',
  '查看我的信用分数',
  '创建一个新的美帝奇组合',
]

export function ActInterface() {
  const { tokens } = useAuthStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<{
    content: string
    actions: StructuredAction[]
    reasoning?: string
  } | null>(null)
  const [history, setHistory] = useState<Array<{
    prompt: string
    response: any
  }>>([])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    const prompt = input

    try {
      // 模拟 Act API 响应
      const actResponse = mockActResponse(prompt)

      setResponse({
        content: actResponse.content,
        actions: actResponse.actions || [],
        reasoning: actResponse.reasoning,
      })
      setHistory(prev => [...prev, { prompt, response: actResponse }])
      setInput('')
    } catch (error) {
      console.error('Act error:', error)
      setResponse({
        content: '抱歉，处理请求时出现错误。',
        actions: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setInput(example)
  }

  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      purchase_skill: '🛒',
      combine_skills: '✨',
      upgrade_skill: '⬆️',
      chat: '💬',
      view_profile: '👤',
      create_combination: '🔮',
    }
    return icons[type] || '📋'
  }

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase_skill: '购买技能',
      combine_skills: '组合技能',
      upgrade_skill: '升级技能',
      chat: '对话',
      view_profile: '查看资料',
      create_combination: '创建组合',
    }
    return labels[type] || type
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 输入区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            结构化动作输入
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">输入指令</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="例如：我想购买Python编程技能..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-zinc-500 mb-2">示例指令：</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* 解析结果 */}
          {response && (
            <div className="space-y-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-purple-400">
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-semibold">动作解析结果</span>
              </div>

              <div className="text-sm text-white mb-3">{response.content}</div>

              {response.actions.length > 0 && (
                <div className="space-y-2">
                  {response.actions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-black/40 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getActionIcon(action.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {getActionLabel(action.type)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {JSON.stringify(action.parameters)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={action.confidence > 0.8 ? 'category' : 'default'}
                          className="text-xs"
                        >
                          {Math.round(action.confidence * 100)}%
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {response.reasoning && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-zinc-500">推理过程：{response.reasoning}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 历史记录 */}
      <Card>
        <CardHeader>
          <CardTitle>对话历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>还没有对话记录</p>
                <p className="text-sm mt-1">尝试输入指令开始</p>
              </div>
            ) : (
              history.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                  onClick={() => setResponse(item.response)}
                >
                  <p className="text-sm text-white mb-2">{item.prompt}</p>
                  <div className="flex items-center gap-2">
                    {item.response.actions.map((action: StructuredAction, j: number) => (
                      <Badge key={j} variant="category" className="text-xs">
                        {getActionIcon(action.type)} {getActionLabel(action.type)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
