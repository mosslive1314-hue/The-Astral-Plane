'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, Send, Radio, User, Code, FileText, Wifi, Zap, ShoppingBag, CheckCircle, Loader2, Sparkles, Clock, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { startRealNegotiation, pollNegotiationStatus, MatchedAgent, RequirementFormulation, NegotiationSession } from '@/lib/towow-api'

type AgentType = 'agent' | 'skill' | 'solution'

interface ResonatingItem {
  id: string
  type: AgentType
  name: string
  desc: string
  match: number
  status: '在线' | '离线' | '忙碌'
  offer?: any
  level?: number
  satisfactionRate?: number
  responseTime?: number
}

export function ResonanceEngineReal() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ResonatingItem[]>([])
  const [formulation, setFormulation] = useState<RequirementFormulation | null>(null)
  const [negotiationStatus, setNegotiationStatus] = useState<NegotiationSession | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  const handleBroadcast = async () => {
    if (!query.trim()) {
      toast.error('请输入需求')
      return
    }

    setIsBroadcasting(true)
    setResults([])
    setFormulation(null)
    setNegotiationStatus(null)
    setSessionId(null)

    try {
      const { sessionId, formulation, matchedAgents, status } = await startRealNegotiation(
        'user-001',
        query,
        5
      )

      setSessionId(sessionId)
      setFormulation(formulation)

      const types: AgentType[] = ['agent', 'skill', 'solution']
      const resonatingItems: ResonatingItem[] = matchedAgents.map((agent, index) => ({
        id: agent.id,
        type: types[index % 3],
        name: agent.name,
        desc: `根据您的需求，这位专家的共鸣分数为 ${(agent.resonance_score * 100).toFixed(1)}%。${agent.bio.substring(0, 50)}...`,
        match: Math.round(agent.resonance_score * 100),
        status: '在线',
        level: agent.level,
        satisfactionRate: agent.satisfaction_rate,
        responseTime: agent.response_time_minutes,
      }))

      setResults(resonatingItems)

      toast.success('通爻协议已启动', {
        description: `找到 ${matchedAgents.length} 个共鸣的智能体，正在协商中...`
      })

      // 开始轮询协商状态
      pollStatus(sessionId, resonatingItems)
    } catch (error: any) {
      console.error('广播失败:', error)
      toast.error('广播失败', {
        description: error.message || '请稍后重试'
      })
      setIsBroadcasting(false)
    }
  }

  const pollStatus = async (sid: string, initialItems: ResonatingItem[]) => {
    try {
      await pollNegotiationStatus(sid, (session) => {
        setNegotiationStatus(session)

        if (session.offers.length > 0) {
          const updatedItems = initialItems.map((item) => {
            const offer = session.offers.find((o) => o.agent_id === item.id)
            if (offer) {
              return {
                ...item,
                offer: offer.offer_content,
              }
            }
            return item
          })
          setResults(updatedItems)
        }
      })

      if (negotiationStatus?.status === 'completed') {
        setIsBroadcasting(false)
        toast.success('协商完成', {
          description: `已收集到 ${negotiationStatus.collected_offers} 个提案`
        })
      } else if (negotiationStatus?.status === 'timeout' || negotiationStatus?.status === 'failed') {
        setIsBroadcasting(false)
        toast.error('协商失败', {
          description: negotiationStatus.error_message || '请稍后重试'
        })
      }
    } catch (error) {
      console.error('轮询状态失败:', error)
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
    setIsListening(!isListening)
    if (!isListening) {
      toast.info('正在聆听灵感...', { description: '请说出您的需求' })
      setTimeout(() => {
        const topics = [
          '我需要审核一份跨境贸易的法律合同',
          '帮我分析这只股票的量化交易策略',
          '寻找一个能优化全球物流路径的方案',
          '分析这段蛋白质的折叠结构',
          '训练一个机械臂抓取杯子的模型'
        ]
        const randomTopic = topics[Math.floor(Math.random() * topics.length)]
        setQuery(randomTopic)
        setIsListening(false)
        setTimeout(() => {
          const btn = document.getElementById('broadcast-btn')
          if (btn) btn.click()
        }, 500)
      }, 3000)
    }
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
              className={`rounded-xl transition-all duration-300 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/5 text-zinc-400'}`}
              onClick={handleVoiceInput}
            >
              <Mic className="w-5 h-5" />
            </Button>

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isListening ? "正在聆听..." : "输入灵感，创造未来"}
              className="border-0 bg-transparent text-lg text-white placeholder:text-zinc-500 focus-visible:ring-0 h-14 font-light text-center"
              onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
            />

            <Button
              id="broadcast-btn"
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
            <span className="animate-pulse text-purple-400">
              {negotiationStatus ? `通爻协议协商中... (${negotiationStatus.collected_offers}/${negotiationStatus.expected_agents})` : '⚡ 通爻协议启动中...'}
            </span>
          ) : (
            '准备好发射灵感的光波了吗？'
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
              <p className="text-sm text-zinc-300 leading-relaxed">
                {formulation}
              </p>
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
                   {item.match}% 共鸣
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

                <div className="text-center mb-3">
                  <h3 className="text-sm font-semibold text-white mb-1">{item.name}</h3>
                  {item.level && (
                    <div className="flex items-center justify-center gap-1 text-xs text-zinc-400">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>等级 {item.level}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed mb-4 flex-1 text-center px-4 flex items-center justify-center font-light tracking-wide">
                  {item.desc}
                </p>

                {item.satisfactionRate && (
                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {item.satisfactionRate.toFixed(1)}
                    </span>
                    {item.responseTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.responseTime}分钟响应
                      </span>
                    )}
                  </div>
                )}

                {item.offer && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
                    <p className="text-xs text-purple-300 font-medium">
                      提案: {item.offer.content}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mt-auto">
                  <Sparkles className="w-3 h-3" />
                  {item.offer ? '查看完整提案' :
                   item.type === 'agent' ? '点击查看专家' :
                   item.type === 'skill' ? '点击搜索技能' :
                   '点击发布悬赏'}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {negotiationStatus?.final_solution && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/20 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 mt-1" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-2">协商完成</h4>
              <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                最佳匹配: {negotiationStatus.final_solution?.summary?.best_match}
              </p>
              <div className="text-xs text-zinc-500">
                收到 {negotiationStatus.final_solution?.recommendation?.total_offers} 个提案，
                已为您推荐最合适的专家
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
