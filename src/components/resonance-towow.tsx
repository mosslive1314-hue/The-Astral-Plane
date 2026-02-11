'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, Send, Radio, Wifi, Zap, User, Code, FileText, Sparkles, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { broadcastRequirement } from '@/lib/towow-api'
import { RequirementFormulation, AgentOffer } from '@/lib/towow-api'

type AgentType = 'agent' | 'skill' | 'solution'

interface ResonatingItem {
  id: string
  type: AgentType
  name: string
  desc: string
  match: number
  status: '在线' | '离线' | '忙碌'
  offer?: any
}

export function ResonanceTowow() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ResonatingItem[]>([])
  const [formulation, setFormulation] = useState<RequirementFormulation | null>(null)

  const handleBroadcast = async () => {
    if (!query.trim()) {
      toast.error('请输入需求')
      return
    }

    setIsBroadcasting(true)
    setResults([])
    setFormulation(null)

    try {
      const response = await broadcastRequirement(query)

      setFormulation(response.formulation)

      const resonatingItems: ResonatingItem[] = response.agents.map((offer, index) => {
        const types: AgentType[] = ['agent', 'skill', 'solution']
        const type = types[index % 3]

        return {
          id: offer.id,
          type,
          name: offer.agent_name,
          desc: offer.offer_content 
            ? `根据您的需求，这位专家的共振分数为 ${(offer.resonance_score * 100).toFixed(1)}%。`
            : '等待更多详细信息...',
          match: Math.round(offer.resonance_score * 100),
          status: '在线',
          offer: offer.offer_content,
        }
      })

      setResults(resonatingItems)

      toast.success('灵波已发射', {
        description: `通过通爻协议，找到 ${resonatingItems.length} 个共振的智能体`
      })
    } catch (error: any) {
      console.error('广播失败:', error)
      toast.error('广播失败', {
        description: error.message || '请稍后重试'
      })
    } finally {
      setIsBroadcasting(false)
    }
  }

  const handleItemAction = async (item: ResonatingItem) => {
    setIsProcessing(true)

    try {
      if (item.type === 'agent') {
        toast.info('正在连接专家...', {
          description: '即将跳转到专家详情页'
        })

        setTimeout(() => {
          setIsProcessing(false)
          router.push(`/agent/${item.id}`)
        }, 1500)
      } else if (item.type === 'skill') {
        toast.loading('正在搜索技能市场...', { id: 'skill-search' })

        setTimeout(() => {
          setIsProcessing(false)
          toast.success('已跳转至技能市场', {
            id: 'skill-search',
            description: '正在为您展示相关技能'
          })
          router.push('/lingxu?tab=market&subtab=spot&search=' + encodeURIComponent(item.name))
        }, 1500)
      } else if (item.type === 'solution') {
        setIsProcessing(false)
        toast.info('跳转到发布悬赏页面', {
          description: '请填写详细的任务信息'
        })
        router.push(`/lingxu?tab=tasks&action=post&title=${encodeURIComponent(item.name)}`)
      }
    } catch (error: any) {
      console.error('操作失败:', error)
      setIsProcessing(false)
      toast.error('操作失败', {
        description: error.message || '请稍后重试'
      })
    }
  }

  const handleVoiceInput = () => {
    const topics = [
      '我需要审核一份跨境贸易的法律合同',
      '帮我分析这只股票的量化交易策略',
      '寻找一个能优化全球物流路径的方案',
      '分析这段蛋白质的折叠结构',
      '训练一个机械臂抓取杯子的模型'
    ]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    setQuery(randomTopic)
    toast.info('已捕获语音输入', { description: randomTopic })

    setTimeout(() => {
      const btn = document.getElementById('towow-broadcast-btn')
      if (btn) btn.click()
    }, 500)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="relative flex flex-col items-center justify-center">
        {isBroadcasting && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute border border-purple-500/30 rounded-full"
                initial={{ width: '100px', height: '100px', opacity: 1 }}
                animate={{ width: '800px', height: '800px', opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}

        <div className={`absolute inset-0 bg-purple-500/10 blur-3xl rounded-full transition-opacity duration-1000 ${isBroadcasting ? 'opacity-100' : 'opacity-0'}`} />

        <Card className="relative z-10 bg-black/40 border-purple-500/30 backdrop-blur-xl p-1 overflow-hidden w-full max-w-lg shadow-[0_0_50px_rgba(168,85,247,0.15)] mx-auto">
          <div className="flex items-center gap-2 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl transition-all duration-300 hover:bg-white/5 text-zinc-400"
              onClick={handleVoiceInput}
            >
              <Mic className="w-5 h-5" />
            </Button>

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入灵感，创造未来（通爻协议）"
              className="border-0 bg-transparent text-lg text-white placeholder:text-zinc-500 focus-visible:ring-0 h-14 font-light text-center"
              onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
            />

            <Button
              id="towow-broadcast-btn"
              size="icon"
              className={`h-12 w-12 rounded-xl transition-all duration-500 ${isBroadcasting ? 'bg-white text-purple-600 scale-110' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              onClick={handleBroadcast}
              disabled={isBroadcasting || !query.trim()}
            >
              {isBroadcasting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wifi className="w-5 h-5 rotate-45" />
              )}
            </Button>
          </div>

          {isBroadcasting && (
            <motion.div
              className="h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
              initial={{ width: "0%", opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          )}
        </Card>

        <div className="mt-4 text-center text-xs text-zinc-500 font-mono tracking-widest uppercase opacity-70">
          {isBroadcasting ? (
            <span className="animate-pulse text-purple-400">⚡ 通爻协议广播中...</span>
          ) : (
            '通过通爻协议，让需求找到最匹配的智能体'
          )}
        </div>
      </div>

      {formulation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 mt-1" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-2">需求已理解（通爻Formulation）</h4>
              <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                {formulation.enriched}
              </p>
              <div className="flex flex-wrap gap-2">
                {formulation.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-purple-500/30 text-purple-300 bg-purple-500/10">
                    {keyword}
                  </Badge>
                ))}
              </div>
              {formulation.confidence && (
                <div className="mt-3 text-xs text-zinc-500">
                  理解置信度: <span className="text-emerald-400 font-medium">{(formulation.confidence * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {results.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group relative bg-black/40 border border-white/5 p-4 rounded-xl hover:border-purple-500/50 transition-all h-full flex flex-col hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                onClick={() => handleItemAction(item)}
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />
                  {item.match}% 共振
                </div>

                <div className="flex flex-col items-center justify-center gap-2 mb-2 mt-8">
                  <div className={`p-2 rounded-full bg-opacity-20 ${
                    item.type === 'agent' ? 'bg-blue-500 text-blue-400' :
                    item.type === 'skill' ? 'bg-purple-500 text-purple-400' :
                    'bg-emerald-500 text-emerald-400'
                  }`}>
                    {item.type === 'agent' && <User className="w-4 h-4" />}
                    {item.type === 'skill' && <Code className="w-4 h-4" />}
                    {item.type === 'solution' && <FileText className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase scale-90">
                    {item.type === 'agent' ? '专家 / AGENT' :
                     item.type === 'skill' ? '技能 / SKILL' :
                     '方案 / SOLUTION'}
                  </span>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed mb-4 flex-1 text-center px-4 flex items-center justify-center font-light tracking-wide">
                  {item.desc}
                </p>

                <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mt-auto">
                  <Sparkles className="w-3 h-3" />
                  {item.type === 'agent' ? '点击查看专家' :
                   item.type === 'skill' ? '点击搜索技能' :
                   '点击发布悬赏'}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!isBroadcasting && results.length > 0 && (
        <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-4 delay-500">
          <p className="text-zinc-500 mb-4 font-light tracking-wide text-sm">
            没有找到你想要的那束光？
          </p>
          <Button
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
            onClick={() => router.push('/lingxu')}
          >
            前往灵墟，探索更多可能性
          </Button>
        </div>
      )}
    </div>
  )
}
