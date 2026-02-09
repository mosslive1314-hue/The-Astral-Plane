'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Zap, ShoppingCart, MessageSquare } from 'lucide-react'

const LOG_TYPES = {
  system: { icon: Terminal, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  skill: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  market: { icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  social: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
}

type LogItem = {
  id: string
  type: keyof typeof LOG_TYPES
  content: string
  time: string
}

const INITIAL_LOGS: LogItem[] = [
  { id: '1', type: 'system', content: 'Agent 系统初始化完成', time: '10:00:00' },
  { id: '2', type: 'social', content: '检测到新的社交信号：Web3 趋势上升', time: '10:01:23' },
  { id: '3', type: 'market', content: '技能 "Python Data Analysis" 价格上涨 5%', time: '10:02:45' },
]

export function ActivityLog() {
  const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS)

  // 模拟实时日志
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogItem = {
        id: Date.now().toString(),
        type: ['system', 'skill', 'market', 'social'][Math.floor(Math.random() * 4)] as any,
        content: `模拟活动日志 #${Math.floor(Math.random() * 1000)} - 系统运行正常`,
        time: new Date().toLocaleTimeString()
      }
      setLogs(prev => [newLog, ...prev].slice(0, 10))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">实时活动流</h3>
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 space-y-2">
          <AnimatePresence initial={false}>
            {logs.map(log => {
              const Style = LOG_TYPES[log.type]
              const Icon = Style.icon
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className={`p-1.5 rounded ${Style.bg} mt-0.5`}>
                    <Icon className={`w-3 h-3 ${Style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{log.content}</p>
                    <p className="text-[10px] text-zinc-600 font-mono mt-1">{log.time}</p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        {/* 底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
