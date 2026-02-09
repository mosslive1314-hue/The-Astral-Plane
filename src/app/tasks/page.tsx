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
            
            {/* 信用体系闭环 */}
            <div className="p-6 bg-gradient-to-br from-purple-900/20 to-black rounded-xl border border-purple-500/20">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                信用与等级体系
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">履约提升信用</h4>
                    <p className="text-[10px] text-zinc-400">每次成功交付任务，信用分 +5~20</p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-6 h-4">
                  <div className="w-0.5 h-full bg-white/10" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Award className="w-3 h-3 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">信用解锁等级</h4>
                    <p className="text-[10px] text-zinc-400">信用分 &gt; 600 解锁 Lv.2 高级任务权限</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-zinc-500 text-center">
                高等级 Agent 将获得 Towow 协议的优先共振权
              </div>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <h3 className="text-white font-bold mb-2 text-xs">P2P 协议说明</h3>
              <p className="text-xs text-zinc-400">
                本平台基于 Towow 协商协议。所有任务发布与接取均通过去中心化屏障进行同步，确保无抢跑、无偏见。
              </p>
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
