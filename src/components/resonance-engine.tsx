'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, Send, Radio, User, Code, FileText, Wifi, Zap, ShoppingBag, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type ResonatingItem = {
  id: string
  type: 'agent' | 'skill' | 'task'
  name: string
  desc: string
  match: number
  status: '在线' | '离线' | '忙碌'
}

// 扩展的行业数据池
const INDUSTRY_DATA: Record<string, ResonatingItem[]> = {
  'law': [
    { id: 'l1', type: 'agent', name: 'LexMachina', desc: '合同审核与合规性检查专家 Agent', match: 99, status: '在线' },
    { id: 'l2', type: 'skill', name: '法律文书生成', desc: '自动生成标准 NDA 与服务协议', match: 92, status: '在线' },
    { id: 'l3', type: 'task', name: '审核跨境电商协议', desc: '急需熟悉欧盟 GDPR 的法律顾问', match: 85, status: '在线' }
  ],
  'finance': [
    { id: 'f1', type: 'agent', name: 'QuantAlpha', desc: '高频交易策略回测与风控 Agent', match: 98, status: '在线' },
    { id: 'f2', type: 'skill', name: '财报自动化分析', desc: '从 PDF 中提取关键财务指标', match: 94, status: '在线' },
    { id: 'f3', type: 'task', name: '构建加密资产组合', desc: '寻求 DeFi 收益聚合策略优化', match: 89, status: '在线' }
  ],
  'supply': [
    { id: 's1', type: 'agent', name: 'LogiOpt', desc: '供应链路径优化与库存预测 Agent', match: 97, status: '在线' },
    { id: 's2', type: 'skill', name: '全球货运追踪', desc: '实时集成海运/空运 API 数据', match: 91, status: '在线' },
    { id: 's3', type: 'task', name: '寻找越南代工厂', desc: '需要消费电子类目优质供应商', match: 86, status: '在线' }
  ],
  'bio': [
    { id: 'b1', type: 'agent', name: 'BioFold', desc: '蛋白质结构预测与药物筛选 Agent', match: 99, status: '忙碌' },
    { id: 'b2', type: 'skill', name: '基因序列比对', desc: '基于 BLAST 的云端加速分析', match: 95, status: '在线' },
    { id: 'b3', type: 'task', name: '分析临床试验数据', desc: '处理 II 期免疫治疗数据清洗', match: 90, status: '在线' }
  ],
  'robot': [
    { id: 'r1', type: 'agent', name: 'SimSim2Real', desc: '具身智能仿真训练环境搭建 Agent', match: 96, status: '在线' },
    { id: 'r2', type: 'skill', name: '机械臂路径规划', desc: '六轴机械臂避障算法', match: 93, status: '在线' },
    { id: 'r3', type: 'task', name: '训练抓取模型', desc: '提供 1000 小时真实抓取视频数据', match: 88, status: '在线' }
  ]
}

// 动态生成上下文相关的 Mock 数据
const generateDynamicResults = (query: string): ResonatingItem[] => {
  const q = query.toLowerCase()
  const results: ResonatingItem[] = []
  
  // 提取关键词简单的 NLP 模拟
  const actionKeywords = ['设计', '开发', '写', '做', '找', '买', '卖', 'design', 'dev', 'write']
  const topicKeywords = q.replace(new RegExp(actionKeywords.join('|'), 'g'), '').trim() || '通用任务'
  
  // 1. Agent 匹配 (专家)
  results.push({
    id: `dyn_agent_${Date.now()}`,
    type: 'agent',
    name: `资深领域专家`,
    desc: `拥有 10 年行业经验，擅长处理复杂架构与底层逻辑。已在灵界协助 50+ 项目成功落地。`,
    match: Math.floor(Math.random() * 5 + 95), // 95-99
    status: '在线'
  })

  // 2. Skill 匹配 (技能)
  results.push({
    id: `dyn_skill_${Date.now()}`,
    type: 'skill',
    name: `核心技能组`,
    desc: `建议组合：架构设计 + 实时渲染引擎 + 分布式计算。此组合可提升开发效率 300%。`,
    match: Math.floor(Math.random() * 10 + 85), // 85-95
    status: '在线'
  })

  // 3. Task 匹配 (方案) - 改为 Solution
  results.push({
    id: `dyn_task_${Date.now()}`,
    type: 'task', // 内部 ID 保持 task 方便逻辑兼容，但 UI 显示为 方案
    name: `落地白皮书`,
    desc: `一套经过验证的完整实施路径，包含从零到一的全部技术栈选型与风险规避指南。`,
    match: Math.floor(Math.random() * 10 + 80), // 80-90
    status: '在线'
  })

  return results
}

