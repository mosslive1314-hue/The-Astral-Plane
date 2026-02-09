'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/database'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setTokens, setUser, setAgent } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const error = searchParams.get('error')

      if (error) {
        console.error('Auth error:', error)
        router.push('/login?error=' + error)
        return
      }

      if (accessToken && refreshToken) {
        // 设置 tokens
        setTokens({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 7200, // 默认 2 小时
          token_type: 'Bearer',
        })

        // 获取用户信息
        try {
          // 1. 获取 SecondMe 用户信息
          // 这里我们应该调用 /api/user/info，但为了简单起见，我们假设后端已经同步了用户
          // 我们可以直接从 Supabase 获取当前 Agent 信息
          
          // 在实际 OAuth 流程中，我们需要用 access_token 去换取用户信息
          // 但由于我们的 callback route 是在服务端做的 code exchange，它没法直接把 user info 传给客户端
          // 所以这里我们可以在客户端再调一次后端 API，或者直接用 token 解码（如果不安全）
          
          // 临时方案：直接跳转首页，由首页的 AuthGuard 去 fetchUser
          // 但为了用户体验，我们在这里尝试 fetch 一次
          
          // 假设我们在 state 中存了 user_id? 不，我们在后端 syncUser 了
          
          // 简单的做法：只存 token，让 store 的 persist 机制工作，然后跳转
          // 首页的 useEffect 会检测到 isAuthenticated，然后去 fetch 数据
          
          router.push('/')
        } catch (err) {
          console.error('Failed to setup user session', err)
          router.push('/login?error=session_setup_failed')
        }
      } else {
        router.push('/login?error=no_token')
      }
    }

    handleCallback()
  }, [router, searchParams, setTokens])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">正在验证身份...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">加载中...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
