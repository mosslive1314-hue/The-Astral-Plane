'use client'

import { useState, useEffect } from 'react'
import { DigitalTwinPanel } from '@/components/digital-twin-panel'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { getNotes, createNote, deleteNote, updateNoteTags, type Note } from '@/app/actions/notes'
import { generateInsight, generateProjectTasks } from '@/app/actions/ai-rewrite'
import { createProjectTasks } from '@/app/actions/tasks'
import { publishSkillToMarket } from '@/app/actions/market'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Notebook, Plus, Trash2, Tag, Brain, 
  MessageCircle, Palette, Code, FlaskConical, Sparkles, Wand2, Lightbulb, UserCircle, Rocket, Store
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

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'skill', label: '技能' },
  { id: 'medici', label: '灵感' },
  { id: 'solution', label: '方案' },
]

export function NotesPanel() {
  const { agent } = useAuthStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  
  // 新笔记表单状态
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [customModel, setCustomModel] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [insight, setInsight] = useState<InsightData | null>(null)

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
      setNotes(data || []) 
    } catch (error) {
      console.error('Failed to load notes', error)
      toast.error('加载笔记失败')
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInsight = async () => {
    if (!newContent.trim() || !selectedModel) return
    
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
        insight ? JSON.stringify(insight) : undefined 
      )
      
      toast.promise(promise, {
        loading: 'AI 正在进行跨域结构映射...',
        success: (data) => {
          setInsight(data)
          return '洞察生成完毕！'
        },
        error: '生成失败，请稍后重试'
      })
      
      const data = await promise
      setInsight(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreate = async () => {
    if (!agent?.id) {
      toast.error('Agent 信息缺失')
      return
    }
    if (!newTitle.trim()) return
    
    try {
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
      
      await promise
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

  const filteredNotes = notes.filter(note => {
    if (activeCategory === 'all') return true
    // 简单的根据 category 字段或 tags 进行过滤
    // 假设后端返回的 note 有 category 字段，或者我们在 tags 里存了
    if (note.category === activeCategory) return true
    if (note.tags?.includes(activeCategory)) return true
    return false
  })

  const handleImplement = async (note: Note) => {
    if (!agent?.id) return
    
    const toastId = toast.loading('正在拆解项目任务...')
    try {
      // 1. Generate tasks using AI
      const tasks = await generateProjectTasks(note.content)
      
      if (tasks.length === 0) {
        toast.error('AI 未能生成有效任务，请重试', { id: toastId })
        return
      }

      // 2. Save tasks to DB
      await createProjectTasks(agent.id, tasks)
      
      // 3. Update note tags
      if (!note.tags?.includes('implemented')) {
        await updateNoteTags(agent.id, note.id, ['project', 'implemented'])
        // Refresh local state if needed, or just reload notes
        loadNotes()
      }
      
      toast.success(`项目已启动！生成了 ${tasks.length} 个子任务并发布到大厅`, { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('实施失败', { id: toastId })
    }
  }

  const handlePublish = async (note: Note) => {
    if (!agent?.id) return

    try {
      const result = await publishSkillToMarket(agent.id, {
        name: note.title.replace('灵光一现: ', ''),
        description: 'From Mind Assets Library',
        content: note.content,
        price: 500
      })

      if (result.success) {
        if (!note.tags?.includes('published')) {
          await updateNoteTags(agent.id, note.id, ['published', 'solution'])
          loadNotes()
        }
        toast.success('方案已发布到市场！')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error(error)
      toast.error('发布失败')
    }
  }

  return (
    <div className="w-full">
      {/* Header & Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
             <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                <Notebook className="w-4 h-4 text-white" />
              </div>
            心智资产库
          </h2>
          <p className="text-zinc-400 text-sm">思维模型与洞察沉淀。</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} variant="glow" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? '取消' : '新建'}
        </Button>
      </div>

      {/* Categories Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
              ${activeCategory === cat.id 
                ? 'bg-white text-black shadow-lg shadow-white/10' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="mb-8 border-purple-500/30 bg-black/20 backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-amber-400" />
              创建新思维
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-colors"
                placeholder="给你的想法起个名字..."
              />
            </div>
            
            <div>
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
                      className={`cursor-pointer p-2 rounded-lg border transition-all flex flex-col items-center gap-1 text-center ${
                        isSelected 
                          ? `${model.bg} ${model.border} ring-1 ring-white/50` 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${model.color}`} />
                      <span className={`text-[10px] ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
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
                  className={`cursor-pointer p-2 rounded-lg border transition-all flex flex-col items-center gap-1 text-center ${
                    selectedModel === 'custom'
                      ? 'bg-amber-500/10 border-amber-500/20 ring-1 ring-white/50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <UserCircle className={`w-5 h-5 ${selectedModel === 'custom' ? 'text-amber-400' : 'text-zinc-400'}`} />
                  <span className={`text-[10px] ${selectedModel === 'custom' ? 'text-white' : 'text-zinc-400'}`}>
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
                    placeholder="输入思维对象 (e.g., Elon Musk)..."
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-zinc-400 block">内容</label>
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
                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-colors resize-none text-sm"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">加载思维片段...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
          <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4 text-sm">还没有任何笔记</p>
          <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
            开始记录第一条
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map(note => {
            const model = note.thinkingModel ? THINKING_MODELS[note.thinkingModel] : null
            const ModelIcon = model?.icon
            
            return (
              <Card 
                key={note.id} 
                onClick={() => setSelectedNote(note)}
                className={`group transition-all hover:border-purple-500/30 cursor-pointer ${model ? model.border : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {ModelIcon && (
                        <div className={`p-1.5 rounded-md ${model.bg}`}>
                          <ModelIcon className={`w-3 h-3 ${model.color}`} />
                        </div>
                      )}
                      <h3 className="font-semibold text-white text-base line-clamp-1">{note.title}</h3>
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
                      {note.tags?.slice(0, 3).map(tag => (
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

      {/* Note Detail Modal */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedNote?.thinkingModel && THINKING_MODELS[selectedNote.thinkingModel] && (
                <div className={`p-1.5 rounded-md ${THINKING_MODELS[selectedNote.thinkingModel].bg}`}>
                  {(() => {
                    const Icon = THINKING_MODELS[selectedNote.thinkingModel].icon
                    return <Icon className={`w-5 h-5 ${THINKING_MODELS[selectedNote.thinkingModel].color}`} />
                  })()}
                </div>
              )}
              {selectedNote?.title}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 flex gap-2 pt-2">
              {selectedNote?.tags?.map(tag => (
                <span key={tag} className="bg-white/5 px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
              <span className="ml-auto">{selectedNote?.createdAt && new Date(selectedNote.createdAt).toLocaleDateString()}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
            {selectedNote?.content}
          </div>

          {/* Action Buttons */}
          {selectedNote && (selectedNote.category === 'medici' || selectedNote.tags?.includes('medici')) && (
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/10">
              <Button 
                onClick={() => handleImplement(selectedNote)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0"
              >
                <Rocket className="w-4 h-4 mr-2" />
                实施项目
              </Button>
              <Button 
                onClick={() => handlePublish(selectedNote)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0"
              >
                <Store className="w-4 h-4 mr-2" />
                发布方案
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
