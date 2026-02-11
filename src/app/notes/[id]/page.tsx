'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { ArrowLeft, Tag, Calendar, Trash2, Edit3, Sparkles, FileText, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  thinkingModel?: string | null
}

function NoteDetailContent() {
  const router = useRouter()
  const params = useParams()
  const { agent, isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [_hasHydrated, isAuthenticated])
  
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return
    loadNote(params.id as string)
  }, [params.id, agent?.id])

  const loadNote = async (id: string) => {
    if (!agent?.id) {
      console.log('Agent not ready, waiting...')
      return
    }

    try {
      console.log('Loading note:', id, 'for agent:', agent.id)
      const response = await fetch(`/api/notes/${id}?agentId=${agent.id}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Note data:', data)
        setNote(data)
      } else {
        throw new Error('加载失败')
      }
    } catch (error) {
      console.error('Failed to load note:', error)
      toast.error('笔记加载失败')
      router.push('/notes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!note || !agent?.id) return
    if (!confirm('确定要删除这条笔记吗？')) return

    try {
      const response = await fetch(`/api/notes/${note.id}?agentId=${agent.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('笔记已删除')
        router.push('/notes')
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast.error('删除失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-zinc-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">笔记不存在</p>
          <Button onClick={() => router.push('/notes')}>
            返回笔记列表
          </Button>
        </div>
      </div>
    )
  }

  const isExpertNote = note.tags?.includes('expert')
  const isSchemeNote = note.tags?.includes('方案')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/notes')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>

        <Card className={`bg-black/40 backdrop-blur-xl border ${isExpertNote ? 'border-emerald-500/30' : 'border-white/10'}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isSchemeNote && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI 提炼方案
                    </Badge>
                  )}
                  {isExpertNote && !isSchemeNote && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      <UserCheck className="w-3 h-3 mr-1" />
                      专家对话
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-white text-2xl">{note.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-1 text-zinc-400 text-sm">
                <Calendar className="w-4 h-4" />
                {new Date(note.createdAt).toLocaleString('zh-CN')}
              </div>
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  {note.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-zinc-400 border-zinc-500/30">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function NoteDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />}>
      <NoteDetailContent />
    </Suspense>
  )
}
