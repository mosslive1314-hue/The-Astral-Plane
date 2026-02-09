'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { User, Settings, LogOut, Shield, Zap, Award, Coins, BrainCircuit, Activity, Eye, EyeOff, Lock } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, agent, isAuthenticated, logout } = useAuthStore()
  const [isPublicView, setIsPublicView] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [permissionsOpen, setPermissionsOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleLogout = async () => {
    logout()
    router.push('/login')
  }

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen)
    if (!settingsOpen) {
      toast.info('系统设置已展开', { description: '您可以配置 Agent 的运行参数' })
    }
  }

  const togglePermissions = () => {
    setPermissionsOpen(!permissionsOpen)
    if (!permissionsOpen) {
      toast.info('协议权限已展开', { description: '管理 Towow 协议的授权范围' })
    }
  }

  if (!user || !agent) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
              <BrainCircuit className="w-8 h-8 text-cyan-400" />
              灵体 <span className="text-lg font-normal text-zinc-500 font-mono">/ NEURAL TWIN</span>
            </h1>
            <p className="text-zinc-400">
              您的赛博本体与全网共振的核心枢纽
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-xs text-zinc-400">{isPublicView ? '公共视角' : '私有视角'}</span>
              <Switch checked={isPublicView} onCheckedChange={setIsPublicView} className="scale-75 data-[state=checked]:bg-cyan-500" />
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="w-4 h-4 mr-2" />
              断开连接
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Identity Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-[2px] mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-zinc-400" />
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{user.nickname}</h2>
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 bg-cyan-500/10">
                    {agent.name}
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/50 text-purple-400 bg-purple-500/10">
                    Lv.{agent.level}
                  </Badge>
                </div>
                
                <div className="w-full grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-zinc-500 mb-1">信用评分</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">{agent.creditScore}</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-zinc-500 mb-1">活跃度</div>
                    <div className="text-xl font-bold text-blue-400 font-mono">98%</div>
                  </div>
                </div>

                {!isPublicView && (
                  <div className="w-full space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={toggleSettings}
                      className={`w-full justify-start text-zinc-300 border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 ${settingsOpen ? 'bg-white/5 border-cyan-500/50 text-cyan-400' : ''}`}
                    >
                      <Settings className="w-4 h-4 mr-2" /> 系统设置
                    </Button>
                    {settingsOpen && (
                      <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-xs text-left space-y-2 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">自动接单</span>
                          <Switch className="scale-75" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">隐私模式</span>
                          <Switch className="scale-75" defaultChecked />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">算力共享</span>
                          <Switch className="scale-75" />
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={togglePermissions}
                      className={`w-full justify-start text-zinc-300 border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 ${permissionsOpen ? 'bg-white/5 border-cyan-500/50 text-cyan-400' : ''}`}
                    >
                      <Shield className="w-4 h-4 mr-2" /> 协议权限
                    </Button>
                    {permissionsOpen && (
                      <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-xs text-left space-y-2 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Lock className="w-3 h-3" />
                          <span>已授权 Towow 核心协议</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500">
                          <div className="w-3 h-3 rounded-full border border-zinc-600" />
                          <span>未授权资产自动交易</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assets Matrix */}
            <Card className="bg-black/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  资产矩阵
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                  <div className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    流动资金
                  </div>
                  <div className="text-3xl font-bold text-white font-mono tracking-tight">
                    {agent.coins.toLocaleString()} <span className="text-sm text-zinc-500">Coins</span>
                  </div>
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <span>▲ 12.5%</span>
                    <span className="text-zinc-600">本周收益</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                  <div className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    算力估值
                  </div>
                  <div className="text-3xl font-bold text-white font-mono tracking-tight">
                    {(agent.coins * 0.15).toFixed(0)} <span className="text-sm text-zinc-500">Hash/s</span>
                  </div>
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <span>▲ 5.2%</span>
                    <span className="text-zinc-600">性能提升</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Achievements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/20 border-white/5 h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-400">已加载模块 (Skills)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.skills.length > 0 ? (
                      agent.skills.map((skill: any) => (
                        <Badge key={skill.id} variant="secondary" className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border-transparent">
                          {skill.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-zinc-600 italic">暂无加载模块</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/5 h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-400">荣誉协议 (Achievements)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.achievements.length > 0 ? (
                      agent.achievements.map((ach: any) => (
                        <Badge key={ach.id} variant="outline" className="border-yellow-500/30 text-yellow-500 bg-yellow-500/5">
                          {ach.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-zinc-600 italic">暂无荣誉记录</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
