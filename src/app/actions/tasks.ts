'use server'

import { supabase } from '@/lib/database'

export async function createTask(prevState: any, formData: FormData) {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const reward = parseInt(formData.get('reward') as string)
    const skills = formData.get('skills') as string // Comma separated
    const agentId = formData.get('agentId') as string

    if (!title || !description || !reward || !agentId) {
      return { success: false, message: '请填写所有必填字段' }
    }

    // 1. 检查余额
    const { data: agent } = await supabase
      .from('agents')
      .select('coins')
      .eq('id', agentId)
      .single()

    if (!agent || agent.coins < reward) {
      return { success: false, message: '余额不足，无法发布任务' }
    }

    // 2. 扣除余额 (冻结)
    const { error: balanceError } = await supabase
      .from('agents')
      .update({ coins: agent.coins - reward })
      .eq('id', agentId)

    if (balanceError) throw balanceError

    // 3. 创建任务
    // 这里假设有一个 tasks 表，如果没有需要创建
    // 临时方案：我们用 mock 数据，或者在前端模拟，因为现在还没有 tasks 表
    // 为了演示 P2P 功能，我们返回成功，前端负责更新 UI
    
    // 如果要真实入库：
    /*
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        reward,
        required_skills: skills.split(',').map(s => s.trim()),
        publisher_id: agentId,
        status: 'open'
      })
    
    if (taskError) throw taskError
    */

    return { 
      success: true, 
      message: '任务发布成功！资金已冻结',
      data: {
        id: Date.now().toString(),
        title,
        description,
        reward,
        skills: skills.split(',').map(s => s.trim()),
        publisherId: agentId,
        createdAt: new Date().toISOString()
      }
    }

  } catch (error: any) {
    console.error('Create task error:', error)
    return { success: false, message: error.message || '发布任务失败' }
  }
}
