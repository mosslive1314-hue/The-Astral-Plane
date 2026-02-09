'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { SkillCard } from '@/components/skill-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { simulatePriceFluctuation } from '@/lib/mock-data'
import type { MarketSkill, PricePoint } from '@/types'
import { TrendingUp, Filter, Search, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { buySkill, rentSkill } from '@/app/actions/market'
import { supabase } from '@/lib/database'

import { toast } from 'sonner'

// 复用 mock-data 中的辅助函数来生成价格历史，保持 UI 效果
function generatePriceHistory(basePrice: number, currentPrice: number): PricePoint[] {
  const history: PricePoint[] = []
  const now = Date.now()
  const points = 10
  const interval = 60000 // 1分钟间隔

  let price = basePrice
  for (let i = 0; i < points; i++) {
    const variation = (Math.random() - 0.5) * basePrice * 0.02
    price = basePrice + (currentPrice - basePrice) * (i / points) + variation
    history.push({
      timestamp: now - (points - i) * interval,
      price: Math.round(price),
    })
  }

  return history
}

export default function MarketPage() {
  const router = useRouter()
  const { isAuthenticated, agent: currentAgent } = useAuthStore()
  const [skills, setSkills] = useState<MarketSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sale' | 'rental'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('market_skills')
        .select(`
          id,
          current_price,
          is_rental,
          rental_duration,
          listed_at,
          skill:skills (
            id,
            name,
            category,
            description,
            rarity,
            base_price
          ),
          seller:agents (
            id,
            name,
            level
          )
        `)
        .eq('status', 'active')

      if (error) throw error

      if (data) {
        const mappedSkills: MarketSkill[] = data.map((item: any) => ({
          id: item.id,
          name: item.skill.name,
          category: item.skill.category,
          description: item.skill.description,
          rarity: item.skill.rarity,
          basePrice: item.skill.base_price,
          currentPrice: item.current_price,
          priceHistory: generatePriceHistory(item.skill.base_price, item.current_price),
          seller: item.seller.name,
          sellerLevel: item.seller.level,
          listedAt: new Date(item.listed_at),
          isRental: item.is_rental,
          rentalDuration: item.rental_duration
        }))
        setSkills(mappedSkills)
      }
    } catch (error) {
      console.error('Error fetching market skills:', error)
    } finally {
      setLoading(false)
    }
  }

  // 从 Supabase 获取数据
  useEffect(() => {
    if (isAuthenticated) {
      fetchSkills()
    }
  }, [isAuthenticated])

  // 模拟实时价格更新
  useEffect(() => {
    if (skills.length === 0) return

    const interval = setInterval(() => {
      setSkills(prevSkills => simulatePriceFluctuation(prevSkills))
    }, 3000) // 每3秒更新一次

    return () => clearInterval(interval)
  }, [skills.length])

  const handleBuy = async (skill: MarketSkill) => {
    if (!currentAgent) return
    
    // 使用 toast 而不是 confirm 弹窗，这里用简单的 toast.promise 或者自定义 UI
    // 为了保持确认流程，我们可以先用 toast 提示正在处理
    
    // 更好的体验是点击按钮直接购买，或者有一个确认弹窗组件
    // 这里简单起见，我们还是用 confirm，但用 toast 展示结果
    if (confirm(`确定要购买 ${skill.name} 吗？价格: ${skill.currentPrice} 💰`)) {
      const promise = buySkill(currentAgent.id, skill.id, skill.currentPrice)
      
      toast.promise(promise, {
        loading: '正在处理交易...',
        success: (result) => {
          if (result.success) {
            fetchSkills()
            return result.message
          } else {
            throw new Error(result.message)
          }
        },
        error: (err) => `购买失败: ${err.message}`
      })
    }
  }

  const handleRent = async (skill: MarketSkill) => {
    if (!currentAgent) return
    
    if (confirm(`确定要租赁 ${skill.name} 吗？价格: ${skill.currentPrice} 💰`)) {
      const promise = rentSkill(currentAgent.id, skill.id, skill.currentPrice, skill.rentalDuration || 24)
      
      toast.promise(promise, {
        loading: '正在处理租赁...',
        success: (result) => {
          if (result.success) {
            fetchSkills()
            return result.message
          } else {
            throw new Error(result.message)
          }
        },
        error: (err) => `租赁失败: ${err.message}`
      })
    }
  }

  const filteredSkills = skills.filter(skill => {
    const matchesType = filter === 'all' || (filter === 'sale' && !skill.isRental) || (filter === 'rental' && skill.isRental)
    const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      {/* Page Header */}
      <div className="border-b border-white/10 bg-black/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                技能市场
              </h1>
              <div className="flex gap-2">
                <Badge variant={filter === 'all' ? 'category' : 'default'} className="cursor-pointer" onClick={() => setFilter('all')}>
                  全部
                </Badge>
                <Badge variant={filter === 'sale' ? 'category' : 'default'} className="cursor-pointer" onClick={() => setFilter('sale')}>
                  出售
                </Badge>
                <Badge variant={filter === 'rental' ? 'category' : 'default'} className="cursor-pointer" onClick={() => setFilter('rental')}>
                  租赁
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="搜索技能..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-zinc-400">正在加载市场数据...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSkills.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onBuy={!skill.isRental ? () => handleBuy(skill) : undefined}
                  onRent={skill.isRental ? () => handleRent(skill) : undefined}
                />
              ))}
            </div>

            {filteredSkills.length === 0 && (
              <div className="text-center py-20">
                <p className="text-zinc-400 text-lg">没有找到匹配的技能</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
