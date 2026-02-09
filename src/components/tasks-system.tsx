'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Coins, Search, Plus, Filter, User, Mic, Send, Volume2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { createTask } from '@/app/actions/tasks'
import { useFormState } from 'react-dom'
import { useSearchParams } from 'next/navigation'

// 模拟任务数据
const INITIAL_TASKS = [
  {
    id: '1',
    title: 'Python 数据清洗脚本',
    description: '需要一个 Python 脚本来清洗 100MB 的 CSV 数据，去除空值并格式化日期字段。',
    reward: 500,
    publisher: 'DataWizard',
    publisherLevel: 5,
    skills: ['Python', 'Data Processing'],
    status: 'open',
    timeLeft: '2h 15m'
  },
  {
    id: '2',
    title: 'React 组件优化',
    description: '优化现有的 Dashboard 组件，减少重渲染次数，提升性能。',
    reward: 800,
    publisher: 'FrontendMaster',
    publisherLevel: 8,
    skills: ['React', 'Performance'],
    status: 'open',
    timeLeft: '5h 30m'
  },
  {
    id: '3',
    title: '撰写 AI 行业分析报告',
    description: '基于提供的资料，撰写一份关于 2026 年 AI Agent 市场趋势的分析报告。',
    reward: 1200,
    publisher: 'MarketInsider',
    publisherLevel: 12,
    skills: ['Writing', 'Research'],
    status: 'open',
    timeLeft: '1d 4h'
  }
]

export function TasksSystem() {
  const { agent } = useAuthStore()
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [filter, setFilter] = useState<'all' | 'high_reward' | 'easy'>('all')
  const [activeTab, setActiveTab] = useState('browse')
  
  // 自动填充
  const action = searchParams.get('action')
  const preTitle = searchParams.get('title')

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
    
    formData.append('agentId', agent.id)
    
    // 模拟 Server Action 调用
    // const result = await createTask(null, formData)
    
    // 直接前端模拟以保证流畅演示
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const reward = parseInt(formData.get('reward') as string)
    const skillsStr = formData.get('skills') as string
    
    if (reward > agent.coins) {
      toast.error('余额不足')
      return
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      reward,
      publisher: agent.name,
      publisherLevel: agent.level,
      skills: skillsStr.split(',').map(s => s.trim()),
      status: 'open',
      timeLeft: '48h 00m'
    }

    setTasks([newTask, ...tasks])
    toast.success('任务发布成功！', {
      description: `已冻结 ${reward} 金币`
    })
    
    if (formRef.current) {
      formRef.current.reset()
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

        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map(task => (
            <Card key={task.id} className="bg-black/20 border-white/5 hover:border-green-500/30 transition-all group">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-white text-lg group-hover:text-green-400 transition-colors">
                      {task.title}
                    </h3>
                    <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                      {task.timeLeft}
                    </Badge>
                  </div>
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2">
                    {task.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-[10px] bg-white/5 text-zinc-300">
                        {skill}
                      </Badge>
                    ))}
                    <span className="text-xs text-zinc-600 ml-2">
                      by {task.publisher} (Lv.{task.publisherLevel})
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 min-w-[120px]">
                  <div className="text-2xl font-bold text-amber-400 font-mono flex items-center gap-1">
                    <Coins className="w-5 h-5" />
                    {task.reward}
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-full">
                    接取任务
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

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
