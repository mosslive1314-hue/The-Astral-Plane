'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import type { ChatMessage } from '@/lib/chat-api'
import { Send, Sparkles, User, Bot, UserCheck, Save, BookOpen, FileText, MessageSquare, CheckCircle2, ArrowRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

interface ChatInterfaceProps {
  isExpertChat?: boolean
  agentId?: string | null
  agentName?: string | null
  sessionId?: string | null
}

export function ChatInterface({ isExpertChat = false, agentId, agentName, sessionId }: ChatInterfaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tokens, agent } = useAuthStore()
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: isExpertChat
        ? `你好！我是专家 ${agentName}。有什么我可以帮助你的吗？我会根据我的专业知识和经验为你提供解决方案。`
        : '你好！我是 AgentCraft 的 AI 助手。我可以帮你查询市场上的技能，或者查看你自己的 Agent 状态。有什么我可以帮助你的吗？',
      timestamp: Date.now(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveOption, setSaveOption] = useState<'full' | 'selected' | 'summarized'>('full')
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const TOWOW_API_URL = process.env.NEXT_PUBLIC_TOWOW_API_URL || 'http://localhost:8000'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const loadSession = async () => {
      if (sessionId) {
        try {
          const response = await fetch(`/api/chat-sessions/${sessionId}`)
          if (response.ok) {
            const session = await response.json()
            if (session && session.messages) {
              setMessages(session.messages)
              setCurrentSessionId(sessionId)
            }
          }
        } catch (error) {
          console.error('Failed to load session:', error)
        }
      }
    }
    loadSession()
  }, [sessionId])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    const systemPrompt = isExpertChat
      ? `你是专家 ${agentName}，拥有丰富的专业知识和实践经验。请用专业、友好、具体的语气回答用户的问题，提供可执行的建议和解决方案。**重要：请使用中文回答，不要使用英文。**`
      : `你是一个智能助手，运行在 AgentCraft 平台上。请用简短、热情、专业的语气回答。**重要：请使用中文回答，不要使用英文。**`

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            userMessage
          ].map(m => ({ role: m.role, content: m.content })),
          userId: agent?.userId,
          agentId: isExpertChat ? agentId : null,
          isExpertChat
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || '请求失败')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content || '我暂时无法回答这个问题。',
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMessage])

      const updatedMessages = [...messages, userMessage, assistantMessage]
      await saveChatSession(updatedMessages)

    } catch (error: any) {
      console.error('Chat error:', error)
      if (error.name !== 'AbortError') {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `抱歉，发送消息时出现错误: ${error.message}`,
            timestamp: Date.now(),
          },
        ])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const saveChatSession = async (msgs: ChatMessage[]) => {
    if (!isExpertChat || !agentId) return

    try {
      const title = msgs.find(m => m.role === 'user')?.content?.slice(0, 30) || '对话'
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          title: title + '...',
          agentName: agentName || '专家',
          messages: msgs
        })
      })

      if (response.ok) {
        const session = await response.json()
        if (!currentSessionId) {
          setCurrentSessionId(session.id)
          const url = new URL(window.location.href)
          url.searchParams.set('session', session.id)
          window.history.replaceState({}, '', url.toString())
        }
      }
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  const handleSaveToNote = async (option: 'full' | 'selected' | 'summarized' = saveOption) => {
    setIsSavingNote(true)
    setIsSummarizing(option === 'summarized')
    setShowSaveDialog(false)

    try {
      const messagesToSave = option === 'full' || option === 'summarized'
        ? messages.filter(m => m.role === 'assistant')
        : messages.filter(m => selectedMessageIds.has(m.id) && m.role === 'assistant')

      if (messagesToSave.length === 0) {
        toast.error('请至少选择一条消息保存')
        setIsSavingNote(false)
        return
      }

      let content: string
      let title: string

      if (option === 'summarized') {
        const firstUserMsg = messages.find(m => m.role === 'user')
        title = firstUserMsg?.content?.slice(0, 50) || '专家方案'

        const summaryPrompt = `请帮我提炼以下专家对话，生成一个结构化的完整方案。

要求：
1. 提炼核心观点和建议
2. 使用 Markdown 格式，包含清晰的标题层级
3. 分为以下结构：
   - 方案概述
   - 核心要点
   - 实施步骤
   - 注意事项
   - 总结建议
4. 只保存专家的回复内容，不要包含用户的提问
5. 使用专业、简洁的语言

对话内容：
${messages.map(m => `${m.role === 'user' ? '用户' : '专家'}: ${m.content}`).join('\n\n')}`

        const summaryResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: summaryPrompt }],
            userId: agent?.userId,
            agentId: null,
            isExpertChat: false
          })
        })

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          content = summaryData.content || '提炼失败'
        } else {
          throw new Error('AI 提炼失败')
        }
      } else {
        content = messagesToSave.map((m, i) => `## 专家回复 ${i + 1}\n\n${m.content}\n`).join('\n---\n\n')
        const firstUserMsg = messages.find(m => m.role === 'user')
        title = firstUserMsg?.content?.slice(0, 50) || '专家对话记录'
      }

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent?.id || agentId,
          title: title,
          content: content,
          tags: option === 'summarized' ? ['expert', '方案', agentName || '专家'] : ['expert', '对话', agentName || '专家']
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSavedNoteId(result.id)
        const successMsg = option === 'summarized' ? 'AI 已提炼并保存方案' : '已保存到灵感笔记'
        toast.success(successMsg, {
          description: '点击查看按钮跳转到笔记页面',
          action: {
            label: '查看',
            onClick: () => router.push('/notes')
          }
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || '保存失败')
      }
    } catch (error: any) {
      console.error('Save note error:', error)
      toast.error('保存失败', {
        description: error.message || '请稍后重试'
      })
    } finally {
      setIsSavingNote(false)
      setIsSummarizing(false)
      setSelectedMessageIds(new Set())
    }
  }

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                : isExpertChat
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : isExpertChat ? (
                <UserCheck className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className={`max-w-[70%] relative ${
              message.role === 'user'
                ? 'bg-blue-500/20 rounded-2xl rounded-tr-md'
                : isExpertChat
                  ? 'bg-emerald-500/20 rounded-2xl rounded-tl-md'
                  : 'bg-purple-500/20 rounded-2xl rounded-tl-md'
            }`}>
              {isExpertChat && message.role === 'assistant' && !showSaveDialog && (
                <button
                  onClick={() => {
                    setShowSaveDialog(true)
                    setSelectedMessageIds(new Set([message.id]))
                    setSaveOption('selected')
                  }}
                  className="absolute -top-2 -right-2 p-1.5 bg-emerald-500/80 hover:bg-emerald-500 rounded-lg transition-colors"
                  title="保存这条内容到笔记"
                >
                  <Save className="w-3 h-3 text-white" />
                </button>
              )}
              <p className="text-sm text-white px-4 py-2">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              isExpertChat
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {isExpertChat ? <UserCheck className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`${isExpertChat ? 'bg-emerald-500/20' : 'bg-purple-500/20'} rounded-2xl rounded-tl-md`}>
              <div className="flex gap-1 px-4 py-3">
                <div className={`w-2 h-2 rounded-full animate-bounce ${isExpertChat ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${isExpertChat ? 'bg-emerald-400' : 'bg-purple-400'}`} style={{ animationDelay: '0.1s' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${isExpertChat ? 'bg-emerald-400' : 'bg-purple-400'}`} style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {savedNoteId && (
        <Card className="absolute bottom-24 left-1/2 -translate-x-1/2 w-80 bg-emerald-900/95 backdrop-blur-xl border-emerald-500/30 shadow-2xl z-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">已保存到灵感笔记</p>
                <p className="text-emerald-300 text-sm">笔记ID: {savedNoteId.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSavedNoteId(null)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                关闭
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/notes')}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                <BookOpen className="w-4 h-4 mr-1" />
                查看笔记
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showSaveDialog && (
        <Card className="absolute bottom-20 left-1/2 -translate-x-1/2 w-96 bg-black/95 backdrop-blur-xl border-white/20 shadow-2xl z-40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">保存到灵感笔记</CardTitle>
              <button onClick={() => setShowSaveDialog(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={saveOption === 'full' ? 'default' : 'outline'}
                onClick={() => setSaveOption('full')}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-1" />
                保存完整对话
              </Button>
              <Button
                size="sm"
                variant={saveOption === 'selected' ? 'default' : 'outline'}
                onClick={() => setSaveOption('selected')}
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                保存选中内容
              </Button>
              <Button
                size="sm"
                variant={saveOption === 'summarized' ? 'default' : 'outline'}
                onClick={() => setSaveOption('summarized')}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI 提炼方案
              </Button>
            </div>

            {saveOption === 'summarized' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <p className="text-emerald-300 text-sm">
                  AI 将自动提炼对话内容，生成结构化的完整方案，包含方案概述、核心要点、实施步骤和注意事项。
                </p>
              </div>
            )}
            
            {saveOption === 'selected' && (
              <div>
                <p className="text-zinc-400 text-sm mb-2">选择要保存的专家回复：</p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {messages
                    .filter(m => m.role === 'assistant')
                    .map(message => (
                      <div
                        key={message.id}
                        onClick={() => toggleMessageSelection(message.id)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          selectedMessageIds.has(message.id)
                            ? 'border-emerald-500 bg-emerald-500/20'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-4 h-4 rounded flex-shrink-0 ${
                            selectedMessageIds.has(message.id) ? 'bg-emerald-500' : 'bg-white/20'
                          }`}>
                            {selectedMessageIds.has(message.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <p className="text-xs text-zinc-300 line-clamp-2">{message.content}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveToNote(saveOption)}
                disabled={isSavingNote || isSummarizing || (saveOption === 'selected' && selectedMessageIds.size === 0)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {isSummarizing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                    AI 提炼中...
                  </>
                ) : isSavingNote ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    {saveOption === 'summarized' ? '提炼并保存' : '保存到笔记'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border-t border-white/10 p-4">
        {isExpertChat && !showSaveDialog && !savedNoteId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSaveDialog(true)}
            disabled={messages.filter(m => m.role === 'assistant').length === 0}
            className="w-full mb-2"
          >
            <Save className="w-4 h-4 mr-1" />
            保存对话到灵感笔记
          </Button>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isExpertChat ? `与 ${agentName} 某通...` : '输入消息... (Shift+Enter 换行)'}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="px-6"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
