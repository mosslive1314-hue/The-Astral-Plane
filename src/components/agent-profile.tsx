'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Award, Target, Zap, Shield, Star } from 'lucide-react'
import type { Agent } from '@/types'

interface AgentProfileProps {
  agent: Agent
}

export function AgentProfile({ agent }: AgentProfileProps) {
  const levelProgress = (agent.level % 10) * 10
  const nextLevel = agent.level + 1

  return (
    <div className="space-y-6">
      {/* Agent 基本信息 */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* 头像 */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-purple-500/50">
                {agent.name.charAt(0)}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold border-4 border-slate-900">
                {agent.level}
              </div>
            </div>

            {/* 信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
                <Badge variant="rarity" rarity="epic">Lv.{agent.level}</Badge>
              </div>
              <p className="text-zinc-400 mb-4">AI Agent - 正在成长中...</p>

              {/* 经验条 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>等级进度</span>
                  <span>{levelProgress}%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500">距离 Lv.{nextLevel} 还需 {(10 - agent.level % 10) * 100} 经验</p>
              </div>
            </div>

            {/* 资源 */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1 text-amber-400">
                  <Zap className="w-5 h-5" />
                  <span className="text-xl font-bold text-white">{agent.coins.toLocaleString()}</span>
                </div>
                <p className="text-xs text-zinc-500">金币</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-green-400">
                  <Shield className="w-5 h-5" />
                  <span className="text-xl font-bold text-white">{agent.creditScore}</span>
                </div>
                <p className="text-xs text-zinc-500">信用分</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技能树 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            技能树
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agent.skills.map(skill => (
              <div
                key={skill.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{skill.name}</h3>
                    <p className="text-xs text-zinc-500">{skill.category}</p>
                  </div>
                  <Badge variant="category" className="text-xs">
                    Lv.{skill.level}/{skill.maxLevel}
                  </Badge>
                </div>
                <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 成就 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            成就
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agent.achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlockedAt
                    ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20'
                    : 'bg-black/20 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    achievement.unlockedAt
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                      : 'bg-white/5'
                  }`}>
                    <Star className={`w-5 h-5 ${achievement.unlockedAt ? 'text-white' : 'text-zinc-600'}`} />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${achievement.unlockedAt ? 'text-white' : 'text-zinc-500'}`}>
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-zinc-500">{achievement.description}</p>
                  </div>
                </div>
                {achievement.unlockedAt && (
                  <p className="text-xs text-amber-400">
                    已解锁 • {achievement.unlockedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
