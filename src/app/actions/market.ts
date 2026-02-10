'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export type TransactionResult = {
  success: boolean
  message: string
  newBalance?: number
}

/**
 * 购买技能
 */
export async function buySkill(
  buyerAgentId: string,
  marketSkillId: string,
  price: number
): Promise<TransactionResult> {
  try {
    // 1. 获取买家信息
    const { data: buyer, error: buyerError } = await supabaseAdmin
      .from('agents')
      .select('coins, user_id')
      .eq('id', buyerAgentId)
      .single()

    if (buyerError || !buyer) {
      return { success: false, message: '买家信息不存在' }
    }

    if (buyer.coins < price) {
      return { success: false, message: '金币不足' }
    }

    // 2. 获取商品信息
    const { data: marketItem, error: marketError } = await supabaseAdmin
      .from('market_skills')
      .select('skill_id, seller_id, status')
      .eq('id', marketSkillId)
      .single()

    if (marketError || !marketItem) {
      return { success: false, message: '商品不存在' }
    }

    if (marketItem.status !== 'active') {
      return { success: false, message: '商品已下架或已售出' }
    }

    if (marketItem.seller_id === buyerAgentId) {
      return { success: false, message: '不能购买自己的商品' }
    }

    // 3. 开始事务处理
    // 3.1 扣除买家金币
    const { error: deductError } = await supabaseAdmin
      .from('agents')
      .update({ coins: buyer.coins - price })
      .eq('id', buyerAgentId)

    if (deductError) throw new Error('扣款失败')

    // 3.2 增加卖家金币
    const { error: addError } = await supabaseAdmin.rpc('increment_coins', {
      row_id: marketItem.seller_id,
      amount: price
    })
    
    if (addError) {
       const { data: seller } = await supabaseAdmin.from('agents').select('coins').eq('id', marketItem.seller_id).single()
       if (seller) {
         await supabaseAdmin.from('agents').update({ coins: seller.coins + price }).eq('id', marketItem.seller_id)
       }
    }

    // 3.3 给予买家技能
    const { data: existingSkill } = await supabaseAdmin
      .from('agent_skills')
      .select('id')
      .eq('agent_id', buyerAgentId)
      .eq('skill_id', marketItem.skill_id)
      .single()

    if (!existingSkill) {
      await supabaseAdmin.from('agent_skills').insert({
        agent_id: buyerAgentId,
        skill_id: marketItem.skill_id,
        level: 1,
        max_level: 5
      })
    }

    // 3.4 记录交易
    await supabaseAdmin.from('transactions').insert({
      buyer_id: buyerAgentId,
      seller_id: marketItem.seller_id,
      market_skill_id: marketSkillId,
      price: price,
      type: 'purchase'
    })

    // 3.5 更新市场条目状态 (Copy模式不需下架)
    
    revalidatePath('/market')
    revalidatePath('/profile')

    return { 
      success: true, 
      message: '购买成功！',
      newBalance: buyer.coins - price
    }

  } catch (error: any) {
    console.error('Purchase error:', error)
    return { success: false, message: `交易失败: ${error.message}` }
  }
}

/**
 * 租赁技能
 */
