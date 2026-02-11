'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { exchangeCodeForToken, getSecondMeUserInfo } from '@/app/actions/oauth2'
import { createOrUpdateUser } from '@/lib/database'
import { toast } from 'sonner'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setTokens, setUser, setAgent } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        console.error('[OAuth2] 授权失败:', error)
        toast.error('登录失败', {
          description: `授权被拒绝: ${error}`,
          duration: 5000
        })
        router.push('/login?error=' + error)
        return
      }

      if (!code || !state) {
        console.error('[OAuth2] 缺少必要的参数')
        toast.error('登录失败', {
          description: '缺少授权码或状态参数',
          duration: 5000
        })
        router.push('/login?error=invalid_params')
        return
      }

      try {
        const tokenResponse = await exchangeCodeForToken(code, state)
        
        if (!tokenResponse) {
          toast.error('登录失败', {
            description: '无法交换访问令牌',
            duration: 5000
          })
          router.push('/login?error=token_exchange_failed')
          return
        }

        console.log('[OAuth2] Token获取成功:', {
          accessToken: tokenResponse.accessToken.substring(0, 10) + '...',
          expiresIn: tokenResponse.expiresIn
        })

        const userInfo = await getSecondMeUserInfo(tokenResponse.accessToken)
        
        if (!userInfo) {
          console.error('[OAuth2] 获取用户信息失败')
          toast.error('登录失败', {
            description: '无法获取用户信息',
            duration: 5000
          })
          router.push('/login?error=user_info_failed')
          return
        }

        console.log('[OAuth2] 用户信息获取成功:', {
          name: userInfo.name,
          avatar: userInfo.avatar ? '已设置' : '未设置',
          shades: userInfo.shades?.length || 0
        })

        setTokens({
          access_token: tokenResponse.accessToken,
          refresh_token: tokenResponse.refreshToken,
          expires_in: tokenResponse.expiresIn,
          token_type: tokenResponse.tokenType,
        })

        const { user, agent } = await createOrUpdateUser(userInfo.name, {
          nickname: userInfo.name,
          avatar: userInfo.avatar,
          shades: userInfo.shades,
        })

        setUser({
          id: user.id,
          nickname: user.nickname || userInfo.name,
          avatar: user.avatar || undefined,
          shades: user.shades || []
        })
        setAgent({
          id: agent.id,
          userId: agent.user_id,
          name: agent.name,
          level: agent.level,
          coins: agent.coins,
          creditScore: agent.credit_score,
          avatar: agent.avatar || undefined,
          skills: [],
          achievements: []
        })

        toast.success('登录成功', {
          description: `欢迎回来，${userInfo.name}！`,
          duration: 3000
        })

        router.push('/')
      } catch (err: any) {
        console.error('[OAuth2] 处理回调失败:', err)
        toast.error('登录失败', {
          description: err.message || '处理授权回调时发生错误',
          duration: 5000
        })
        router.push('/login?error=callback_failed')
      }
    }

    handleCallback()
  }, [router, searchParams, setTokens, setUser, setAgent])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-6"></div>
        <h2 className="text-xl font-bold text-white mb-2">正在验证身份...</h2>
        <p className="text-zinc-400">请稍候，我们正在完成登录流程</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-6"></div>
        <h2 className="text-xl font-bold text-white mb-2">加载中...</h2>
        <p className="text-zinc-400">请稍候...</p>
      </div>
    </div>
  )
}
