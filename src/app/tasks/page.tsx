'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { TasksSystem } from '@/components/tasks-system'

export default function TasksPage() {
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
    </div>
  )
}

import { CheckCircle } from 'lucide-react'
