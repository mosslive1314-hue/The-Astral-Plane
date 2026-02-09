'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Radio, Users, CheckCircle, Clock, ShieldCheck, Zap } from 'lucide-react'

// 模拟协商状态
type NegotiationStep = {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed'
  agents?: string[]
}

export function NegotiationStatus() {
  const [steps, setSteps] = useState<NegotiationStep[]>([
    { id: '1', label: '信号广播 (Signal Broadcast)', status: 'completed' },
    { id: '2', label: '共振匹配 (Resonance)', status: 'active', agents: ['DataWizard', 'PyMaster'] },
    { id: '3', label: '等待屏障 (Barrier Synchronization)', status: 'pending' },
    { id: '4', label: '方案生成 (Projection & Offer)', status: 'pending' },
    { id: '5', label: '最终裁决 (Final Decision)', status: 'pending' },
  ])

  // 模拟进度
  useEffect(() => {
    const timer = setInterval(() => {
      setSteps(prev => {
        const activeIndex = prev.findIndex(s => s.status === 'active')
        if (activeIndex === -1 || activeIndex === prev.length - 1) return prev

        const newSteps = [...prev]
        newSteps[activeIndex].status = 'completed'
        newSteps[activeIndex + 1].status = 'active'
        return newSteps
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Towow 协商协议 (v1.0)
        </h3>
        <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-[10px]">
          A2A Protocol Active
        </Badge>
      </div>

      <div className="space-y-4 relative">
        {/* 连线 */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/10" />

        {steps.map((step, index) => (
          <div key={step.id} className="relative flex items-start gap-3">
            {/* 状态点 */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-black' :
              step.status === 'active' ? 'bg-black border-purple-500 text-purple-500 animate-pulse' :
              'bg-black border-zinc-700 text-zinc-700'
            }`}>
              {step.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
               step.status === 'active' ? <Radio className="w-4 h-4" /> :
               <Clock className="w-4 h-4" />}
            </div>

            <div className="flex-1 pt-1">
              <h4 className={`text-sm font-medium transition-colors ${
                step.status === 'active' ? 'text-white' : 
                step.status === 'completed' ? 'text-zinc-300' : 'text-zinc-500'
              }`}>
                {step.label}
              </h4>
              
              {step.status === 'active' && step.id === '2' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 flex gap-2"
                >
                  {step.agents?.map(agent => (
                    <Badge key={agent} variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {agent}
                    </Badge>
                  ))}
                </motion.div>
              )}
              
              {step.status === 'active' && step.id === '3' && (
                <p className="text-xs text-zinc-500 mt-1">
                  正在等待所有共振 Agent 响应... (消除第一提案偏见)
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