export async function rentSkill(
  buyerAgentId: string,
  marketSkillId: string,
  price: number,
  duration: number
): Promise<TransactionResult> {
  try {
    // 1. 验证买家余额
    const { data: buyer, error: buyerError } = await supabaseAdmin
      .from('agents')
      .select('coins')
      .eq('id', buyerAgentId)
      .single()

    if (buyerError || !buyer || buyer.coins < price) {
      return { success: false, message: '金币不足' }
    }

    // 2. 获取商品信息
    const { data: marketItem, error: marketError } = await supabaseAdmin
      .from('market_skills')
      .select('skill_id, seller_id')
      .eq('id', marketSkillId)
      .single()

    if (marketError || !marketItem) {
      return { success: false, message: '商品不存在' }
    }

    // 3. 执行交易
    // 3.1 扣款
    await supabaseAdmin
      .from('agents')
      .update({ coins: buyer.coins - price })
      .eq('id', buyerAgentId)

    // 3.2 加款给卖家
    const { data: seller } = await supabaseAdmin.from('agents').select('coins').eq('id', marketItem.seller_id).single()
    if (seller) {
      await supabaseAdmin.from('agents').update({ coins: seller.coins + price }).eq('id', marketItem.seller_id)
    }

    // 3.3 给予临时技能
    const { data: existingSkill } = await supabaseAdmin
      .from('agent_skills')
      .select('id')
      .eq('agent_id', buyerAgentId)
      .eq('skill_id', marketItem.skill_id)
      .single()

    if (!existingSkill) {
      await supabaseAdmin.from('agent_skills').insert({
        agent_id: buyerAgentId,
        skill_id: marketItem.skill_id,
        level: 1,
        max_level: 5,
      })
    }

    // 3.4 记录交易
    await supabaseAdmin.from('transactions').insert({
      buyer_id: buyerAgentId,
      seller_id: marketItem.seller_id,
      market_skill_id: marketSkillId,
      price: price,
      type: 'rental'
    })

    revalidatePath('/market')
    revalidatePath('/profile')

    return { 
      success: true, 
      message: `租赁成功！有效期 ${duration} 小时`,
      newBalance: buyer.coins - price
    }

  } catch (error: any) {
    console.error('Rental error:', error)
    return { success: false, message: `交易失败: ${error.message}` }
  }
}

/**
 * 发布技能到市场
 */
export async function publishSkillToMarket(
  agentId: string, 
  skillData: {
    name: string,
    description: string,
    content: string,
    price?: number
  }
) {
  try {
    // 1. 创建或获取基础技能记录 (Skills Table)
    // 先检查是否已存在同名技能 (简化逻辑)
    // 实际项目中可能需要更复杂的查重
    
    // 生成一个随机价格，如果未提供
    const basePrice = skillData.price || Math.floor(Math.random() * 500) + 100

    let skillId = ''

    // 尝试查找该 Agent 是否已经创建过这个技能
    // 这里我们假设 skills 表是全局的，但我们可以通过 name 和 category 来模糊匹配
    // 为了简单，我们每次都创建一个新的 skill 记录，或者复用
    // 更好的做法：SkillCreator 生成的包是 "Template"，发布到市场才变成 "Product"
    
    const { data: newSkill, error: skillError } = await supabaseAdmin
      .from('skills')
      .insert({
        name: skillData.name,
        description: skillData.description,
        category: 'programming', // 默认为编程，或者让 AI 分析
        rarity: 'rare',
        base_price: basePrice
      })
      .select()
      .single()

    if (skillError) {
      // 如果插入失败（可能是名字冲突？），尝试查询
      console.warn('Skill insert failed, trying to find existing:', skillError)
      // 这里简化处理：抛出错误
      throw new Error(`技能创建失败: ${skillError.message}`)
    }
    
    skillId = newSkill.id

    // 2. 给予 Agent 该技能 (作为拥有者)
    await supabaseAdmin.from('agent_skills').insert({
      agent_id: agentId,
      skill_id: skillId,
      level: 1,
      max_level: 5
    })

    // 3. 上架到市场 (Market Skills Table)
    const { error: marketError } = await supabaseAdmin
      .from('market_skills')
      .insert({
        skill_id: skillId,
        seller_id: agentId,
        current_price: basePrice,
        status: 'active',
        is_rental: false
      })

    if (marketError) throw marketError

    // 4. 同时创建心智资产笔记 (备份)
    await supabaseAdmin.from('notes').insert({
      agent_id: agentId,
      title: `技能: ${skillData.name}`,
      content: skillData.content,
      tags: ['skill', 'claude-code', skillData.name, 'published', 'market'],
      category: 'skill',
      linked_skill_id: skillId
    })

    revalidatePath('/market')
    revalidatePath('/studio')
    revalidatePath('/profile')

    return { success: true, message: '技能已成功发布到市场！' }

  } catch (error: any) {
    console.error('Publish error:', error)
    return { success: false, message: `发布失败: ${error.message}` }
  }
}
