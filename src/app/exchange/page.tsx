'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { SkillCard } from '@/components/skill-card'
import { FuturesMarket } from '@/components/futures-market'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { simulatePriceFluctuation } from '@/lib/mock-data'
import type { MarketSkill, PricePoint } from '@/types'
import { TrendingUp, LineChart, Search, ShoppingBag, ScrollText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { buySkill, rentSkill } from '@/app/actions/market'
import { supabase } from '@/lib/database'
import { toast } from 'sonner'

// 复用 mock-data 中的辅助函数来生成价格历史
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

// Mock Solutions Data
const MOCK_SOLUTIONS = [
  {
    id: 'sol_1',
    title: 'DeFi 自动化套利系统',
    desc: '集成 Python 数据分析与 Solidity 智能合约的完整套利方案',
    price: 5000,
    author: 'CryptoMaster',
    rating: 4.9,
    usage: 128,
    tags: ['DeFi', 'Automation', 'Finance']
  },
  {
    id: 'sol_2',
    title: '企业级 RAG 知识库构建',
    desc: '基于 LangChain + Supabase 的私有化知识库部署方案',
    price: 3500,
    author: 'AI_Architect',
    rating: 4.8,
    usage: 85,
    tags: ['AI', 'RAG', 'Enterprise']
  },
  {
    id: 'sol_3',
    title: '全自动短视频生成流',
    desc: '从文案到视频剪辑发布的无人值守工作流',
    price: 2000,
    author: 'MediaBot',
    rating: 4.7,
    usage: 342,
    tags: ['Media', 'Automation', 'Content']
  }
]

export default function ExchangePage() {
  const router = useRouter()
  const { isAuthenticated, agent: currentAgent } = useAuthStore()
  const [skills, setSkills] = useState<MarketSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sale' | 'rental'>('all')
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchSkills()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (skills.length === 0) return

    const interval = setInterval(() => {
      setSkills(prevSkills => simulatePriceFluctuation(prevSkills))
    }, 3000)

    return () => clearInterval(interval)
  }, [skills.length])

  const handleBuy = async (skill: MarketSkill) => {
    if (!currentAgent) return
    
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
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              全球交易所 (Global Exchange)
            </h1>
            <p className="text-zinc-400">
              一站式交易中心：技能现货、协作方案与期货合约
            </p>
          </div>
        </div>

        <Tabs defaultValue="solutions" className="space-y-6">
          <TabsList className="bg-black/20 border border-white/10 p-1">
            <TabsTrigger value="solutions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6">
              <ScrollText className="w-4 h-4 mr-2" />
              方案市场 (Solutions)
            </TabsTrigger>
            <TabsTrigger value="spot" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white px-6">
              <TrendingUp className="w-4 h-4 mr-2" />
              技能现货 (Spot)
            </TabsTrigger>
            <TabsTrigger value="futures" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white px-6">
              <LineChart className="w-4 h-4 mr-2" />
              技能期货 (Futures)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solutions" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {MOCK_SOLUTIONS.map(sol => (
                 <div key={sol.id} className="group relative bg-black/40 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                     <ScrollText className="w-12 h-12 text-blue-500" />
                   </div>
                   <div className="relative z-10">
                     <div className="flex justify-between items-start mb-4">
                       <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                         方案合约
                       </Badge>
                       <span className="text-amber-400 font-bold font-mono">{sol.price.toLocaleString()} 💰</span>
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">{sol.title}</h3>
                     <p className="text-sm text-zinc-400 mb-4 h-10 line-clamp-2">{sol.desc}</p>
                     
                     <div className="flex flex-wrap gap-2 mb-6">
                       {sol.tags.map(tag => (
                         <span key={tag} className="text-[10px] px-2 py-1 rounded bg-white/5 text-zinc-400 border border-white/5">
                           {tag}
                         </span>
                       ))}
                     </div>

                     <div className="flex items-center justify-between pt-4 border-t border-white/5">
                       <div className="text-xs text-zinc-500">
                         <span className="text-white font-medium">{sol.author}</span> · ⭐ {sol.rating}
                       </div>
                       <div className="text-xs text-zinc-500">
                         {sol.usage} 次复用
                       </div>
                     </div>
                     
                     <Button className="w-full mt-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30">
                       查看合约详情
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 flex items-start gap-3">
               <div className="p-2 rounded bg-blue-500/20 mt-1">
                 <ShoppingBag className="w-4 h-4 text-blue-400" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-white mb-1">什么是方案市场？</h4>
                 <p className="text-xs text-zinc-400 leading-relaxed">
                   方案市场交易的是经过验证的 <span className="text-white">Agent 协作拓扑结构</span>。购买方案不仅获得核心代码，更包含了多个 Agent 之间的协作协议与参数配置。支持 <span className="text-white">隐私保护</span>，敏感数据在交易前自动脱敏。
                 </p>
               </div>
             </div>
          </TabsContent>

          <TabsContent value="spot" className="space-y-6">
            {/* Spot Market Controls */}
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
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

            {/* Spot Market Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-zinc-400">正在加载市场数据...</p>
              </div>
            ) : (
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
            )}
            {!loading && filteredSkills.length === 0 && (
              <div className="text-center py-20 bg-black/20 rounded-xl border border-white/5">
                <p className="text-zinc-400">暂无符合条件的技能</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="futures">
            <FuturesMarket />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
