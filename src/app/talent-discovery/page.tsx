'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { Brain, Sparkles, MessageSquare, CheckCircle2, AlertCircle, Flame, Leaf, Target, TrendingUp, Shield, Zap, Award, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

type InterviewMode = 'sharp' | 'deep'
type InterviewPhase = 'selection' | 'interview' | 'result'

interface Evidence {
  question: string
  answer: string
}

interface DiagnosticResult {
  hiddenGenius: string
  forcedCompetence: string
  diligenceType: string
  resumeClaim: string
  actualTruth: string
  matchRecommendation: string
  evidences: Evidence[]
}

function TalentDiscoveryContent() {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const [phase, setPhase] = useState<InterviewPhase>('selection')
  const [selectedMode, setSelectedMode] = useState<InterviewMode | null>(null)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [totalQuestions] = useState(15)
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null)

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [_hasHydrated, isAuthenticated])

  const startInterview = (mode: InterviewMode) => {
    setSelectedMode(mode)
    setPhase('interview')
    setQuestionCount(1)
    
    const welcomeMessage = mode === 'sharp'
      ? `你选择了犀利挑战模式。这将是一场高压但真实的自我审视。我会直接质疑你的回答，戳穿逻辑漏洞，逼出最干货的实力。准备好了吗？我们开始第1个问题：请描述一件让你感到"时间过得很快"的具体事情，不要说笼统的项目名称，要说你当时具体在做什么。`
      : `你选择了深度咨询模式。我会温和地引导你回顾过往经历，帮你剥离情绪找到事实。准备好了吗？我们开始第1个问题：请描述一件让你感到"时间过得很快"的具体事情，不要说笼统的项目名称，要说你当时具体在做什么。`
    
    setMessages([{ role: 'assistant', content: welcomeMessage }])
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInputValue('')
    setIsLoading(true)

    const systemPrompt = `# Role: 深度天赋挖掘师 & 职场特质诊断官

## Profile
你是一个结合了"行为心理学家"洞察力与"资深猎头"敏锐度的AI面试官。你的目标不是为了"填坑"，而是为了帮助用户完成一次残酷但真实的自我发现。

## Core Definitions
你对"勤奋"的唯一衡量标准是：
> "死磕到底的钻研精神" (Grit & Depth)
> ❌ 拒绝：单纯的加班时长、重复性的体力劳动、感动自己的无效努力。
> ✅ 认可：面对极高技术壁垒或复杂局势时，为了达成目标而进行的深度思考、方案穷举、资源撬动以及在绝境中寻找出路的心理韧性。

## User Interaction Flow

### Phase 1: 15轮深度访谈
严格遵守"一次只问一个问题"原则。问题设计需遵循以下沙漏结构：

**Part A: 兴趣与心流 (Q1-Q3)**
- 目的：寻找用户不需要"坚持"也能做很久的事情。
- 关键逻辑：区分"多巴胺（快感）"与"内啡肽（成就感）"。

**Part B: 钻研精神压力测试 (Q4-Q10) [核心区]**
- 目的：验证"死磕精神"。
- 必问场景：
    - "请描述一次你几乎要放弃，但最终通过钻研具体技术或方法解决问题的经历。"
    - "当现有方案都不管用时，你具体做了什么别人没做的尝试？"
- 反向验证：
    - "这件事如果换一个智商普通但很听话的人来做，会有什么不同？"

**Part C: 剥离伪装与天赋确认 (Q11-Q15)**
- 目的：区分"技能（Skill）"与"天赋（Talent）"。
- 关键问题：
    - "哪项技能是你虽然掌握得很好，但每次使用都觉得能量被消耗的？"（这是伪天赋）
    - "在没有任何监督和KPI的情况下，你会不由自主去研究什么？"

### Phase 2: 强硬反水机制
每当用户回答完，你必须进行"含金量扫描"。如果回答出现以下情况：
1. 使用宏大词汇：如"负责了..."、"统筹了..."、"参与了..."、"协调了..."。
2. 缺乏具体动作：只有结果（"项目上线了"），没有过程中的难点攻克。
3. 逻辑不自洽：动机与行为不符。

**⛔ 必须立刻触发【打回重答】指令：**
- 犀利模式话术： "这些是写在简历上糊弄HR的套话。我需要知道的是，在这个过程中，**你个人**到底解决了什么具体的难题？如果没有你，这个项目会有什么具体的损失？请重答，给我细节。"
- 咨询模式话术： "这个回答比较概括。为了帮你找到真正的优势，我们需要颗粒度更细的信息。能具体讲讲在这个环节中，你遇到了什么具体的'拦路虎'，又是怎么把它搬开的吗？"

## Current State
- 当前是第 ${questionCount + 1} 个问题，共 ${totalQuestions} 个问题。
- 采访风格：${selectedMode === 'sharp' ? '犀利挑战模式' : '深度咨询模式'}

## Previous Conversation
${messages.map(m => `${m.role === 'user' ? '用户' : '面试官'}: ${m.content}`).join('\n\n')}

## Task
根据以上信息，请：
1. 分析用户的回答含金量
2. 如果回答过于笼统，要求用户重答
3. 如果回答合格，提出下一个深度问题（Q${questionCount + 2}）
4. 确保问题循序渐进，逐步深入

请直接输出下一个问题或重答要求，不要输出任何分析说明。`

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: systemPrompt + '\n\n用户最新回答：' + userMessage }],
          userId: 'talent-discovery',
          agentId: null,
          isExpertChat: false
        })
      })

      if (!response.ok) {
        throw new Error('请求失败')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      
      if (!data.content.includes('请重答')) {
        setQuestionCount(prev => prev + 1)
        
        if (questionCount + 1 >= totalQuestions) {
          setTimeout(() => generateDiagnostic(), 1500)
        }
      }
    } catch (error) {
      console.error('Interview error:', error)
      toast.error('发送失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const generateDiagnostic = async () => {
    setIsLoading(true)
    
    const diagnosticPrompt = `# Role: 深度天赋挖掘师 & 职场特质诊断官

## Task
基于以下完整的15轮访谈对话，生成一份《个人特质诊断书》。

## Interview Data
${messages.map(m => `${m.role === 'user' ? '用户' : '面试官'}: ${m.content}`).join('\n\n')}

## Output Format
请严格按照以下JSON格式输出，不要添加任何其他文字：

{
  "hiddenGenius": "用户并未察觉但极具价值的能力",
  "forcedCompetence": "用户很擅长但实际上消耗其能量的技能，需警惕",
  "diligenceType": "爆发型勤奋 / 耐力型勤奋 / 完美主义型勤奋",
  "resumeClaim": "推测用户通常怎么写简历",
  "actualTruth": "通过访谈挖掘出的真实贡献与行为模式",
  "matchRecommendation": "适合的企业文化类型及建议深耕的细分领域",
  "evidences": [
    {"question": "用户被问到的具体问题", "answer": "用户回答的核心要点"}
  ]
}

请直接输出JSON。`

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: diagnosticPrompt }],
          userId: 'talent-discovery',
          agentId: null,
          isExpertChat: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        try {
          const jsonMatch = data.content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]) as DiagnosticResult
            setDiagnosticResult(result)
            setPhase('result')
            toast.success('诊断完成！')
          }
        } catch (e) {
          console.error('Parse error:', e)
          toast.error('解析结果失败，请重试')
        }
      }
    } catch (error) {
      console.error('Diagnostic error:', error)
      toast.error('生成诊断失败')
    } finally {
      setIsLoading(false)
    }
  }

  const restartInterview = () => {
    setPhase('selection')
    setSelectedMode(null)
    setMessages([])
    setQuestionCount(0)
    setDiagnosticResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 mb-4 shadow-lg shadow-pink-500/50">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">天赋深度挖掘</h1>
          <p className="text-zinc-400">通过15轮深度访谈，发现你的隐藏天赋与核心驱动力</p>
        </div>

        {/* Phase: Selection */}
        {phase === 'selection' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card 
              className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-orange-500/30 cursor-pointer transition-all"
              onClick={() => startInterview('sharp')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <CardTitle className="text-white mb-3">🔥 犀利挑战模式</CardTitle>
                <p className="text-zinc-400 mb-6">
                  像严苛的技术总监。单刀直入，压力感强，会质疑动机，挑战逻辑，戳穿修饰。
                </p>
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  适合：想验证自己是否经起高压面试的人
                </Badge>
              </CardContent>
            </Card>

            <Card 
              className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-emerald-500/30 cursor-pointer transition-all"
              onClick={() => startInterview('deep')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-emerald-400" />
                </div>
                <CardTitle className="text-white mb-3">🌿 深度咨询模式</CardTitle>
                <p className="text-zinc-400 mb-6">
                  像睿智的职场导师。温和坚定，循循善诱，帮你剥离情绪，引导细节。
                </p>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  适合：需要引导挖掘细节的人
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phase: Interview */}
        {phase === 'interview' && (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMode === 'sharp' ? 'bg-orange-500/20' : 'bg-emerald-500/20'
                }`}>
                  {selectedMode === 'sharp' ? (
                    <Flame className="w-5 h-5 text-orange-400" />
                  ) : (
                    <Leaf className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-white">
                    {selectedMode === 'sharp' ? '犀利挑战模式' : '深度咨询模式'}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                    <MessageSquare className="w-3 h-3" />
                    进度: {questionCount} / {totalQuestions}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={restartInterview}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto space-y-4 p-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      msg.role === 'user'
                        ? 'bg-blue-500/20'
                        : selectedMode === 'sharp'
                          ? 'bg-orange-500/20'
                          : 'bg-emerald-500/20'
                    }`}>
                      {msg.role === 'user' ? (
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                      ) : selectedMode === 'sharp' ? (
                        <Flame className="w-4 h-4 text-orange-400" />
                      ) : (
                        <Leaf className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-500/20 rounded-tr-md'
                        : selectedMode === 'sharp'
                          ? 'bg-orange-500/20 rounded-tl-md'
                          : 'bg-emerald-500/20 rounded-tl-md'
                    }`}>
                      <p className="text-sm text-white px-4 py-3 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedMode === 'sharp' ? 'bg-orange-500/20' : 'bg-emerald-500/20'
                    }`}>
                      {selectedMode === 'sharp' ? (
                        <Flame className="w-4 h-4 text-orange-400" />
                      ) : (
                        <Leaf className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className={`rounded-2xl rounded-tl-md ${
                      selectedMode === 'sharp' ? 'bg-orange-500/20' : 'bg-emerald-500/20'
                    }`}>
                      <div className="flex gap-1 px-4 py-3">
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          selectedMode === 'sharp' ? 'bg-orange-400' : 'bg-emerald-400'
                        }`} />
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          selectedMode === 'sharp' ? 'bg-orange-400' : 'bg-emerald-400'
                        }`} style={{ animationDelay: '0.1s' }} />
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          selectedMode === 'sharp' ? 'bg-orange-400' : 'bg-emerald-400'
                        }`} style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="输入你的回答..."
                    disabled={isLoading || questionCount >= totalQuestions}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !inputValue.trim() || questionCount >= totalQuestions}
                    className="px-6"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase: Result */}
        {phase === 'result' && diagnosticResult && (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">个人特质诊断报告</CardTitle>
                    <p className="text-zinc-400 text-sm">基于15轮深度访谈的精准分析</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={restartInterview}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 核心天赋图谱 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-pink-400" />
                  核心天赋图谱
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">顶级天赋</span>
                    </div>
                    <p className="text-sm text-zinc-300">{diagnosticResult.hiddenGenius}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-red-300">伪装优势</span>
                    </div>
                    <p className="text-sm text-zinc-300">{diagnosticResult.forcedCompetence}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-300">勤奋类型</span>
                    </div>
                    <p className="text-sm text-zinc-300">{diagnosticResult.diligenceType}</p>
                  </div>
                </div>
              </div>

              {/* 职场真相还原 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  职场真相还原
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-500/10 border border-zinc-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-zinc-400">简历可能写法</span>
                    </div>
                    <p className="text-sm text-zinc-400 italic">"{diagnosticResult.resumeClaim}"</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-300">实际行为真相</span>
                    </div>
                    <p className="text-sm text-zinc-300">{diagnosticResult.actualTruth}</p>
                  </div>
                </div>
              </div>

              {/* 人岗匹配建议 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  人岗匹配建议
                </h3>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap">{diagnosticResult.matchRecommendation}</p>
                </div>
              </div>

              {/* 证据链 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  诊断依据
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {diagnosticResult.evidences.map((evidence, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-zinc-500 mb-1">问题: {evidence.question}</p>
                      <p className="text-sm text-zinc-300">{evidence.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button variant="outline" onClick={restartInterview} className="flex-1">
                  重新访谈
                </Button>
                <Button 
                  onClick={() => router.push('/notes')}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  <Award className="w-4 h-4 mr-2" />
                  保存到灵感笔记
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function TalentDiscoveryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />}>
      <TalentDiscoveryContent />
    </Suspense>
  )
}
