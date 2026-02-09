'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export type Note = {
  id: string
  title: string
  content: string
  tags: string[]
  category: 'inspiration' | 'medici' | 'skill' // Derived from tags
  thinkingModel?: 'social' | 'art' | 'tech' | 'science' | null
  linkedSkillId?: string
  createdAt: string
  updatedAt: string
}

export async function getNotes(agentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    // 如果表不存在，或者其他错误，返回空数组而不是抛出异常，避免前端无限 loading
    if (error) {
      console.error('getNotes error:', error)
      return []
    }

    if (!data) return []

    return data.map((item: any) => {
      const tags = item.tags || []
      let category: Note['category'] = 'inspiration'
      if (tags.includes('medici')) category = 'medici'
      if (tags.includes('skill')) category = 'skill'
      
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        tags: tags,
        category,
        thinkingModel: item.thinking_model,
        linkedSkillId: item.linked_skill_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }
    }) as Note[]
  } catch (err) {
    console.error('getNotes exception:', err)
    return []
  }
}

export async function createNote(agentId: string, data: Partial<Note> & { category?: 'inspiration' | 'medici' | 'skill' }) {
  try {
    // Auto-add category tag
    const tags = data.tags || []
    if (data.category && !tags.includes(data.category)) {
      tags.push(data.category)
    }

    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .insert({
        agent_id: agentId,
        title: data.title,
        content: data.content,
        tags: tags,
        thinking_model: data.thinkingModel,
        linked_skill_id: data.linkedSkillId
      })
      .select()
      .single()

    if (error) {
      console.error('Create note error:', error)
      throw new Error(`Create failed: ${error.message}`)
    }

    revalidatePath('/studio') // Revalidate Studio page
    return note
  } catch (error: any) {
    console.error('Create note exception:', error)
    throw new Error(error.message || 'Create failed')
  }
}

export async function deleteNote(agentId: string, noteId: string) {
  const { error } = await supabaseAdmin
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('agent_id', agentId)

  if (error) throw error

  revalidatePath('/notes')
  return true
}

export async function updateNoteTags(agentId: string, noteId: string, newTags: string[]) {
  // 1. Get current tags
  const { data: note, error: getError } = await supabaseAdmin
    .from('notes')
    .select('tags')
    .eq('id', noteId)
    .eq('agent_id', agentId)
    .single()
  
  if (getError || !note) throw new Error('Note not found')

  // 2. Merge tags
  const uniqueTags = Array.from(new Set([...(note.tags || []), ...newTags]))

  // 3. Update
  const { error } = await supabaseAdmin
    .from('notes')
    .update({ tags: uniqueTags })
    .eq('id', noteId)
    .eq('agent_id', agentId)

  if (error) throw error
  revalidatePath('/studio')
  return true
}
