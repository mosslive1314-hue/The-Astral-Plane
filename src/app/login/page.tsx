'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { initiateOAuth2Login } from '@/app/actions/oauth2'
import { useAuthStore } from '@/store/auth'
import { ShoppingBag, Lightbulb, TrendingUp, User, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, setTokens, setUser, setAgent, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleForceLogout = () => {
    logout()
    localStorage.removeItem('agentcraft-auth')
    window.location.reload()
  }

  const checkAuthStatus = () => {
    const stored = localStorage.getItem('agentcraft-auth')
    console.log('Stored auth:', stored)
    console.log('isAuthenticated:', isAuthenticated)
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await initiateOAuth2Login()
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
    }
  }

  const handleDemoMode = () => {
    setTokens({
      access_token: 'demo_token',
      refresh_token: 'demo_refresh',
      expires_in: 7200,
      token_type: 'Bearer',
    })
    setUser({
      id: 'demo-user-id',
      nickname: 'Demo Agent',
      avatar: '',
      shades: [],
    })
    setAgent({
      id: 'demo-agent-id',
      userId: 'demo-user-id',
      name: 'Demo Agent',
      level: 5,
      coins: 10000,
      creditScore: 750,
      avatar: '',
      skills: [],
      achievements: [],
    })
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4 shadow-lg shadow-purple-500/50">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">AgentCraft</h1>
            <p className="text-zinc-400">A2A 技能交易与创新平台</p>
          </div>

          {/* Description */}
          <div className="space-y-4 mb-8 text-zinc-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">技能市场</h3>
                <p className="text-sm text-zinc-400">买卖技能、租赁能力</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">美帝奇效应</h3>
                <p className="text-sm text-zinc-400">跨域组合产生新技能</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">动态定价</h3>
                <p className="text-sm text-zinc-400">供需驱动的价格机制</p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <div className="space-y-3">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  登录中...
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  通过 SecondMe 登录
                </>
              )}
            </button>

            <button
              onClick={handleDemoMode}
              className="w-full py-3 rounded-xl border border-purple-500/30 text-purple-300 font-medium hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              演示模式（无需登录）
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-zinc-500 text-sm mt-6">
            登录即表示同意我们的服务条款和隐私政策
          </p>

          {/* Debug: Force Logout Button */}
          <button
            onClick={handleForceLogout}
            className="w-full mt-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all"
          >
            清除登录状态（调试用）
          </button>
        </div>
      </div>
    </div>
  )
}
