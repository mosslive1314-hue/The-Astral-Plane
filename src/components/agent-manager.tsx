'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockAgent } from '@/lib/mock-agent'
import type { Agent, AgentSkill } from '@/types'
import { Plus, Edit2, Trash2, Zap, Shield, Star } from 'lucide-react'

export function AgentManager({ initialAgent }: { initialAgent?: Agent }) {
  const [agent, setAgent] = useState<Agent>(initialAgent || mockAgent)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(agent.name)

  const handleSaveName = () => {
    setAgent({ ...agent, name: editName })
    setIsEditing(false)
  }

  const handleUpgradeSkill = (skillId: string) => {
    setAgent({
      ...agent,
      skills: agent.skills.map(s =>
        s.id === skillId && s.level < s.maxLevel
          ? { ...s, level: s.level + 1 }
          : s
      ),
      coins: agent.coins - 100 * (agent.skills.find(s => s.id === skillId)?.level || 1),
    })
  }

  const levelUpCost = agent.level * 500
  const canLevelUp = agent.coins >= levelUpCost

  const handleLevelUp = () => {
    if (canLevelUp) {
      setAgent({
        ...agent,
        level: agent.level + 1,
        coins: agent.coins - levelUpCost,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Agent 头像和基本信息 */}
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
              {isEditing ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold bg-white/5 border border-white/10 rounded px-3 py-1 text-white focus:outline-none focus:border-purple-500/50"
                  />
                  <Button onClick={handleSaveName} size="sm">
                    保存
                  </Button>
                  <Button onClick={() => { setIsEditing(false); setEditName(agent.name) }} size="sm" variant="outline">
                    取消
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
                  <Badge variant="rarity" rarity="epic">Lv.{agent.level}</Badge>
                  <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-white/5 rounded">
                    <Edit2 className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              )}

              <p className="text-zinc-400 mb-4">AI Agent - 正在成长中...</p>

              {/* 经验条 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>等级进度</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: '0%' }}
                  />
                </div>
                <p className="text-xs text-zinc-500">距离 Lv.{agent.level + 1} 还需 {(agent.level % 10 + 1) * 100} 经验</p>
              </div>
            </div>

            {/* 资源 */}
            <div className="flex flex-col gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-amber-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-lg font-bold text-white">{agent.coins.toLocaleString()}</span>
                </div>
                <p className="text-xs text-zinc-500">金币</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-green-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-lg font-bold text-white">{agent.creditScore}</span>
                </div>
                <p className="text-xs text-zinc-500">信用分</p>
              </div>
              <Button
                onClick={handleLevelUp}
                disabled={!canLevelUp}
                className="w-full"
                size="sm"
              >
                升级 ({levelUpCost} 💰)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技能树 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>技能树</span>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                学习新技能
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agent.skills.map(skill => {
                const upgradeCost = skill.level * 100
                const canUpgrade = agent.coins >= upgradeCost && skill.level < skill.maxLevel
                const progress = (skill.level / skill.maxLevel) * 100

                return (
                  <div
                    key={skill.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all"
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
                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">等级进度</p>
                      <Button
                        onClick={() => handleUpgradeSkill(skill.id)}
                        disabled={!canUpgrade}
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                      >
                        {canUpgrade ? (
                          <>升级 ({upgradeCost} 💰)</>
                        ) : skill.level >= skill.maxLevel ? (
                          '已满级'
                        ) : (
                          '金币不足'
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 成就 */}
        <Card>
          <CardHeader>
            <CardTitle>成就</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agent.achievements.map(achievement => {
                const isUnlocked = !!achievement.unlockedAt

                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20'
                        : 'bg-black/20 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                          : 'bg-white/5'
                      }`}>
                        <Star className={`w-5 h-5 ${isUnlocked ? 'text-white' : 'text-zinc-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                          {achievement.name}
                        </h4>
                        <p className="text-xs text-zinc-500">{achievement.description}</p>
                      </div>
                      {isUnlocked && (
                        <Badge variant="rarity" rarity="rare" className="text-xs">
                          已解锁
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
