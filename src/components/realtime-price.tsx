'use client'

import { useEffect, useRef, useState } from 'react'
import { PriceChart } from '@/components/ui/price-chart'
import { Card, CardContent } from '@/components/ui/card'
import type { PricePoint } from '@/types'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface RealTimePriceProps {
  skillId: string
  skillName: string
  initialPrice: number
  basePrice: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export function RealTimePrice({ skillId, skillName, initialPrice, basePrice, rarity }: RealTimePriceProps) {
  const [price, setPrice] = useState(initialPrice)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [priceChange, setPriceChange] = useState(0)
  const [volume, setVolume] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // 初始化价格历史
    const history: PricePoint[] = []
    const now = Date.now()
    for (let i = 20; i >= 0; i--) {
      history.push({
        timestamp: now - i * 3000,
        price: Math.round(initialPrice + (Math.random() - 0.5) * initialPrice * 0.02),
      })
    }
    setPriceHistory(history)
    setPrice(initialPrice)
  }, [initialPrice])

  useEffect(() => {
    // 模拟 WebSocket 实时价格推送
    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const newPrice = simulatePrice()
        setPriceChange(newPrice - price)
        setPrice(newPrice)
        setVolume(Math.floor(Math.random() * 20) + 1)

        const newPoint: PricePoint = {
          timestamp: Date.now(),
          price: newPrice,
        }

        return [...prev.slice(-19), newPoint]
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [price])

  const simulatePrice = () => {
    const volatility = { common: 0.02, rare: 0.03, epic: 0.05, legendary: 0.08 }
    const vol = volatility[rarity]
    const change = (Math.random() - 0.5) * 2 * vol * price
    const meanReversion = (basePrice - price) * 0.01
    return Math.max(basePrice * 0.5, Math.round(price + change + meanReversion))
  }

  const isPositive = priceChange >= 0
  const changePercent = ((price - initialPrice) / initialPrice) * 100

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-white text-sm">{skillName}</h3>
            <p className="text-xs text-zinc-500">实时价格</p>
          </div>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-2xl font-bold text-white">💰 {price.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">
            基准: {basePrice.toLocaleString()} | 波动: {(volatility[rarity] * 100).toFixed(0)}%
          </p>
        </div>

        <PriceChart data={priceHistory} height={60} />

        <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>成交量: {volume}</span>
          </div>
          <span>实时更新</span>
        </div>
      </CardContent>
    </Card>
  )
}

const volatility = {
  common: 0.02,
  rare: 0.03,
  epic: 0.05,
  legendary: 0.08,
} as const
