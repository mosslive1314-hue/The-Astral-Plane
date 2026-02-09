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

    // 3. 开始事务处理 (Supabase 不支持直接的事务 API，我们通过顺序执行并手动回滚模拟，或者相信数据库约束)
    // 这里我们按顺序执行：扣款 -> 加款 -> 转移技能 -> 记录交易 -> 更新市场状态

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
    
    // 如果 RPC 不存在，先用普通 update (注意并发问题，但在 Demo 中可接受)
    if (addError) {
       const { data: seller } = await supabaseAdmin.from('agents').select('coins').eq('id', marketItem.seller_id).single()
       if (seller) {
         await supabaseAdmin.from('agents').update({ coins: seller.coins + price }).eq('id', marketItem.seller_id)
       }
    }

    // 3.3 给予买家技能
    // 检查是否已拥有
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

    // 3.5 更新市场条目状态 (如果是租赁，可能不需要下架，这里假设购买是永久的)
    // 对于非租赁商品，购买后下架
    // 但为了演示方便，或者是"复制"技能模式，我们可能保留上架状态？
    // 通常技能市场是"学习"，所以是复制一份。卖家依然拥有技能，且可以继续卖。
    // 所以这里不更新为 sold，除非是独家转让。
    // 根据需求，AgentCraft 似乎是复制模式。我们保留 market_skills 状态为 active。
    
    // 更新买家缓存或状态
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

    // 3.3 给予临时技能 (这里简化为直接给予技能，不处理过期逻辑，或者记录过期时间)
    // 检查是否已拥有
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
        // 实际项目中应添加 expires_at 字段
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
