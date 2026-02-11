'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Trash2, Clock, User } from 'lucide-react'
import { toast } from 'sonner'

interface ChatSession {
  id: string
  agent_id: string
  title: string
  agent_name: string
  messages: any[]
  created_at: string
  updated_at: string
}

function ChatSessionsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, agent } = useAuthStore()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  const agentId = searchParams.get('agentId')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const loadSessions = async () => {
      if (!agentId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/chat-sessions?agentId=${agentId}`)
        if (response.ok) {
          const data = await response.json()
          setSessions(data || [])
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
        toast.error('加载对话历史失败')
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [agentId])

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定要删除这个对话吗？')) return

    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`, { method: 'DELETE' })
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        toast.success('对话已删除')
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
      toast.error('删除失败')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            对话历史
          </h1>
          <p className="text-zinc-400">查看和恢复之前的专家对话记录</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
            <p className="text-zinc-400 mt-4">加载中...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">暂无对话记录</p>
              <Button
                onClick={() => router.push('/resonance')}
                className="mt-4"
              >
                开始新对话
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <Card
                key={session.id}
                className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => router.push(`/chat?agent=${session.agent_id}&name=${encodeURIComponent(session.agent_name)}&session=${session.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-white font-semibold truncate">{session.agent_name}</span>
                      </div>
                      <h3 className="text-white font-medium mb-1">{session.title}</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        {session.messages.length} 条消息
                      </p>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(session.updated_at)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSession(session.id)
                      }}
                      className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatSessionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />}>
      <ChatSessionsPageContent />
    </Suspense>
  )
}
