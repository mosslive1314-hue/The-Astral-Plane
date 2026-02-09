'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { AgentManager } from '@/components/agent-manager'
import { getAgentFullDetails } from '@/app/actions/auth'
import type { Agent } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [agentDetails, setAgentDetails] = useState<Agent | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.id) {
      // 这里的 user.id 实际上是 SecondMe 的 userId
      // 但是在数据库中，我们通过 syncUser 确保了 users 表中有记录
      // 我们需要通过 syncUser 返回的 user.id (UUID) 来查询 Agent
      // 或者 getAgentFullDetails 内部处理 SecondMe ID -> User UUID 的转换
      // 现在的 getAgentFullDetails 接收的是 User UUID (agents.user_id)
      
      // 注意：useAuthStore 中的 user.id 可能是 SecondMe ID，也可能是 DB UUID
      // 取决于初始化时的设置。
      // 让我们检查一下 HomePage 是怎么设置 user 的。
      
      // 在 HomePage 中：
      // const { user: dbUser, agent: dbAgent } = await syncUser(...)
      // 然后没有更新 useAuthStore 的 user.id 为 dbUser.id
      // 而是用了 userInfo.id (SecondMe ID)
      
      // 所以这里我们需要先用 SecondMe ID 找到 DB User ID
      // 或者直接在 syncUser 的时候就把 DB ID 存到 Store 里。
      // 为了简单起见，我们可以在这里直接调用一个能通过 SecondMe ID 获取 Agent 的 Action
      // 但由于时间关系，我们可以假设 Store 里存的是正确的 ID，或者修改 Action 支持 SecondMe ID。
      
      // 最好的办法：让 syncUser 返回完整的 Agent 详情，并更新 Store。
      // 但这里是 Profile 页面，我们独立获取数据。
      
      // 让我们修改 getAgentFullDetails 让它更智能，或者直接在 useEffect 里先获取 DB User。
      
      // 为了稳健，我们在 Action 里加一个通过 SecondMe ID 获取 Agent 的方法，或者修改 getAgentFullDetails。
      // 不过，目前的 getAgentFullDetails 接收 userId (UUID)。
      
      // 让我们假设 auth store 里的 user.id 是 SecondMe ID。
      // 我们需要先找到对应的 UUID。
      
      const fetchAgent = async () => {
        // 由于是客户端组件，我们可以调用 Server Action
        // 但是我们需要先知道 UUID。
        // 让我们在 auth store 里增加 dbUserId 字段？或者简单点，修改 getAgentFullDetails 支持 SecondMe ID。
        // 但数据库表结构是 agents.user_id -> users.id (UUID)。
        // users.secondme_id -> users.id。
        
        // 让我们修改 getAgentFullDetails 接收 SecondMe ID。
        // 不，这样会混淆。
        
        // 我们在页面加载时，先调用 syncUser (其实已经登录过了，应该有数据) 或者一个新的 Action。
        // 让我们创建一个 getAgentBySecondMeId Action。
        
        // 暂时先用 mock 数据兜底，如果获取失败。
        
        // 实际上，HomePage 已经调用了 syncUser 并拿到了 agent 对象。
        // 它调用了 setAgent(agent)。
        // setAgent 存的是 DB Agent 的数据。
        // 所以 useAuthStore().agent.id 是 DB Agent ID。
        // useAuthStore().agent.userId 是 DB User ID (UUID)。
        
        // 我们可以直接用 useAuthStore().agent.userId 来调用 getAgentFullDetails。
      }
    }
  }, [isAuthenticated, router, user])
  
  // 使用 Store 中的 Agent ID 来获取详情
  const { agent } = useAuthStore()
  
  useEffect(() => {
    const loadData = async () => {
      if (agent?.userId) {
        setLoading(true)
        const details = await getAgentFullDetails(agent.userId)
        if (details) {
          setAgentDetails(details)
        }
        setLoading(false)
      }
    }
    
    if (isAuthenticated && agent?.userId) {
      loadData()
    }
  }, [isAuthenticated, agent])

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">我的 Agent</h1>
          <p className="text-zinc-400">
            管理、升级和定制你的 AI Agent
          </p>
        </div>
        {loading ? (
           <div className="text-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
             <p className="text-zinc-400">正在加载 Agent 数据...</p>
           </div>
        ) : (
          <AgentManager initialAgent={agentDetails} />
        )}
      </div>
    </div>
  )
}