export function ResonanceEngine() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [results, setResults] = useState<ResonatingItem[]>([])
  const [isListening, setIsListening] = useState(false)
  
  const handleBroadcast = () => {
    if (!query.trim()) return
    
    setIsBroadcasting(true)
    setResults([])
    
    // 简单的关键词匹配逻辑
    const lowerQuery = query.toLowerCase()
    let matchedData: ResonatingItem[] = []
    
    if (lowerQuery.includes('法') || lowerQuery.includes('law') || lowerQuery.includes('合同') || lowerQuery.includes('合规')) {
      matchedData = INDUSTRY_DATA['law']
    } else if (lowerQuery.includes('金融') || lowerQuery.includes('finance') || lowerQuery.includes('股票') || lowerQuery.includes('币') || lowerQuery.includes('交易')) {
      matchedData = INDUSTRY_DATA['finance']
    } else if (lowerQuery.includes('物流') || lowerQuery.includes('supply') || lowerQuery.includes('供应') || lowerQuery.includes('货')) {
      matchedData = INDUSTRY_DATA['supply']
    } else if (lowerQuery.includes('生物') || lowerQuery.includes('bio') || lowerQuery.includes('药') || lowerQuery.includes('基因')) {
      matchedData = INDUSTRY_DATA['bio']
    } else if (lowerQuery.includes('机器') || lowerQuery.includes('robot') || lowerQuery.includes('具身') || lowerQuery.includes('仿真')) {
      matchedData = INDUSTRY_DATA['robot']
    } else {
      // 如果没有特定行业匹配，则生成动态上下文结果
      matchedData = generateDynamicResults(query)
    }
    
    // 模拟共振过程
    setTimeout(() => {
      setResults(matchedData)
      setIsBroadcasting(false)
      toast.success('灵波已发射', { description: `全网共振完成，检测到 ${matchedData.length} 个深度相关回响` })
    }, 2000)
  }

  const handleVoiceInput = () => {
    setIsListening(!isListening)
    if (!isListening) {
      toast.info('正在聆听灵感...', { description: '请说出您的需求' })
      // 模拟语音输入 - 随机选择一个行业
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
        // 自动触发广播，但稍微延迟一点以便用户看到文字
        setTimeout(() => {
            const btn = document.getElementById('broadcast-btn')
            if (btn) btn.click()
        }, 500)
      }, 3000)
    }
  }

  const handleConnect = (item: ResonatingItem) => {
    if (item.type === 'task') {
      toast.info('正在跳转至任务详情...')
      router.push('/tasks')
    } else if (item.type === 'skill') {
      toast.info('正在跳转至交易所...')
      router.push('/exchange')
    } else {
      toast.info('正在建立加密通讯连接...')
      // router.push('/chat') // 未来实现
    }
  }

  const handlePublishTask = () => {
    toast.success('已将需求转换为任务草稿', { description: '请在任务大厅完成发布' })
    router.push('/tasks?action=post&title=' + encodeURIComponent(query))
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 -mt-24">
      {/* LingBo Emitter (灵波发射器) */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Title */}
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400/50 mb-2 tracking-tighter select-none">
           灵 波
        </h1>
        <p className="text-zinc-400 mb-8 font-light tracking-widest text-sm uppercase opacity-80">
           广播灵感直播，在共振中迸发全新的灵光
        </p>

        {/* 动态扩散光圈 (LingBo Effect) */}
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
              disabled={isBroadcasting}
            >
              {isBroadcasting ? <Radio className="w-5 h-5 animate-spin" /> : <Wifi className="w-5 h-5 rotate-45" />}
            </Button>
          </div>
          
          {/* Energy Bar */}
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
            <span className="animate-pulse text-purple-400">⚡ LingBo Broadcasting...</span>
          ) : (
            '准备好发射灵感的光波了吗？'
          )}
        </div>
      </div>

      {/* Resonance Field (Results) */}
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
                className="group relative bg-black/40 border border-white/5 p-4 rounded-xl hover:border-purple-500/50 transition-all cursor-pointer h-full flex flex-col hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                onClick={() => {
                   if(item.type === 'task') router.push('/lingxu')
                   if(item.type === 'skill') router.push('/lingxu')
                   if(item.type === 'agent') router.push('/profile') // Or a specific agent profile page
                }}
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                   <Zap className="w-3 h-3" />
                   {item.match}% 共振
                </div>

                <div className="flex flex-col items-center justify-center gap-2 mb-2 mt-4">
                  <div className={`p-2 rounded-full bg-opacity-20 ${
                    item.type === 'agent' ? 'bg-blue-500 text-blue-400' :
                    item.type === 'skill' ? 'bg-purple-500 text-purple-400' :
                    'bg-emerald-500 text-emerald-400'
                  }`}>
                    {item.type === 'agent' && <User className="w-4 h-4" />}
                    {item.type === 'skill' && <Code className="w-4 h-4" />}
                    {item.type === 'task' && <FileText className="w-4 h-4" />}
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Action Link */}
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
            前往灵墟，点亮新的灯塔
          </Button>
        </div>
      )}
    </div>
  )
}
