'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { RealTimePrice } from '@/components/realtime-price'
import { mockSkills } from '@/lib/mock-data'

export default function LiveMarketPage() {
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
              <Activity className="w-6 h-6 text-white" />
            </div>
            实时市场
          </h1>
          <p className="text-zinc-400">
            实时价格监控和动态定价系统演示
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockSkills.slice(0, 8).map(skill => (
            <RealTimePrice
              key={skill.id}
              skillId={skill.id}
              skillName={skill.name}
              initialPrice={skill.currentPrice}
              basePrice={skill.basePrice}
              rarity={skill.rarity}
            />
          ))}
        </div>

        {/* 动态定价说明 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">动态定价因素</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>需求系数：浏览量和报价数</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>稀缺性：在售数量和销售速度</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>卖家信用：信用分影响溢价</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>技能稀有度：r = 1.2^(稀有度-1)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>市场波动：随机扰动因子</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">实时推送</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>WebSocket 连接保持</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>3秒刷新周期</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>价格历史追踪（20点）</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>均值回归机制</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>稀有度决定波动率</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Activity } from 'lucide-react'
