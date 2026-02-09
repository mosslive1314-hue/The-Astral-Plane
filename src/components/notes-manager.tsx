'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { getNotes, createNote, updateNote, deleteNote } from '@/lib/notes-api'
import type { Note } from '@/lib/notes-api'
import { Plus, Edit, Trash2, Search, Tag, X, FileText } from 'lucide-react'

export function NotesManager() {
  const { tokens } = useAuthStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 编辑状态
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const data = await getNotes(tokens || { access_token: '', refresh_token: '', expires_in: 0, token_type: '' })
      setNotes(data)
    } catch (error) {
      console.error('Failed to load notes:', error)
    }
  }

  const handleCreateNote = async () => {
    setIsLoading(true)
    try {
      const newNote = await createNote(tokens || { access_token: '', refresh_token: '', expires_in: 0, token_type: '' }, {
        title: '新建笔记',
        content: '',
        tags: [],
      })
      setNotes([newNote, ...notes])
      setSelectedNote(newNote)
      setIsEditing(true)
      setEditTitle(newNote.title)
      setEditContent(newNote.content)
      setEditTags(newNote.tags || [])
    } catch (error) {
      console.error('Failed to create note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedNote) return

    setIsLoading(true)
    try {
      const updated = await updateNote(
        tokens || { access_token: '', refresh_token: '', expires_in: 0, token_type: '' },
        selectedNote.id,
        {
          title: editTitle,
          content: editContent,
          tags: editTags,
        }
      )
      setNotes(notes.map(n => (n.id === updated.id ? updated : n)))
      setSelectedNote(updated)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!selectedNote) return

    if (!confirm('确定要删除这条笔记吗？')) return

    setIsLoading(true)
    try {
      await deleteNote(tokens || { access_token: '', refresh_token: '', expires_in: 0, token_type: '' }, selectedNote.id)
      setNotes(notes.filter(n => n.id !== selectedNote.id))
      setSelectedNote(null)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to delete note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddTag = () => {
    const tag = prompt('输入标签名称:')
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag])
    }
  }

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 笔记列表 */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>我的笔记</span>
            <Button onClick={handleCreateNote} size="sm" disabled={isLoading}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note)
                  setIsEditing(false)
                  setEditTitle(note.title)
                  setEditContent(note.content)
                  setEditTags(note.tags || [])
                }}
                className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                  selectedNote?.id === note.id
                    ? 'bg-purple-500/10'
                    : 'hover:bg-white/5'
                }`}
              >
                <h3 className="font-semibold text-white truncate">{note.title}</h3>
                <p className="text-sm text-zinc-400 truncate mt-1">{note.content || '无内容'}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {note.tags?.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                {searchQuery ? '没有找到匹配的笔记' : '还没有笔记，创建一条吧！'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 笔记详情 */}
      <Card className="lg:col-span-2">
        {selectedNote ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xl font-bold bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                    />
                  ) : (
                    <CardTitle>{selectedNote.title}</CardTitle>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSaveNote} size="sm" disabled={isLoading}>
                        保存
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false)
                          setEditTitle(selectedNote.title)
                          setEditContent(selectedNote.content)
                          setEditTags(selectedNote.tags || [])
                        }}
                        size="sm"
                        variant="outline"
                      >
                        取消
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button onClick={handleDeleteNote} size="sm" variant="danger">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="开始输入..."
                    rows={12}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">标签</span>
                      <Button onClick={handleAddTag} size="sm" variant="ghost">
                        <Tag className="w-4 h-4 mr-1" />
                        添加标签
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editTags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <p className="text-zinc-300 whitespace-pre-wrap">{selectedNote.content || '暂无内容'}</p>
                  {selectedNote.tags && selectedNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedNote.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-[500px]">
            <div className="text-center text-zinc-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>选择一条笔记或创建新笔记</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
