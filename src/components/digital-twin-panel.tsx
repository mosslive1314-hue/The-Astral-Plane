'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, Fingerprint, Zap, Brain, Activity, 
  ChevronRight, ChevronLeft, Shield, Target,
  RefreshCw
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { analyzePersona, type DigitalPersona } from '@/lib/persona-engine'
import { getUserShades } from '@/lib/oauth'

export function DigitalTwinPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { user, agent, tokens, shades, setShades } = useAuthStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 1. 获取 Shades 数据
  const fetchShades = async () => {
    if (!tokens?.access_token) return
    try {
      setIsRefreshing(true)
      const data = await getUserShades(tokens.access_token)
      // data 可能是对象数组，我们需要提取 shadeName 或 shadeContent
      // 假设 API 返回的结构是 { shades: [{ shadeName: "xxx", ... }] }
      // 或者我们的 getUserShades 已经处理成了 string[]，这里需要确认
      // 根据 lib/oauth.ts，getUserShades 返回 any[]，我们需要处理一下
      const shadeStrings = Array.isArray(data) 
        ? data.map((s: any) => typeof s === 'string' ? s : (s.shadeName || s.shadeContent || ''))
        : []
      
      setShades(shadeStrings)
    } catch (error) {
      console.error('Failed to update shades:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 2. 实时计算画像
  const persona: DigitalPersona | null = useMemo(() => {
    if (!shades || shades.length === 0) return null
    return analyzePersona(shades)
  }, [shades])

  // 首次加载自动获取
  useEffect(() => {
    if (tokens?.access_token && shades.length === 0) {
      fetchShades()
    }
  }, [tokens, shades.length])

  if (!user || !agent) return null

  // 如果没有数据，显示引导状态
  const displayPersona = persona || {
    archetype: '待觉醒的灵魂',
    traits: [
      { name: '理性', value: 50, color: 'bg-zinc-500' },
      { name: '感性', value: 50, color: 'bg-zinc-500' },
      { name: '冒险', value: 50, color: 'bg-zinc-500' },
      { name: '结构', value: 50, color: 'bg-zinc-500' }
    ],
    coreValues: ['数据不足'],
    buffs: []
  }

  return (
    <div 
      className={`fixed right-0 top-20 bottom-4 transition-all duration-300 ease-in-out z-40 flex ${
        isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-2rem)]'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-12 w-8 bg-purple-900/80 backdrop-blur border-l border-t border-b border-purple-500/30 rounded-l-lg flex items-center justify-center text-purple-300 hover:text-white transition-colors self-center shadow-lg shadow-purple-900/20"
      >
        {isExpanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Main Panel */}
      <Card className="w-80 h-full rounded-l-none rounded-r-none border-r-0 border-purple-500/30 bg-slate-950/90 backdrop-blur-xl overflow-y-auto custom-scrollbar shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-purple-400" />
              数字孪生 (Digital Twin)
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 text-zinc-500 hover:text-white p-0"
                onClick={fetchShades}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <span className="text-[10px] px-2 py-0.5 rounded border border-purple-500/30 text-purple-300">
                Live
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User Profile */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-[1px]">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-zinc-400" />
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{user.nickname}</h3>
              <p className="text-xs text-purple-300 flex items-center gap-1">
                <Target className="w-3 h-3" />
                {displayPersona.archetype}
              </p>
            </div>
          </div>

          {/* Radar / Stats */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">人格维度</h4>
            <div className="space-y-2">
              {displayPersona.traits.map(trait => (
                <div key={trait.name} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-zinc-400 text-right">{trait.name}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${trait.color}`} 
                      style={{ width: `${trait.value}%` }}
                    />
                  </div>
                  <span className="w-6 text-zinc-500 tabular-nums">{trait.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Values */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">核心价值观</h4>
            <div className="flex flex-wrap gap-2">
              {displayPersona.coreValues.length > 0 ? (
                displayPersona.coreValues.map(val => (
                  <div key={val} className="px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors">
                    {val}
                  </div>
                ))
              ) : (
                <span className="text-xs text-zinc-600">暂无数据</span>
              )}
            </div>
          </div>

          {/* Active Buffs */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3 h-3" />
              当前共鸣 (Buffs)
            </h4>
            <div className="grid gap-2">
              {displayPersona.buffs.length > 0 ? (
                displayPersona.buffs.map(buff => {
                  const Icon = buff.icon
                  return (
                    <div key={buff.name} className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 flex items-start gap-2">
                      <div className="p-1 rounded bg-purple-500/20 mt-0.5">
                        <Icon className="w-3 h-3 text-purple-300" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-purple-200">{buff.name}</div>
                        <div className="text-[10px] text-zinc-500">{buff.desc}</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-zinc-600 p-2 text-center border border-dashed border-zinc-800 rounded flex flex-col gap-2">
                  <span>暂无激活的共鸣</span>
                  <a 
                    href="https://second.me" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    前往 Second Me 创建分身以激活
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
              *数据基于您在 Second Me 的历史交互分析生成。<br/>
              您的每一次思考都在完善这个数字孪生。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
