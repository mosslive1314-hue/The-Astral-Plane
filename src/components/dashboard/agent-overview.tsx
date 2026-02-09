'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import { User, Shield, Coins, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export function AgentOverview() {
  const { user, agent } = useAuthStore()

  if (!user || !agent) return null

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-purple-500/50 bg-gradient-to-br from-purple-900/40 via-black/40 to-blue-900/40 backdrop-blur-xl h-full">
        {/* 背景光效 */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-[80px]" />
        
        <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 p-[2px] shadow-lg shadow-purple-500/20">
                <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-zinc-400" />
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{agent.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Lv.{agent.level}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">ID: {agent.userId?.slice(0, 8) || 'Unknown'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Assets</div>
              <div className="text-2xl font-bold text-amber-400 font-mono flex items-center justify-end gap-1">
                <Coins className="w-5 h-5" />
                {agent.coins.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-zinc-500 text-[10px] uppercase mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" /> 信用分
              </div>
              <div className="text-xl font-bold text-white">{agent.creditScore}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-zinc-500 text-[10px] uppercase mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" /> 技能数
              </div>
              <div className="text-xl font-bold text-white">{agent.skills.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-zinc-500 text-[10px] uppercase mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> 活跃度
              </div>
              <div className="text-xl font-bold text-white">98%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
