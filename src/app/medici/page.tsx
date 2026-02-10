'use client'

import { Navigation } from '@/components/navigation'
import { Sparkles } from 'lucide-react'
import { MediciLab } from '@/components/medici/medici-lab'

export default function MediciPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 pt-4 min-h-screen flex flex-col relative z-0">
        {/* Intro Text - Adjusted padding to be tight against ticker */}
        <div className="mb-4 text-center relative z-20 pointer-events-none">
          <p className="text-zinc-400 text-xs max-w-2xl mx-auto leading-relaxed bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/5 shadow-xl pointer-events-auto inline-block">
            这里是 <span className="text-white font-semibold">灵境</span> —— 您的私人创新实验室与资产管理中心。<br/>
            在此处，您可以利用美帝奇效应将不相关的技能融合为全新的方案，或管理您的心智资产。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 flex-1 relative z-10">
          <div className="w-full h-full min-h-[500px]">
            <MediciLab />
          </div>
        </div>
      </div>
    </div>
  )
}
