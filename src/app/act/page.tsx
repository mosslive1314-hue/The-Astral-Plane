'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { ActInterface } from '@/components/act-interface'

export default function ActPage() {
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            结构化动作判断 (Act)
          </h1>
          <p className="text-zinc-400">
            AI 驱动的意图识别和动作解析，让 Agent 理解你的指令
          </p>
        </div>

        {/* 功能说明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">意图识别</h3>
            </div>
            <p className="text-sm text-zinc-400">自动理解用户想要执行的操作</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">参数提取</h3>
            </div>
            <p className="text-sm text-zinc-400">从自然语言中提取结构化参数</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white">置信度评估</h3>
            </div>
            <p className="text-sm text-zinc-400">评估解析结果的可靠程度</p>
          </div>
        </div>

        <ActInterface />
      </div>
    </div>
  )
}

import { Sparkles, Zap, Target, CheckCircle } from 'lucide-react'
