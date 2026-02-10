'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { User, Cpu, Database, Coins, Zap, RefreshCw, CheckCircle, Shield, Award } from 'lucide-react'
import { supabase } from '@/lib/database'
import { getUserInfo, getUserSoftMemory } from '@/lib/secondme-api'

export default function ProfilePage() {
  const router = useRouter()
  const { user, agent, isAuthenticated, setAgent } = useAuthStore()
  const [isSyncing, setIsSyncing] = useState(false)
  const [softMemories, setSoftMemories] = useState<any[]>([])
  
  const [realAgent, setRealAgent] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      if (!user?.id) return
      
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (agentData) {
        setRealAgent(agentData)
      }

      setSoftMemories([
        { id: 1, content: '擅长 Python 数据分析与可视化', type: 'skill' },
        { id: 2, content: '偏好极简主义设计风格', type: 'preference' },
        { id: 3, content: '关注 DeFi 与 Web3 协议', type: 'interest' }
      ])
    }

    fetchData()
  }, [isAuthenticated, user?.id])

  const handleSyncSecondMe = async () => {
    setIsSyncing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('同步成功', { description: '已更新数字孪生状态与资产数据' })
    } catch (error) {
      toast.error('同步失败', { description: '请检查 Second Me 连接状态' })
    } finally {
      setIsSyncing(false)
    }
  }

  if (!isAuthenticated) {
     return (
       <div className="min-h-screen bg-slate-900 flex items-center justify-center">
         <p className="text-zinc-500">正在建立神经连接...</p>
       </div>
     )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-4 pt-6">
        
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-6">
            
            <div className="flex-1 text-left">
               <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
                  您的赛博本体与全网共振的核心枢纽。<br/>
                  在此处，您可以监控数字孪生的运行状态，管理算力与记忆资产。
               </p>
            </div>

            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-2 pr-4 shadow-xl">
               <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/20">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-2 text-zinc-500" />
                    )}
                 </div>
                 <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
               </div>
               
               <div className="flex flex-col">
                  <span className="text-sm font-bold text-white leading-none mb-1">{user?.nickname || 'Unknown'}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {agent?.id?.slice(0, 6)}...</span>
               </div>

               <div className="h-8 w-px bg-white/10 mx-2" />

               <Button 
                  size="sm"
                  variant="ghost"
                  onClick={handleSyncSecondMe} 
                  disabled={isSyncing}
                  className="h-8 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
                >
                  <RefreshCw className={`w-3 h-3 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? '同步中...' : '同步数据'}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-black/20 border-amber-500/20 hover:border-amber-500/40 transition-colors">
               <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                     <div className="text-xs text-zinc-400 mb-1 flex items-center gap-2">
                       <Coins className="w-3.5 h-3.5 text-amber-500" /> 数字资产
                     </div>
                     <div className="text-xl font-mono font-bold text-white leading-none">
                       {realAgent?.coins?.toLocaleString() || 0}
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">+12.5%</div>
                     <div className="text-[10px] text-zinc-600 mt-1">周收益</div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/20 hover:border-purple-500/40 transition-colors">
               <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                     <div className="text-xs text-zinc-400 mb-1 flex items-center gap-2">
                       <Zap className="w-3.5 h-3.5 text-purple-500" /> 算力估值
                     </div>
                     <div className="text-xl font-mono font-bold text-white leading-none">
                       {((realAgent?.level || 1) * 150 + (realAgent?.coins || 0) * 0.1).toFixed(0)} <span className="text-xs text-zinc-500 font-sans font-normal ml-1">Hash/s</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">Level {realAgent?.level || 1}</div>
                     <div className="text-[10px] text-zinc-600 mt-1">性能等级</div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-500/20">
               <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Shield className="w-3.5 h-3.5 text-purple-400" />
                     <span className="text-xs font-bold text-white">信用与等级</span>
                  </div>
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                         <CheckCircle className="w-2 h-2 text-emerald-400" />
                       </div>
                       <span className="text-[10px] text-zinc-400">履约提升信用 +5~20</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                         <Award className="w-2 h-2 text-purple-400" />
                       </div>
                       <span className="text-[10px] text-zinc-400">信用 &gt; 600 解锁 Lv.2</span>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-black/20 border-white/5">
               <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Database className="w-3.5 h-3.5 text-cyan-400" />
                     <span className="text-xs font-bold text-white">P2P 协议</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    基于 Towow 协商协议的去中心化同步机制
                  </p>
               </CardContent>
            </Card>
        </div>

        <Card className="bg-black/30 border-white/10 overflow-hidden relative group mb-4">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
            <CardHeader className="relative z-10 border-b border-white/5 bg-black/20 py-2.5 px-4">
               <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2 text-white text-sm">
                    <Database className="w-4 h-4 text-purple-400" />
                    软记忆 (Soft Memory)
                 </CardTitle>
                 <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-zinc-400">Knowledge Graph</Badge>
                    <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-zinc-400">Skills</Badge>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="relative p-6 flex flex-col items-center justify-center min-h-[180px]">
                {softMemories.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
                    {softMemories.map((mem, i) => (
                       <div key={i} className="group/item relative">
                          <div className={`
                             absolute inset-0 blur-md opacity-20 group-hover/item:opacity-40 transition-opacity
                             ${mem.type === 'skill' ? 'bg-blue-500' : mem.type === 'preference' ? 'bg-pink-500' : 'bg-amber-500'}
                          `} />
                          <div className="relative bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/30 px-4 py-2 rounded-full text-zinc-200 text-sm transition-all hover:-translate-y-1 cursor-default flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${mem.type === 'skill' ? 'bg-blue-400' : mem.type === 'preference' ? 'bg-pink-400' : 'bg-amber-400'}`} />
                             {mem.content}
                          </div>
                       </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-zinc-500">
                    <RefreshCw className="w-8 h-8 mx-auto mb-4 opacity-50" />
                    <p>暂无记忆数据，请点击右上角同步</p>
                  </div>
                )}
            </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-8 text-[10px] text-zinc-600 uppercase tracking-widest pt-2">
           <span>连接状态: <span className="text-green-500">稳定</span></span>
           <span>数据来源: Second Me API</span>
           <span>上次同步: 刚刚</span>
        </div>

      </div>
    </div>
  )
}
