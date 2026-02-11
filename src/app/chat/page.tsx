'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { ChatInterface } from '@/components/chat-interface'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, User } from 'lucide-react'

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  const agentId = searchParams.get('agent')
  const agentName = searchParams.get('name')
  const sessionId = searchParams.get('session')
  const isExpertChat = !!agentId && !!agentName

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [_hasHydrated, isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isExpertChat 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {isExpertChat ? <User className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
            </div>
            {isExpertChat ? agentName : 'AI 聊天助手'}
          </h1>
          <p className="text-zinc-400">
            {isExpertChat 
              ? `与专家 ${agentName} 进行一对一沟通，获取专业的建议和方案`
              : '与 AI Agent 对话，获取帮助和建议'
            }
          </p>
          {isExpertChat && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400">专家在线中</span>
            </div>
          )}
        </div>

        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              {isExpertChat ? '与专家对话' : '对话'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChatInterface isExpertChat={isExpertChat} agentId={agentId} agentName={agentName} sessionId={sessionId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />}>
      <ChatPageContent />
    </Suspense>
  )
}
