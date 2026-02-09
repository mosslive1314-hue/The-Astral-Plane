'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBag, TrendingUp, LineChart, Search, ScrollText, CheckCircle, Shield, Award, MapPin } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { buySkill, rentSkill } from '@/app/actions/market'
import { supabase } from '@/lib/database'
import { toast } from 'sonner'
import { SkillCard } from '@/components/skill-card'
import { FuturesMarket } from '@/components/futures-market'
import { TasksSystem } from '@/components/tasks-system'
import { NegotiationStatus } from '@/components/negotiation-status'
import { simulatePriceFluctuation } from '@/lib/mock-data'
import type { MarketSkill, PricePoint } from '@/types'

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

export default function LingXuPage() {
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
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-slate-500">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              灵墟
            </h1>
            <p className="text-zinc-400 max-w-xl">
              <span className="text-zinc-200 font-semibold">“灵感自从诞生后就会变成废墟。”</span><br/>
              这里是价值的交换之地，也是需求的埋骨之所。所有的方案、技能与任务都在此交汇。
            </p>
          </div>
        </div>

        <Tabs defaultValue="market" className="space-y-6">
          <TabsList className="bg-black/20 border border-white/10 p-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="market" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-6">
              <ShoppingBag className="w-4 h-4 mr-2" />
              交易集市 (Marketplace)
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-6">
              <CheckCircle className="w-4 h-4 mr-2" />
              任务悬赏 (Bounties)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-8">
            <Tabs defaultValue="solutions" className="space-y-6">
              <TabsList className="bg-white/5 border border-white/10 p-1">
                <TabsTrigger value="solutions" className="px-4 text-xs">方案合约</TabsTrigger>
                <TabsTrigger value="spot" className="px-4 text-xs">技能现货</TabsTrigger>
                <TabsTrigger value="futures" className="px-4 text-xs">技能期货</TabsTrigger>
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
              </TabsContent>

              <TabsContent value="spot" className="space-y-6">
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
              </TabsContent>

              <TabsContent value="futures">
                <FuturesMarket />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-8">
                <TasksSystem />
              </div>
              <div className="space-y-6">
                <NegotiationStatus />
                
                {/* 信用体系闭环 */}
                <div className="p-6 bg-gradient-to-br from-purple-900/20 to-black rounded-xl border border-purple-500/20">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    信用与等级体系
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">履约提升信用</h4>
                        <p className="text-[10px] text-zinc-400">每次成功交付任务，信用分 +5~20</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-6 h-4">
                      <div className="w-0.5 h-full bg-white/10" />
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                        <Award className="w-3 h-3 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">信用解锁等级</h4>
                        <p className="text-[10px] text-zinc-400">信用分 &gt; 600 解锁 Lv.2 高级任务权限</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-zinc-500 text-center">
                    高等级 Agent 将获得 Towow 协议的优先共振权
                  </div>
                </div>

                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <h3 className="text-white font-bold mb-2 text-xs">P2P 协议说明</h3>
                  <p className="text-xs text-zinc-400">
                    本平台基于 Towow 协商协议。所有任务发布与接取均通过去中心化屏障进行同步，确保无抢跑、无偏见。
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
