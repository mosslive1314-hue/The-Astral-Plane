import { NextResponse } from 'next/server'
import { zhipu, GLM_MODEL } from '@/lib/zhipu'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 定义工具（Function Calling）
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_market_skills',
      description: '查询市场上的热门技能或特定类别的技能',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: '技能类别，如 programming, design, writing 等',
          },
          limit: {
            type: 'number',
            description: '返回数量限制',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_agent_info',
      description: '查询当前用户的 Agent 信息（等级、金币、技能等）',
      parameters: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: '用户的 ID',
          },
        },
        required: ['userId'],
      },
    },
  },
]

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json()

    // 1. 获取用户 Agent 上下文 (如果提供了 userId)
    let systemPrompt = `你是一个智能助手，运行在 AgentCraft 平台上。
AgentCraft 是一个 AI Agent 技能交易与创新平台，支持技能买卖、租赁和通过"美帝奇效应"进行跨域技能组合。
你的任务是帮助用户了解平台功能、推荐技能、解答疑问。
请用简短、热情、专业的语气回答。`

    if (userId) {
      // 可以在这里预加载一些用户数据放入 System Prompt，或者完全依赖工具调用
      // 为了响应速度，我们暂时依赖工具调用
    }

    const response = await zhipu.chat.completions.create({
      model: GLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      tools: tools as any,
      tool_choice: 'auto',
    })

    const responseMessage = response.choices[0].message

    // 2. 处理工具调用
    if (responseMessage.tool_calls) {
      const toolCalls = responseMessage.tool_calls
      
      // 这里的 messages 历史需要包含 assistant 的 tool_calls 消息
      const newMessages = [
        ...messages,
        responseMessage,
      ]

      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue
        
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)
        let functionResult = ''

        if (functionName === 'get_market_skills') {
          const { data } = await supabaseAdmin
            .from('market_skills')
            .select('current_price, skill:skills(name, category, rarity)')
            .eq('status', 'active')
            .limit(functionArgs.limit || 5)
          
          functionResult = JSON.stringify(data)
        } else if (functionName === 'get_my_agent_info') {
          // 注意：这里需要真实的 agentId，前端传来的 userId 可能是 SecondMe ID
          // 需要先转换，或者前端直接传 agentId
          // 假设传入的是 Agent ID
          const { data } = await supabaseAdmin
            .from('agents')
            .select('name, level, coins, credit_score, agent_skills(skill:skills(name))')
            .eq('user_id', functionArgs.userId) // 假设传入的是 user_id
            .single()
            
          functionResult = JSON.stringify(data)
        }

        newMessages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResult,
        })
      }

      // 3. 再次调用模型生成最终回答
      const secondResponse = await zhipu.chat.completions.create({
        model: GLM_MODEL,
        messages: newMessages,
      })

      return NextResponse.json(secondResponse.choices[0].message)
    }

    return NextResponse.json(responseMessage)

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
}
