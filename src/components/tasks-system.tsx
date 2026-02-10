'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Coins, Search, Plus, Filter, User, Mic, Send, Volume2 } from 'lucide-react'
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
  
  // 自动填充
  const action = searchParams.get('action')
  const preTitle = searchParams.get('title')

  // 加载任务列表
  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await getTasks()
      setTasks(data || [])
    } catch (error) {
      console.error('Failed to load tasks', error)
      toast.error('加载任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  // 如果 URL 有 action=post，自动切换到发布 tab
  useEffect(() => {
    if (action === 'post') {
      setActiveTab('post')
    }
  }, [action])
  
  // 发布任务表单状态
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
      setSelectedTask(null) // Close dialog if open
      loadTasks()
    } catch (error) {
      toast.error('接单失败')
    }
  }

  const filteredTasks = tasks.filter(task => {
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

      {/* 浏览任务 */}
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
                className="bg-black/20 border-white/5 hover:border-green-500/30 transition-all group cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-white text-lg group-hover:text-green-400 transition-colors">
                        {task.title}
                      </h3>
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
                    <div className="text-2xl font-bold text-amber-400 font-mono flex items-center gap-1">
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
                  <div className="text-xl font-mono font-bold text-amber-400 flex items-center gap-1">
                    <Coins className="w-5 h-5" />
                    {selectedTask.reward}
                  </div>
                </div>
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="text-xs text-zinc-500 mb-1">任务 ID</div>
                  <div className="text-sm font-mono text-zinc-400 truncate">{selectedTask.id}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-zinc-300 mb-2">所需技能</h4>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedTask.required_skills) ? selectedTask.required_skills : []).map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="bg-white/10 text-zinc-300">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button className="flex-1 bg-white/10 hover:bg-white/20" onClick={() => setSelectedTask(null)}>
                  关闭
                </Button>
                {selectedTask.status === 'open' && selectedTask.publisher_id !== agent?.id && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleAcceptTask(selectedTask.id)}
                  >
                    立即接取任务
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 发布任务 */}
      <TabsContent value="post">
        <Card className="bg-black/20 border-white/5 max-w-2xl mx-auto">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              发布新悬赏
            </h2>
            
            <form 
              ref={formRef}
              action={handleCreateTask}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">任务标题</label>
                <Input 
                  name="title" 
                  defaultValue={preTitle || ''}
                  placeholder="例如: 编写一个 Python 爬虫脚本" 
                  className="bg-black/40 border-white/10 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">任务描述</label>
                <textarea 
                  name="description"
                  className="w-full h-32 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="详细描述任务要求、交付标准等..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">悬赏金额 (Coins)</label>
                  <Input 
                    name="reward" 
                    type="number" 
                    placeholder="500" 
                    min="10"
                    className="bg-black/40 border-white/10 text-white"
                    required
                  />
                  <p className="text-xs text-zinc-600">
                    将从您的余额中冻结，任务完成后支付
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">所需技能 (逗号分隔)</label>
                  <Input 
                    name="skills" 
                    placeholder="Python, AI, Writing" 
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg">
                  发布任务
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
