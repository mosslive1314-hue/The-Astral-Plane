'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Coins, Search, Plus, Filter, User, Mic, Send, Volume2, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { createTask, getTasks, acceptTask } from '@/app/actions/tasks'
import { useSearchParams } from 'next/navigation'

export function TasksSystem() {
  const { agent } = useAuthStore()
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high_reward' | 'easy'>('all')
  const [activeTab, setActiveTab] = useState('browse')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)
  
  const newTask = searchParams.get('newTask') === 'true'
  const action = searchParams.get('action')
  const preTitle = searchParams.get('title')

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await getTasks()
      setTasks(data || [])
      
      if (newTask && agent) {
        const myLatestTask = data?.find((task: any) => task.publisher_id === agent.id)
        if (myLatestTask) {
          setHighlightedTaskId(myLatestTask.id)
          setTimeout(() => {
            setHighlightedTaskId(null)
          }, 5000)
        }
      }
    } catch (error) {
      console.error('Failed to load tasks', error)
      toast.error('加载任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [newTask])

  useEffect(() => {
    if (action === 'post') {
      setActiveTab('post')
    }
  }, [action])
  
  const formRef = useRef<HTMLFormElement>(null)
  
  const handleCreateTask = async (formData: FormData) => {
    if (!agent) {
      toast.error('请先登录')
      return
    }
    
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const reward = parseInt(formData.get('reward') as string)
    const skillsStr = formData.get('skills') as string
    
    if (reward > agent.coins) {
      toast.error('余额不足')
      return
    }

    try {
      await createTask({
        title,
        description,
        reward,
        required_skills: skillsStr.split(',').map(s => s.trim()),
        publisher_id: agent.id
      })

      toast.success('任务发布成功！', {
        description: `已冻结 ${reward} 金币`
      })
      
      if (formRef.current) {
        formRef.current.reset()
      }
      setActiveTab('browse')
      loadTasks()
    } catch (error) {
      console.error(error)
      toast.error('发布失败，请重试')
    }
  }

  const handleAcceptTask = async (taskId: string) => {
    if (!agent) {
      toast.error('请先登录后接取任务')
      return
    }
    
    try {
      await acceptTask(taskId, agent.id)
      toast.success('接单成功！请按时交付')
      setSelectedTask(null)
      loadTasks()
    } catch (error) {
      toast.error('接单失败')
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (highlightedTaskId) {
      if (a.id === highlightedTaskId) return -1
      if (b.id === highlightedTaskId) return 1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const filteredTasks = sortedTasks.filter(task => {
    if (filter === 'high_reward') return task.reward >= 1000
    if (filter === 'easy') return task.reward < 500
    return true
  })

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex items-center justify-between">
        <TabsList className="bg-black/20 border border-white/10">
          <TabsTrigger value="browse" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-6">
            <Search className="w-4 h-4 mr-2" />
            任务大厅
          </TabsTrigger>
          <TabsTrigger value="post" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6">
            <Plus className="w-4 h-4 mr-2" />
            发布悬赏
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <User className="w-4 h-4" />
          <span>我的余额: </span>
          <span className="text-amber-400 font-mono font-bold">{agent?.coins.toLocaleString() || 0}</span>
        </div>
      </div>

      <TabsContent value="browse" className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-zinc-500" />
          <Badge 
            variant={filter === 'all' ? 'default' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilter('all')}
          >
            全部
          </Badge>
          <Badge 
            variant={filter === 'high_reward' ? 'default' : 'outline'} 
            className="cursor-pointer bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
            onClick={() => setFilter('high_reward')}
          >
            高额悬赏
          </Badge>
          <Badge 
            variant={filter === 'easy' ? 'default' : 'outline'} 
            className="cursor-pointer bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
            onClick={() => setFilter('easy')}
          >
            新手友好
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">加载任务中...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map(task => (
              <Card 
                key={task.id} 
                className={`bg-black/20 border transition-all group cursor-pointer ${
                  highlightedTaskId === task.id 
                    ? 'border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-pulse' 
                    : 'border-white/5 hover:border-green-500/30'
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {highlightedTaskId === task.id && (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                      <h3 className={`font-bold group-hover:text-green-400 transition-colors ${
                        highlightedTaskId === task.id ? 'text-amber-400' : 'text-white text-lg'
                      }`}>
                        {task.title}
                      </h3>
                      {highlightedTaskId === task.id && (
                        <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                          新发布
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs border-zinc-700 ${task.status === 'open' ? 'text-green-400' : 'text-zinc-500'}`}>
                        {task.status === 'open' ? '招募中' : '进行中'}
                      </Badge>
                    </div>
                    <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {(Array.isArray(task.required_skills) ? task.required_skills : []).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-[10px] bg-white/5 text-zinc-300">
                          {skill}
                        </Badge>
                      ))}
                      <span className="text-xs text-zinc-600 ml-2">
                        by {task.publisher?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 min-w-[120px]">
                    <div className={`text-2xl font-bold font-mono flex items-center gap-1 ${
                      highlightedTaskId === task.id ? 'text-amber-400' : 'text-amber-400'
                    }`}>
                      <Coins className="w-5 h-5" />
                      {task.reward}
                    </div>
                    {task.status === 'open' && task.publisher_id !== agent?.id && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAcceptTask(task.id)
                        }}
                      >
                        接取任务
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-10 text-zinc-500">暂无任务</div>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="post" className="space-y-6">
        <Card className="bg-black/20 border-white/10">
          <CardContent className="p-6">
            <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleCreateTask(new FormData(e.currentTarget)) }} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">任务标题</label>
                <Input 
                  name="title" 
                  placeholder="简短描述任务内容"
                  defaultValue={preTitle || ''}
                  className="bg-white/5 border-white/10 text-white placeholder-zinc-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">任务描述</label>
                <textarea
                  name="description"
                  placeholder="详细描述任务要求、交付标准等..."
                  className="w-full min-h-[150px] px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">悬赏金额 (金币)</label>
                  <Input 
                    name="reward" 
                    type="number"
                    placeholder="建议 100-5000"
                    min="10"
                    className="bg-white/5 border-white/10 text-white placeholder-zinc-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">所需技能 (用逗号分隔)</label>
                  <Input 
                    name="skills" 
                    placeholder="例如: React, Python, 设计"
                    className="bg-white/5 border-white/10 text-white placeholder-zinc-500"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!agent}
              >
                {!agent ? '请先登录' : '发布任务'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span>{selectedTask?.title}</span>
              <Badge variant="outline" className={`text-xs border-zinc-700 ${selectedTask?.status === 'open' ? 'text-green-400' : 'text-zinc-500'}`}>
                {selectedTask?.status === 'open' ? '招募中' : '进行中'}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
               由 {selectedTask?.publisher?.name || 'Unknown'} 发布
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6 pt-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="text-sm font-semibold text-zinc-300 mb-2">任务描述</h4>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="text-xs text-zinc-500 mb-1">悬赏金额</div>
                  <div className="text-xl font-mono font-bold text-amber-400">{selectedTask.reward} 金币</div>
                </div>
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="text-xs text-zinc-500 mb-1">所需技能</div>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(selectedTask.required_skills) ? selectedTask.required_skills : []).map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-[10px] bg-white/5 text-zinc-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                {selectedTask.status === 'open' && selectedTask.publisher_id !== agent?.id && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700 w-full"
                    onClick={() => handleAcceptTask(selectedTask.id)}
                  >
                    接取此任务
                  </Button>
                )}
                {selectedTask.publisher_id === agent?.id && (
                  <Button variant="outline" disabled className="w-full">
                    这是您发布的任务
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
