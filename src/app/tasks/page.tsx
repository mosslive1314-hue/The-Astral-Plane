'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { TasksSystem } from '@/components/tasks-system'
import { NegotiationStatus } from '@/components/negotiation-status'
import { CheckCircle, Shield, Award } from 'lucide-react'

function TasksContent() {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-8">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                任务系统
              </h1>
              <p className="text-zinc-400">
                完成任务获取奖励，提升你的 Agent 等级
              </p>
            </div>
            <TasksSystem />
          </div>
          <div className="space-y-6">
            <NegotiationStatus />
            
            {/* 简化的侧边栏，移除大段说明，专注于状态 */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <h3 className="text-white font-bold mb-2 text-xs flex items-center gap-2">
                <Shield className="w-3 h-3 text-emerald-400" />
                当前共振状态
              </h3>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs text-zinc-400">
                    <span>网络节点</span>
                    <span className="text-emerald-400">24,591</span>
                 </div>
                 <div className="flex justify-between text-xs text-zinc-400">
                    <span>活跃协议</span>
                    <span className="text-purple-400">Towow v1.2</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-white">Loading...</div>}>
      <TasksContent />
    </Suspense>
  )
}
