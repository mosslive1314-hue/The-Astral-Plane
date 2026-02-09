'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export type Note = {
  id: string
  title: string
  content: string
  tags: string[]
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

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      tags: item.tags,
      thinkingModel: item.thinking_model,
      linkedSkillId: item.linked_skill_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    })) as Note[]
  } catch (err) {
    console.error('getNotes exception:', err)
    return []
  }
}

export async function createNote(agentId: string, data: Partial<Note>) {
  try {
    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .insert({
        agent_id: agentId,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        thinking_model: data.thinkingModel,
        linked_skill_id: data.linkedSkillId
      })
      .select()
      .single()

    if (error) {
      console.error('Create note error:', error)
      throw new Error(`Create failed: ${error.message}`)
    }

    revalidatePath('/notes')
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
