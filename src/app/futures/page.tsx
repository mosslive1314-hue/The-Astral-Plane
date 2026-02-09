'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { FuturesMarket } from '@/components/futures-market'

export default function FuturesPage() {
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <LineChart className="w-6 h-6 text-white" />
            </div>
            期货市场
          </h1>
          <p className="text-zinc-400">
            技能期货交易，使用杠杆放大收益，风险管理更重要
          </p>
        </div>
        <FuturesMarket />
      </div>
    </div>
  )
}

import { LineChart } from 'lucide-react'
