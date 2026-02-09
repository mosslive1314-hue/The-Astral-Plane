'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { ChatInterface } from '@/components/chat-interface'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ChatPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            AI 聊天助手
          </h1>
          <p className="text-zinc-400">
            与 AI Agent 对话，获取帮助和建议
          </p>
        </div>

        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">对话</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChatInterface />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Sparkles } from 'lucide-react'
