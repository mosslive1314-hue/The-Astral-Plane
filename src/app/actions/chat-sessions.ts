'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export interface ChatSession {
  id: string
  agent_id: string
  title: string
  agent_name: string
  messages: any[]
  created_at: string
  updated_at: string
}

export async function createChatSession(
  agentId: string,
  data: { title: string; agentName: string; messages: any[] }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        agent_id: agentId,
        title: data.title,
        agent_name: data.agentName,
        messages: data.messages,
      })
      .select()
      .single()

    if (error) {
      console.error('Create chat session error:', error)
      throw new Error(`Create failed: ${error.message}`)
    }

    revalidatePath('/chat')
    return data
  } catch (error: any) {
    console.error('Create chat session exception:', error)
    throw new Error(error.message || 'Create failed')
  }
}

export async function getChatSessions(agentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('agent_id', agentId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Get chat sessions error:', error)
      return []
    }

    if (!data) return []

    return data
  } catch (err) {
    console.error('Get chat sessions exception:', err)
    return []
  }
}

export async function getChatSession(sessionId: string, agentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('agent_id', agentId)
      .single()

    if (error) {
      console.error('Get chat session error:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Get chat session exception:', err)
    return null
  }
}

export async function updateChatSession(
  sessionId: string,
  agentId: string,
  data: { messages: any[] }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update({
        messages: data.messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('agent_id', agentId)
      .select()
      .single()

    if (error) {
      console.error('Update chat session error:', error)
      throw new Error(`Update failed: ${error.message}`)
    }

    revalidatePath('/chat')
    return data
  } catch (error: any) {
    console.error('Update chat session exception:', error)
    throw new Error(error.message || 'Update failed')
  }
}

export async function deleteChatSession(sessionId: string, agentId: string) {
  const { error } = await supabaseAdmin
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('agent_id', agentId)

  if (error) throw error

  revalidatePath('/chat')
  return true
}
