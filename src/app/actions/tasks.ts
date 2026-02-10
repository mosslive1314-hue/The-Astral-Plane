'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function getTasks() {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('*, publisher:publisher_id(name, avatar)')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Fetch tasks error:', error)
    return []
  }
  return data
}

export async function createTask(taskData: any) {
  const { error } = await supabaseAdmin
    .from('tasks')
    .insert({
      title: taskData.title,
      description: taskData.description,
      reward: taskData.reward,
      required_skills: taskData.required_skills,
      publisher_id: taskData.publisher_id,
      status: 'open'
    })

  if (error) {
    console.error('Create task error:', error)
    throw error
  }
  
  revalidatePath('/tasks')
  return true
}

export async function createProjectTasks(agentId: string, tasks: any[]) {
  if (!tasks || tasks.length === 0) {
    console.warn('createProjectTasks: No tasks to create')
    return
  }

  // Ensure strict type compliance
  const tasksToInsert = tasks.map(t => ({
    title: t.title || 'Untitled Task',
    description: t.description || 'No description provided',
    reward: typeof t.reward === 'number' ? t.reward : 100,
    required_skills: Array.isArray(t.required_skills) ? t.required_skills : [],
    publisher_id: agentId,
    status: 'open'
  }))

  console.log('[DEBUG] Inserting Tasks:', JSON.stringify(tasksToInsert, null, 2))

  const { error } = await supabaseAdmin
    .from('tasks')
    .insert(tasksToInsert)

  if (error) {
    console.error('Batch create tasks error:', error)
    // Don't throw immediately, log details
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Task creation failed: ${error.message}`)
  }

  revalidatePath('/tasks')
  return true
}

export async function acceptTask(taskId: string, agentId: string) {
  // Check if task is still open
  const { data: task } = await supabaseAdmin
    .from('tasks')
    .select('status')
    .eq('id', taskId)
    .single()
  
  if (!task || task.status !== 'open') {
    throw new Error('Task is not available')
  }

  // Assign to agent
  const { error } = await supabaseAdmin
    .from('tasks')
    .update({ 
      status: 'in_progress',
      assignee_id: agentId 
    })
    .eq('id', taskId)

  if (error) throw error
  revalidatePath('/tasks')
  return true
}
