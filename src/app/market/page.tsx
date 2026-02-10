'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { SkillCard } from '@/components/skill-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { simulatePriceFluctuation } from '@/lib/mock-data'
import type { MarketSkill, PricePoint } from '@/types'
import { TrendingUp, Filter, Search, ArrowLeft, Archive } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { buySkill, rentSkill } from '@/app/actions/market'
import { supabase } from '@/lib/database'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FuturesMarket } from '@/components/futures-market'

import { toast } from 'sonner'

// ... existing generatePriceHistory function

export default function MarketPage() {
  const router = useRouter()
  const { isAuthenticated, agent: currentAgent } = useAuthStore()
  const [skills, setSkills] = useState<MarketSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sale' | 'rental'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('market')

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = searchQuery === '' || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
      (filter === 'sale' && !skill.isRental) ||
      (filter === 'rental' && skill.isRental)
    
    const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter
    
    return matchesSearch && matchesFilter && matchesCategory
  })

  useEffect(() => {
    async function fetchSkills() {
      try {
        const { data, error } = await supabase
          .from('skills')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setSkills(data || [])
      } catch (err) {
        console.error('Failed to fetch skills:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSkills()
  }, [])

  const handleBuy = async (skill: MarketSkill) => {
    try {
      await buySkill(skill.id)
      toast.success('技能购买成功！')
    } catch (error) {
      toast.error('技能购买失败')
      console.error(error)
    }
  }

  const handleRent = async (skill: MarketSkill) => {
    try {
      await rentSkill(skill.id)
      toast.success('技能租赁成功！')
    } catch (error) {
      toast.error('技能租赁失败')
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navigation />

      {/* Header Section */}
      <div className="pt-12 pb-6 flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <p className="text-zinc-400 font-light tracking-wide max-w-2xl text-sm md:text-base">
          灵感自从诞生后就会变成废墟，这里是价值的交换之地也是需求的埋骨之所<br/>
          所有的方案、技能与任务都在此交汇
        </p>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="flex-1 max-w-7xl mx-auto px-4 w-full flex flex-col">
        <Tabs defaultValue="market" className="w-full flex flex-col items-center" onValueChange={setActiveTab}>
          <TabsList className="bg-black/20 border border-white/10 mb-8 p-1 rounded-xl">
            <TabsTrigger value="market" className="px-8 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              交易集市
            </TabsTrigger>
            <TabsTrigger value="futures" className="px-8 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              方案合约 (Futures)
            </TabsTrigger>
          </TabsList>

          {/* Market Tab Content */}
          <TabsContent value="market" className="w-full">
            <div className="flex flex-col space-y-6">
              {/* Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer px-4 py-1.5" onClick={() => setFilter('all')}>
                    全部
                  </Badge>
                  <Badge variant={filter === 'sale' ? 'default' : 'outline'} className="cursor-pointer px-4 py-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" onClick={() => setFilter('sale')}>
                    技能现货
                  </Badge>
                  <Badge variant={filter === 'rental' ? 'default' : 'outline'} className="cursor-pointer px-4 py-1.5 bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20" onClick={() => setFilter('rental')}>
                    技能租赁
                  </Badge>
                </div>
                
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="搜索技能..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 text-sm"
                  />
                </div>
              </div>

              {/* Skills Grid */}
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
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                      <Archive className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400 text-lg">暂无匹配技能</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Futures Tab Content */}
          <TabsContent value="futures" className="w-full">
             <FuturesMarket />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
