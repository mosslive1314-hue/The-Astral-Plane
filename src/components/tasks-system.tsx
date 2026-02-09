'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockTasks } from '@/lib/tasks-data'
import type { Task } from '@/lib/tasks-data'
import { CheckCircle, Clock, DollarSign, Star, Trophy, Target } from 'lucide-react'

const difficultyConfig = {
  easy: { label: '简单', color: 'bg-green-500/20 text-green-400 border-green-500/30', points: 1 },
  medium: { label: '中等', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', points: 2 },
  hard: { label: '困难', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', points: 3 },
  expert: { label: '专家', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', points: 5 },
}

const statusConfig = {
  open: { label: '可接受', icon: Target, color: 'text-green-400' },
  in_progress: { label: '进行中', icon: Clock, color: 'text-blue-400' },
  completed: { label: '待验证', icon: CheckCircle, color: 'text-amber-400' },
  verified: { label: '已完成', icon: Trophy, color: 'text-purple-400' },
}

export function TasksSystem() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [filter, setFilter] = useState<'all' | 'available' | 'in_progress' | 'completed'>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    if (filter === 'available') return task.status === 'open'
    if (filter === 'in_progress') return task.status === 'in_progress'
    if (filter === 'completed') return task.status === 'completed' || task.status === 'verified'
    return true
  })

  const handleAcceptTask = (taskId: string) => {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'in_progress' as const, assignee_id: 'current_agent' } : t
    ))
  }

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'completed' as const } : t
    ))
  }

  return (
    <div className="space-y-6">
      {/* 任务统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'open').length}</p>
                <p className="text-sm text-zinc-400">可接受</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'in_progress').length}</p>
                <p className="text-sm text-zinc-400">进行中</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'completed').length}</p>
                <p className="text-sm text-zinc-400">待验证</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'verified').length}</p>
                <p className="text-sm text-zinc-400">已完成</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务筛选 */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          全部
        </Button>
        <Button
          variant={filter === 'available' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('available')}
        >
          可接受
        </Button>
        <Button
          variant={filter === 'in_progress' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('in_progress')}
        >
          进行中
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          已完成
        </Button>
      </div>

      {/* 任务列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.map(task => {
          const diffConfig = difficultyConfig[task.difficulty]
          const statusConf = statusConfig[task.status]
          const StatusIcon = statusConf.icon

          return (
            <Card
              key={task.id}
              className={`hover:border-purple-500/30 transition-all cursor-pointer ${
                task.status === 'verified' ? 'opacity-60' : ''
              }`}
              onClick={() => setSelectedTask(task)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{task.title}</h3>
                    <p className="text-sm text-zinc-400">{task.description}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${diffConfig.color}`}>
                    <Star className="w-3 h-3" />
                    {diffConfig.label}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">{task.reward}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${statusConf.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm">{statusConf.label}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-xs text-zinc-500">要求：</p>
                  {task.requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <div className="w-1 h-1 rounded-full bg-purple-400" />
                      {req}
                    </div>
                  ))}
                </div>

                {task.status === 'open' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAcceptTask(task.id)
                    }}
                    className="w-full"
                    size="sm"
                  >
                    接受任务
                  </Button>
                )}

                {task.status === 'in_progress' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCompleteTask(task.id)
                    }}
                    className="w-full"
                    size="sm"
                    variant="glow"
                  >
                    提交完成
                  </Button>
                )}

                {task.status === 'completed' && (
                  <div className="text-center text-sm text-amber-400">
                    等待验证中...
                  </div>
                )}

                {task.status === 'verified' && (
                  <div className="text-center text-sm text-green-400 flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    已完成
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 任务详情弹窗 */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <Card
            className="max-w-md w-full bg-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{selectedTask.title}</h3>
              <p className="text-zinc-400 mb-4">{selectedTask.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-zinc-500">难度</span>
                  <span className="text-white">{difficultyConfig[selectedTask.difficulty].label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">奖励</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {selectedTask.reward}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">状态</span>
                  <span className="text-white">{statusConfig[selectedTask.status].label}</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm font-semibold text-white">任务要求</p>
                {selectedTask.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {req}
                  </div>
                ))}
              </div>

              <Button onClick={() => setSelectedTask(null)} className="w-full">
                关闭
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
