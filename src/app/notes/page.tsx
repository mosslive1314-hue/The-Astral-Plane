'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { DigitalTwinPanel } from '@/components/digital-twin-panel'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { getNotes, createNote, deleteNote, type Note } from '@/app/actions/notes'
import { generateInsight } from '@/app/actions/ai-rewrite'
import { getUserInfo } from '@/lib/oauth'
import { syncUser } from '@/app/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Notebook, Plus, Trash2, Tag, Brain, 
  MessageCircle, Palette, Code, FlaskConical, Sparkles, Wand2, Lightbulb, UserCircle
} from 'lucide-react'

// 思维模型定义 (参考 CausalLink)
const THINKING_MODELS = {
  social: { label: '社交思维 (Alice)', icon: MessageCircle, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  art: { label: '艺术思维 (Bob)', icon: Palette, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  tech: { label: '技术思维 (Charlie)', icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  science: { label: '科学思维 (Diana)', icon: FlaskConical, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
}

type InsightData = {
  perspective: string
  insight: string
  actionable_suggestion: string
}

export default function NotesPage() {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated, agent, tokens, setAgent, setUser } = useAuthStore()
  const [notes, setNotes] = useState<Note[]>([])
  // 默认不加载，只有当有 agentId 时才开始加载
  const [loading, setLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // 自动恢复 Agent 会话
  useEffect(() => {
    const restoreSession = async () => {
      if (isAuthenticated && !agent?.id && tokens?.access_token) {
        try {
          console.log('Restoring agent session...')
          const userInfo = await getUserInfo(tokens.access_token)
          setUser(userInfo)
          
          const { agent: newAgent } = await syncUser(userInfo.id, {
            nickname: userInfo.nickname,
            avatar: userInfo.avatar
          })
          
          setAgent({
            id: newAgent.id,
            userId: newAgent.user_id,
            name: newAgent.name,
            level: newAgent.level,
            coins: newAgent.coins,
            creditScore: newAgent.credit_score,
            avatar: newAgent.avatar || undefined,
            skills: [], 
            achievements: []
          })
          
          toast.success('Agent 会话已自动恢复')
        } catch (error) {
          console.error('Session restore failed:', error)
          // 不强制跳转登录，以免打断用户，只是提示
          toast.error('无法自动恢复会话，请尝试重新登录')
        }
      }
    }
    
    restoreSession()
  }, [isAuthenticated, agent?.id, tokens?.access_token])
  
  // 新笔记表单状态
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [customModel, setCustomModel] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [insight, setInsight] = useState<InsightData | null>(null)

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [_hasHydrated, isAuthenticated])

  useEffect(() => {
    if (agent?.id) {
      loadNotes()
    }
  }, [agent?.id])

  const loadNotes = async () => {
    if (!agent?.id) return
    try {
      setLoading(true)
      const data = await getNotes(agent.id)
      // 如果返回空数组，可能是真的没有，也可能是出错了（我们在 action 里 catch 了）
      // 但无论如何，我们都认为加载完成了
      setNotes(data || []) 
    } catch (error) {
      console.error('Failed to load notes', error)
      toast.error('加载笔记失败')
      setNotes([]) // 出错时也设为空数组，避免一直 loading
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInsight = async () => {
    if (!newContent.trim() || !selectedModel) return
    
    // 如果是自定义模型，但没输入内容
    if (selectedModel === 'custom' && !customModel.trim()) {
      toast.error('请输入自定义思维模型名称')
      return
    }

    try {
      setIsGenerating(true)
      const modelName = selectedModel === 'custom' ? customModel : THINKING_MODELS[selectedModel as keyof typeof THINKING_MODELS].label
      
      const promise = generateInsight(
        newContent, 
        modelName, 
        selectedModel === 'custom' ? customModel : undefined,
        insight ? JSON.stringify(insight) : undefined // 如果已有 insight，传给后端作为"上一轮"参考
      )
      
      toast.promise(promise, {
        loading: 'AI 正在进行跨域结构映射...',
        success: (data) => {
          setInsight(data)
          return '洞察生成完毕！'
        },
        error: '生成失败，请稍后重试'
      })
      
      await promise
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreate = async () => {
    if (!agent?.id) {
      toast.error('Agent 信息缺失，请返回首页重新加载')
      return
    }
    if (!newTitle.trim()) return
    
    try {
      // 组合内容：原始内容 + 洞察卡片
      let finalContent = newContent
      if (insight) {
        finalContent += `\n\n---\n**🧠 ${selectedModel === 'custom' ? customModel : THINKING_MODELS[selectedModel as keyof typeof THINKING_MODELS].label} 洞察**\n\n`
        finalContent += `> ${insight.perspective}\n\n`
        finalContent += `**💡 核心洞察**: ${insight.insight}\n`
        finalContent += `**🚀 行动建议**: ${insight.actionable_suggestion}`
      }

      const promise = createNote(agent.id, {
        title: newTitle,
        content: finalContent,
        thinkingModel: selectedModel === 'custom' ? null : selectedModel as any,
        tags: selectedModel === 'custom' ? [customModel] : [selectedModel!]
      })

      toast.promise(promise, {
        loading: '正在保存笔记...',
        success: () => {
          setIsCreating(false)
          setNewTitle('')
          setNewContent('')
          setSelectedModel(null)
          setCustomModel('')
          setInsight(null)
          loadNotes()
          return '笔记保存成功！'
        },
        error: (err) => `创建失败: ${err.message}`
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!agent?.id) return
    if (!confirm('确定要删除这条笔记吗？')) return

    try {
      await deleteNote(agent.id, id)
      toast.success('笔记已删除')
      loadNotes()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                <Notebook className="w-6 h-6 text-white" />
              </div>
              思维笔记
            </h1>
            <p className="text-zinc-400">记录你的灵感、任务规划与思维模型碰撞</p>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)} variant="glow">
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? '取消创建' : '新建笔记'}
          </Button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <Card className="mb-8 border-purple-500/30 bg-black/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                创建新思维
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">标题</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-colors"
                  placeholder="给你的想法起个名字..."
                />
              </div>
              
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">选择思维模型 (或自定义)</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(THINKING_MODELS).map(([key, model]) => {
                    const Icon = model.icon
                    const isSelected = selectedModel === key
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setSelectedModel(isSelected ? null : key)
                          setInsight(null)
                        }}
                        className={`cursor-pointer p-3 rounded-lg border transition-all flex flex-col items-center gap-2 text-center ${
                          isSelected 
                            ? `${model.bg} ${model.border} ring-1 ring-white/50` 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${model.color}`} />
                        <span className={`text-xs ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                          {model.label.split(' ')[0]}
                        </span>
                      </div>
                    )
                  })}
                  
                  {/* 自定义思维按钮 */}
                  <div
                    onClick={() => {
                      setSelectedModel(selectedModel === 'custom' ? null : 'custom')
                      setInsight(null)
                    }}
                    className={`cursor-pointer p-3 rounded-lg border transition-all flex flex-col items-center gap-2 text-center ${
                      selectedModel === 'custom'
                        ? 'bg-amber-500/10 border-amber-500/20 ring-1 ring-white/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <UserCircle className={`w-6 h-6 ${selectedModel === 'custom' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className={`text-xs ${selectedModel === 'custom' ? 'text-white' : 'text-zinc-400'}`}>
                      自定义
                    </span>
                  </div>
                </div>

                {/* 自定义输入框 */}
                {selectedModel === 'custom' && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                    <input
                      type="text"
                      value={customModel}
                      onChange={e => setCustomModel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none placeholder:text-zinc-600"
                      placeholder="输入你想模拟的思维对象，例如：埃隆·马斯克、孙子兵法、生物进化论..."
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-zinc-400 block">内容</label>
                  {newContent.trim() && selectedModel && !insight && (
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={handleGenerateInsight}
                      disabled={isGenerating}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-6 px-2 text-xs"
                    >
                      <Lightbulb className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-pulse' : ''}`} />
                      {isGenerating ? '正在洞察...' : '生成洞察卡片'}
                    </Button>
                  )}
                </div>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-colors resize-none"
                  placeholder="写下你的想法..."
                />

                {/* Insight Card 展示区 */}
                {isGenerating && (
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/10"></div>
                      <div className="space-y-3 flex-1">
                        <div className="h-4 w-1/3 bg-white/10 rounded"></div>
                        <div className="h-3 w-3/4 bg-white/10 rounded"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div className="h-20 bg-white/10 rounded-lg"></div>
                          <div className="h-20 bg-white/10 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {insight && !isGenerating && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20 mt-1">
                        <Sparkles className="w-5 h-5 text-purple-300" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div>
                          <h4 className="text-sm font-semibold text-purple-200 mb-1">视角转换</h4>
                          <p className="text-sm text-zinc-300 italic">"{insight.perspective}"</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                            <h5 className="text-xs font-medium text-blue-300 mb-1 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" /> 核心洞察
                            </h5>
                            <p className="text-xs text-zinc-400">{insight.insight}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                            <h5 className="text-xs font-medium text-emerald-300 mb-1 flex items-center gap-1">
                              <Wand2 className="w-3 h-3" /> 行动建议
                            </h5>
                            <p className="text-xs text-zinc-400">{insight.actionable_suggestion}</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleGenerateInsight}
                            className="text-xs text-zinc-500 hover:text-white h-6"
                          >
                            不满意？重新生成
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleCreate} disabled={!newTitle.trim()}>
                  保存笔记
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
            <p className="text-zinc-400">加载思维片段...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <Brain className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-4">还没有任何笔记</p>
            <Button variant="outline" onClick={() => setIsCreating(true)}>
              开始记录第一条
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes.map(note => {
              const model = note.thinkingModel ? THINKING_MODELS[note.thinkingModel] : null
              const ModelIcon = model?.icon
              
              return (
                <Card 
                  key={note.id} 
                  className={`group transition-all hover:border-purple-500/30 cursor-pointer ${model ? model.border : ''}`}
                  onClick={() => router.push(`/notes/${note.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {ModelIcon && (
                          <div className={`p-1.5 rounded-md ${model.bg}`}>
                            <ModelIcon className={`w-4 h-4 ${model.color}`} />
                          </div>
                        )}
                        <h3 className="font-semibold text-white text-lg">{note.title}</h3>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(note.id)
                        }}
                        className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-zinc-400 text-sm mb-4 line-clamp-3 whitespace-pre-wrap">
                      {note.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto pt-4 border-t border-white/5">
                      <div className="flex gap-2">
                        {note.tags?.map(tag => (
                          <span key={tag} className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
