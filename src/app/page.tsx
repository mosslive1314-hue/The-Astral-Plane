'use client'

import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { useAuthStore } from '@/store/auth'
import { getUserInfo } from '@/lib/oauth'
import { syncUser } from '@/app/actions/auth'
import { supabase } from '@/lib/database'
import { ResonanceEngine } from '@/components/resonance-engine'
import { MarketTicker } from '@/components/dashboard/market-ticker'
import { ShieldCheck, Fingerprint, ArrowLeftRight, Handshake } from 'lucide-react'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, setTokens, setUser, setAgent } = useAuthStore()
  const [checkedUrlParams, setCheckedUrlParams] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 首先检查 URL 中是否有 token（从 OAuth 回调过来）
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (accessToken && refreshToken) {
      // 设置 tokens
      setTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 7200,
        token_type: 'Bearer',
      })

      // 获取用户信息并创建/更新 Agent
      const initializeUser = async () => {
        try {
          const userInfo = await getUserInfo(accessToken)
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
        } catch (error) {
          console.error('[Auth] Failed to initialize user:', error)
        }
      }

      initializeUser()
      router.replace('/')
      return
    }

    setCheckedUrlParams(true)
  }, [router, searchParams, setTokens, setUser, setAgent])

  // 处理未认证状态的重定向
  useEffect(() => {
    if (checkedUrlParams && !isAuthenticated) {
      router.push('/login')
    } else if (checkedUrlParams && isAuthenticated) {
      setIsReady(true)
    }
  }, [checkedUrlParams, isAuthenticated, router])

  if (!checkedUrlParams) {
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
        {/* Hero Section: Resonance Engine (Unified Entry) */}
        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 min-h-[400px] -mt-16">
          <div className="text-center space-y-4 max-w-4xl relative">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-500/20 blur-[100px] rounded-full opacity-30 pointer-events-none" />
            
            <h1 className="relative text-8xl font-bold text-white tracking-tight pb-2 font-sans">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-purple-300 animate-gradient">
                灵波
              </span>
            </h1>
            <p className="relative text-xl text-zinc-300 font-light tracking-wide">
              广播灵感之波 在共振中迸发全新的灵光
            </p>
          </div>
          
          <ResonanceEngine />

          {/* Joint Drive Section (Powered by Second Me & ToWow) */}
          <div className="w-full flex justify-center pt-12 pb-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
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
