'use client'

import dynamic from 'next/dynamic'
import { Navigation } from '@/components/navigation'
import { Sparkles } from 'lucide-react'

// 动态导入以避免 SSR 问题
const MediciGraph = dynamic(() => import('@/components/medici-graph').then(m => m.MediciGraph), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-black/40 rounded-xl animate-pulse flex items-center justify-center text-zinc-500">加载知识图谱...</div>
})

export default function MediciPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              美帝奇实验室 (Medici Lab)
            </h1>
            <p className="text-zinc-400">
              探索技能之间的隐性连接，发现创新的火花。
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MediciGraph />
          </div>
          <div className="space-y-6">
            {/* 右侧控制面板 (后续实现) */}
            <div className="p-6 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-4">实验控制台</h3>
              <p className="text-sm text-zinc-400">
                选择两个不相关的技能进行碰撞...
              </p>
              {/* TODO: Add controls */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
