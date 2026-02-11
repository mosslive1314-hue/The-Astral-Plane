'use client'

import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { useAuthStore } from '@/store/auth'
import { getUserInfo } from '@/lib/oauth'
import { syncUser } from '@/app/actions/auth'
import { supabase } from '@/lib/database'
import { TowowProtocols } from '@/components/home/towow-protocols'
import { MarketTicker } from '@/components/dashboard/market-ticker'
import { ShieldCheck, Fingerprint, ArrowLeftRight, Handshake } from 'lucide-react'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, setTokens, setUser, setAgent } = useAuthStore()
  const [isCheckingSession, setIsCheckingSession] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)

  useEffect(() => {
    const checkAuthSession = async () => {
      console.log('[HomePage] Checking auth session from cookies...')
      
      try {
        const response = await fetch('/api/auth/session')
          const sessionData = await response.json()
          
          console.log('[HomePage] Session data:', sessionData)
          
          if (sessionData.authenticated && sessionData.accessToken) {
            console.log('[HomePage] Found valid session, initializing user...')
            
            // 获取用户信息并创建/更新 Agent
            const userInfo = await getUserInfo(sessionData.accessToken)
            console.log('[HomePage] User info received:', userInfo)
            
            setUser({
              id: userInfo.id,
              nickname: userInfo.nickname,
              avatar: userInfo.avatar,
              shades: [],
            })

            const { user, agent } = await syncUser(userInfo.id, {
              nickname: userInfo.nickname,
              avatar: userInfo.avatar,
              shades: [],
            })
            console.log('[HomePage] User synced:', user.id, agent.id)

            setAgent({
              id: agent.id,
              userId: user.id,
              name: agent.name,
              level: agent.level,
              coins: agent.coins,
              creditScore: agent.credit_score,
              avatar: agent.avatar || undefined,
              skills: [],
              achievements: [],
            })

            // 注册 Agent 向量到共振引擎
            try {
              await fetch('/api/agents/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  token: sessionData.accessToken
                })
              })
              console.log('[HomePage] Agent vector registered successfully')
            } catch (error) {
              console.error('[HomePage] Failed to register agent vector:', error)
            }

            // 设置 tokens 到 Zustand store
            setTokens({
              access_token: sessionData.accessToken,
              refresh_token: sessionData.refreshToken,
              expires_in: 7200,
              token_type: 'Bearer',
            })
            
            console.log('[HomePage] User initialized from cookies successfully')
          } else {
            console.log('[HomePage] No valid session found')
          }
      } catch (error) {
        console.error('[HomePage] Error checking session:', error)
      } finally {
        setIsCheckingSession(false)
        setHasCheckedSession(true)
      }
    }

    // 只在首次加载时检查 session
    if (!isCheckingSession) {
      setIsCheckingSession(true)
      checkAuthSession()
    }
  }, [])

  // 处理认证状态变化
  useEffect(() => {
    if (!isCheckingSession && isAuthenticated) {
      console.log('[HomePage] User is now authenticated, showing page...')
      setIsReady(true)
    }
  }, [isCheckingSession, isAuthenticated])

  // 检查是否从 OAuth 成功回调回来
  const authSuccess = searchParams.get('auth_success')
  useEffect(() => {
    if (authSuccess === 'true') {
      console.log('[HomePage] OAuth callback detected, clearing URL...')
      router.replace('/')
    }
  }, [authSuccess, router])

  // 处理未认证状态的重定向
  useEffect(() => {
    console.log('[HomePage] Auth state check:', { isCheckingSession, isAuthenticated, hasCheckedSession })
    if (hasCheckedSession && !isAuthenticated) {
      // 检查 session 完成，且未认证，跳转到登录页
      console.log('[HomePage] Redirecting to login page...')
      router.push('/login')
    } else if (hasCheckedSession && isAuthenticated) {
      // 已认证，显示页面
      console.log('[HomePage] Showing home page...')
      setIsReady(true)
    }
  }, [isCheckingSession, isAuthenticated, hasCheckedSession, router])

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">正在加载...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (!isReady) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navigation />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 pt-24 pb-12 w-full flex flex-col gap-8">
        {/* Hero Section: LingJie (New Independent Home) */}
        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-12 min-h-[400px] -mt-16">
          <div className="text-center space-y-6 max-w-4xl relative">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full opacity-40 pointer-events-none" />
            
            <p className="relative text-xl text-zinc-300 font-light tracking-wide max-w-3xl mx-auto leading-relaxed">
              这里是 <span className="text-white font-semibold">灵界</span> —— 基于 <span className="text-emerald-400 font-bold">通爻</span> 协议构建的价值交换网络。<br/>
              我们与 <span className="text-blue-400 font-bold">Second Me</span> 深度融合，让您的数字分身在此通过协作与交易，<br/>
              将灵感转化为真实的资产与影响力。
            </p>
          </div>
          
          {/* Protocols Section (Now Main Feature) */}
          <div className="w-full max-w-6xl mx-auto">
             <TowowProtocols />
          </div>

          {/* Joint Drive Section (Powered by Second Me & ToWow) */}
          <div className="w-full flex justify-center pt-8 pb-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="flex items-center gap-2 sm:gap-4 bg-black/40 backdrop-blur-xl border border-white/5 px-4 sm:px-8 py-3 rounded-2xl hover:border-purple-500/20 transition-all shadow-2xl hover:shadow-[0_0_40px_rgba(147,51,234,0.1)] group">
              
              {/* Text: 由 */}
              <span className="text-zinc-600 font-mono text-xs select-none">由</span>

              {/* Second Me Block */}
              <Link href="https://home.second.me/" target="_blank" className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer group/item">
                 <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg group-hover/item:scale-110 transition-transform bg-white/5 relative">
                    <img 
                      src="/images/secondme-logo.png" 
                      alt="Second Me" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                         e.currentTarget.style.display = 'none';
                         e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-blue-600', 'to-cyan-600', 'flex', 'items-center', 'justify-center');
                         const icon = document.createElement('div');
                         icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fingerprint"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/></svg>';
                         e.currentTarget.parentElement?.appendChild(icon);
                      }}
                    />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-none mb-1 group-hover/item:text-blue-300 transition-colors">世另我</span>
                    <span className="text-[10px] text-zinc-500 font-mono scale-90 origin-left uppercase tracking-wider">数字孪生</span>
                 </div>
              </Link>

              {/* Connection Icon */}
              <div className="text-zinc-700 px-1 sm:px-2">
                 <Handshake className="w-5 h-5 opacity-60" />
              </div>

              {/* ToWow Block */}
              <Link href="https://towow.net" target="_blank" className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer group/item">
                 <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg group-hover/item:scale-110 transition-transform bg-white/5 relative">
                    <img 
                      src="/images/towow-logo.png" 
                      alt="ToWow" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                         e.currentTarget.style.display = 'none';
                         e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-emerald-500', 'to-purple-600', 'flex', 'items-center', 'justify-center');
                         const icon = document.createElement('div');
                         icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>';
                         e.currentTarget.parentElement?.appendChild(icon);
                      }}
                    />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-none mb-1 group-hover/item:text-emerald-300 transition-colors">通爻</span>
                    <span className="text-[10px] text-zinc-500 font-mono scale-90 origin-left">需求触发子网 · 价值自然生长</span>
                 </div>
              </Link>

              {/* Text: 共同驱动 */}
              <span className="text-zinc-600 font-mono text-xs select-none">共同驱动</span>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">正在加载...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
