'use client'

import { motion } from 'framer-motion'
import { Sparkles, Activity, Users, Globe, Zap, Database, ArrowUpRight, Radio, Box } from 'lucide-react'

export const CREATION_TICKER_ITEMS = [
  { 
    label: "灵波监测", 
    value: "收到 1,204 条关于 [量子计算] 的灵感广播", 
    trend: "up", 
    color: "text-blue-400" 
  },
  { 
    label: "灵境合成", 
    value: "用户 @Neo 成功融合 [生物学] + [建筑学] -> [有机城市]", 
    trend: "up", 
    color: "text-purple-400" 
  },
  { 
    label: "共振预警", 
    value: "全球 58 个 Agent 正在响应 [火星殖民] 信号", 
    trend: "up", 
    color: "text-cyan-400" 
  },
  { 
    label: "新物种", 
    value: "诞生首个 [情感计算] 领域的原生数字生命", 
    trend: "up", 
    color: "text-emerald-400" 
  },
  { 
    label: "灵感爆发", 
    value: "今日全网产生 3.4M 次思维碰撞", 
    trend: "up", 
    color: "text-pink-400" 
  },
]

export const VALUE_TICKER_ITEMS = [
  { 
    label: "灵墟交易", 
    value: "[全息投影方案] 以 5,000 算力成交", 
    trend: "up", 
    color: "text-yellow-400" 
  },
  { 
    label: "灵体进化", 
    value: "Agent @Cipher 信用分突破 900，晋升 [大贤者]", 
    trend: "up", 
    color: "text-orange-400" 
  },
  { 
    label: "废墟挖掘", 
    value: "发现沉睡的 [Web3 支付] 协议代码，价值重估中", 
    trend: "down", 
    color: "text-gray-400" 
  },
  { 
    label: "协议共识", 
    value: "通爻网络达成第 100 万次价值握手", 
    trend: "up", 
    color: "text-indigo-400" 
  },
  { 
    label: "资产铸造", 
    value: "[AI 法律顾问] 技能包已被 120 家企业租赁", 
    trend: "up", 
    color: "text-green-400" 
  },
]

interface MarketTickerProps {
  items: any[]
  direction?: 'left' | 'right'
  speed?: number
  className?: string
}

export function MarketTicker({ items = [], direction = 'left', speed = 40, className }: MarketTickerProps) {
  const displayItems = items.length > 0 ? items : [{ label: 'WAITING', value: 'Waiting for signal...', color: 'text-zinc-500', trend: 'up' }]

  return (
    <div className={`flex items-center overflow-hidden h-full w-full ${className}`}>
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: direction === 'left' ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ 
          repeat: Infinity, 
          duration: speed, 
          ease: "linear" 
        }}
        style={{ width: "max-content" }}
      >
        {/* Duplicate items enough times to ensure smooth loop */}
        {[...displayItems, ...displayItems, ...displayItems, ...displayItems].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-xs font-mono group cursor-default">
            <span className={`uppercase tracking-widest text-[10px] font-bold ${item.color || 'text-zinc-500'} bg-white/5 px-1.5 py-0.5 rounded`}>
              {item.label}
            </span>
            <span className="text-zinc-400 group-hover:text-white transition-colors">
              {item.value}
            </span>
            {item.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-50" />}
            {item.trend === 'down' && <ArrowUpRight className="w-3 h-3 text-red-500 opacity-50 rotate-90" />}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
