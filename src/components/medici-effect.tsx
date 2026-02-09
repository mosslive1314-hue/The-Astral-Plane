'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, Lightbulb, TrendingUp } from 'lucide-react'
import type { MarketSkill, GeneratedSkill, MediciCombination } from '@/types'
import { useAuthStore } from '@/store/auth'
import { discoverSkill } from '@/app/actions/medici'
import { supabase } from '@/lib/database'
import { toast } from 'sonner'

export function MediciEffect() {
  const { agent } = useAuthStore()
  const [ownedSkills, setOwnedSkills] = useState<MarketSkill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<MarketSkill[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [result, setResult] = useState<GeneratedSkill | null>(null)
  const [combinationHistory, setCombinationHistory] = useState<MediciCombination[]>([])
  const [loading, setLoading] = useState(true)

  // 加载用户拥有的技能
  useEffect(() => {
    const fetchOwnedSkills = async () => {
      if (!agent?.id) return
      
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('agent_skills')
          .select('skill:skills(*)')
          .eq('agent_id', agent.id)
        
        if (data) {
          const skills = data.map((item: any) => ({
            id: item.skill.id,
            name: item.skill.name,
            category: item.skill.category,
            description: item.skill.description,
            rarity: item.skill.rarity,
            basePrice: item.skill.base_price,
            currentPrice: item.skill.base_price, // 简化处理
            priceHistory: [],
            seller: agent.name,
            sellerLevel: agent.level,
            listedAt: new Date(),
            isRental: false
          }))
          setOwnedSkills(skills)
        }
      } catch (err) {
        console.error('Failed to load owned skills', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOwnedSkills()
  }, [agent?.id])

  // 加载发现历史
  useEffect(() => {
    const fetchHistory = async () => {
      if (!agent?.id) return

      try {
        const { data, error } = await supabase
          .from('medici_combinations')
          .select(`
            id,
            status,
            discovery_time:discovered_at,
            skill1:skills!skill1_id(name),
            skill2:skills!skill2_id(name),
            newSkill:skills!new_skill_id(name, rarity)
          `)
          .eq('agent_id', agent.id)
          .order('discovered_at', { ascending: false })
          .limit(10)
        
        if (data) {
          const history = data.map((item: any) => ({
            id: item.id,
            skill1: { name: item.skill1.name } as any,
            skill2: { name: item.skill2.name } as any,
            newSkill: { 
              name: item.newSkill.name,
              rarity: item.newSkill.rarity
            } as any,
            status: item.status,
            discoveryTime: new Date(item.discovery_time).getTime()
          }))
          setCombinationHistory(history)
        }
      } catch (err) {
        console.error('Failed to load history', err)
      }
    }

    fetchHistory()
  }, [agent?.id, result]) // result 变化时刷新历史

  const handleSelectSkill = (skill: MarketSkill) => {
    if (selectedSkills.find(s => s.id === skill.id)) {
      setSelectedSkills(prev => prev.filter(s => s.id !== skill.id))
    } else if (selectedSkills.length < 2) {
      setSelectedSkills(prev => [...prev, skill])
    }
  }

  // ...

  const handleDiscover = async () => {
    if (selectedSkills.length !== 2 || !agent?.id) return

    setIsDiscovering(true)
    setResult(null)

    try {
      const promise = discoverSkill(agent.id, selectedSkills[0].id, selectedSkills[1].id)
      
      // 我们需要 await 结果来更新 UI，但同时用 toast 显示状态
      toast.promise(promise, {
        loading: '正在进行美帝奇效应融合...',
        success: '发现新技能！',
        error: '融合失败'
      })
      
      const res = await promise
      
      if (res.success && res.newSkill) {
        setResult(res.newSkill)
        setSelectedSkills([])
      } else if (!res.success) {
        // toast 已经显示了 error，这里不用 alert
      }
    } catch (err) {
      console.error(err)
      toast.error('发现过程出错')
    } finally {
      setIsDiscovering(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 核心概念说明 */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">美帝奇效应 (The Medici Effect)</h3>
              <p className="text-zinc-400 leading-relaxed">
                当不同领域的思想交叉时，会产生爆炸性的创新。通过将两个不同类别的技能进行结构映射，
                产生意想不到的突破性新技能。跨域组合（等级差异 &gt; 2）将触发隐藏属性，获得更强大的能力。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技能选择 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          选择两个技能进行组合
        </h3>
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">加载你的技能库...</p>
          </div>
        ) : ownedSkills.length === 0 ? (
          <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10">
            <p className="text-zinc-400 mb-2">你还没有任何技能</p>
            <Button variant="outline" size="sm" onClick={() => window.location.href='/market'}>
              去市场购买
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownedSkills.map(skill => (
              <Card
                key={skill.id}
                className={`cursor-pointer transition-all ${
                  selectedSkills.find(s => s.id === skill.id)
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'hover:border-purple-500/30'
                }`}
                onClick={() => handleSelectSkill(skill)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-white">{skill.name}</h4>
                    <Badge variant="rarity" rarity={skill.rarity} className="text-xs">
                      {skill.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{skill.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">{skill.category}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {selectedSkills.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <div className="text-zinc-400">
            已选择: {selectedSkills.map(s => s.name).join(' + ')}
          </div>
          <Button
            variant="glow"
            size="lg"
            onClick={handleDiscover}
            disabled={selectedSkills.length !== 2 || isDiscovering}
            className="min-w-48"
          >
            {isDiscovering ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                发现中...
              </>
            ) : (
              <>
                <Lightbulb className="w-5 h-5 mr-2" />
                开始发现
              </>
            )}
          </Button>
        </div>
      )}

      {/* 发现结果 */}
      {result && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <TrendingUp className="w-6 h-6" />
              新技能诞生！
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{result.name}</h3>
              <p className="text-zinc-400">{result.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="rarity" rarity={result.rarity}>
                {result.rarity === 'legendary' ? '传说' : result.rarity === 'epic' ? '史诗' : result.rarity === 'rare' ? '稀有' : '普通'}
              </Badge>
              <Badge variant="category">{result.category}</Badge>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">独特属性</h4>
              <ul className="space-y-1">
                {result.uniqueAttributes.map((attr, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {attr}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">预估价值</span>
                <span className="text-2xl font-bold text-amber-400">
                  💰 {result.estimatedValue.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 组合历史 */}
      {combinationHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">发现历史</h3>
          <div className="space-y-3">
            {combinationHistory.map(comb => (
              <Card key={comb.id} className="bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-purple-400">{comb.skill1.name}</span>
                      <span className="text-zinc-500">+</span>
                      <span className="text-blue-400">{comb.skill2.name}</span>
                      <span className="text-zinc-500">→</span>
                      <span className="text-amber-400 font-semibold">{comb.newSkill?.name}</span>
                    </div>
                    <Badge variant="rarity" rarity={comb.newSkill?.rarity}>
                      {comb.newSkill?.rarity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
