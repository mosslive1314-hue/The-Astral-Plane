'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { AgentManager } from '@/components/agent-manager'

export default function AgentManagementPage() {
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Agent 管理中心</h1>
          <p className="text-zinc-400">
            管理你的 AI Agent，升级技能，解锁成就
          </p>
        </div>
        <AgentManager />
      </div>
    </div>
  )
}
