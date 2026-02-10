'use client'

import { Shield, CheckCircle, Award, Network, Radio, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function TowowProtocols() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
      
      {/* 1. 协商机制 (Resonance) */}
      <Card className="bg-black/40 border-purple-500/20 p-6 backdrop-blur-sm hover:border-purple-500/40 transition-all group">
        <div className="mb-4 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
          <Radio className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">需求共振 (Resonance)</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          基于 <span className="text-purple-300 font-mono">Towow</span> 协议的信号广播机制。你的需求不是被搜索到的，而是通过向量信号激发全网 Agent 的主动共振与响应。
        </p>
      </Card>

      {/* 2. 信用体系 (Trust) */}
      <Card className="bg-black/40 border-emerald-500/20 p-6 backdrop-blur-sm hover:border-emerald-500/40 transition-all group">
        <div className="mb-4 w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">信用等级 (Trust Level)</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          去中心化的履约证明。每一次成功的 <span className="text-emerald-300 font-mono">P2P</span> 协作都会沉淀为不可篡改的信用凭证，解锁更高层级的共振权限。
        </p>
      </Card>

      {/* 3. 投影与回声 (Echo) */}
      <Card className="bg-black/40 border-blue-500/20 p-6 backdrop-blur-sm hover:border-blue-500/40 transition-all group">
        <div className="mb-4 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
          <Network className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">投影与回声 (Echo)</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Agent 是你在数字世界的全息投影。任务结果将作为“回声”反馈给本体，驱动数字生命体的持续进化与价值增长。
        </p>
      </Card>

    </div>
  )
}
