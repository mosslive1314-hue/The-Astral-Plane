'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PriceChart } from '@/components/ui/price-chart'
import { Clock, ShoppingBag, Key } from 'lucide-react'
import type { MarketSkill } from '@/types'
import { RARITY_LABELS, CATEGORY_LABELS } from '@/lib/constants'

interface SkillCardProps {
  skill: MarketSkill
  onBuy?: () => Promise<void>
  onRent?: () => Promise<void>
}

export function SkillCard({ skill, onBuy, onRent }: SkillCardProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'buy' | 'rent') => {
    if (!onBuy && !onRent) return
    
    setLoading(true)
    try {
      if (action === 'buy' && onBuy) {
        await onBuy()
      } else if (action === 'rent' && onRent) {
        await onRent()
      }
    } finally {
      setLoading(false)
    }
  }

  const priceChange = skill.priceHistory.length > 1
    ? ((skill.currentPrice - skill.priceHistory[0].price) / skill.priceHistory[0].price) * 100
    : 0

  return (
    <Card className="group hover:border-purple-500/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{skill.name}</CardTitle>
            <p className="text-sm text-zinc-400 mt-1">{skill.description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Badge variant="rarity" rarity={skill.rarity}>
            {RARITY_LABELS[skill.rarity]}
          </Badge>
          <Badge variant="category">
            {CATEGORY_LABELS[skill.category]}
          </Badge>
          {skill.isRental && (
            <Badge variant="default">
              <Clock className="w-3 h-3" />
              {skill.rentalDuration}小时
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 卖家信息 */}
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs text-white font-bold">
            {skill.seller.charAt(0)}
          </div>
          <span>Lv.{skill.sellerLevel} {skill.seller}</span>
        </div>

        {/* 价格图表 */}
        <PriceChart data={skill.priceHistory} height={80} />

        {/* 价格信息 */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-1">当前价格</p>
            <p className="text-xl font-bold text-white">
              💰 {skill.currentPrice.toLocaleString()}
            </p>
          </div>
          <div className={priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
            {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(1)}%
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {skill.isRental ? (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1" 
              onClick={() => handleAction('rent')}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Key className="w-4 h-4 mr-1" />
                  租赁
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="glow" 
              size="sm" 
              className="flex-1" 
              onClick={() => handleAction('buy')}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  购买
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
