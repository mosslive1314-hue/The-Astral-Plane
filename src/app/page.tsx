'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { mockSkills } from '@/lib/mock-data'
import { getUserInfo } from '@/lib/oauth'
import { syncUser } from '@/app/actions/auth'
import { TrendingUp, Sparkles, Users, Activity, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/database'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, setTokens, setUser, setAgent } = useAuthStore()
  const [checkedUrlParams, setCheckedUrlParams] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [skills, setSkills] = useState<any[]>([])

  useEffect(() => {
    // 获取热门技能
    const fetchHotSkills = async () => {
      try {
        const { data, error } = await supabase
          .from('market_skills')
          .select(`
            id,
            current_price,
            skill:skills (
              id,
              name,
              category,
              description,
              rarity
            )
          `)
          .eq('status', 'active')
          .limit(3)
          
        if (data) {
          const mappedSkills = data.map((item: any) => ({
            id: item.id,
            name: item.skill.name,
            category: item.skill.category,
            description: item.skill.description,
            rarity: item.skill.rarity,
            currentPrice: item.current_price
          }))
          setSkills(mappedSkills)
        }
      } catch (error) {
        console.error('Failed to fetch skills:', error)
      }
    }
    
    fetchHotSkills()
  }, [])

  useEffect(() => {
    // 首先检查 URL 中是否有 token（从 OAuth 回调过来）
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const demoMode = searchParams.get('demo_mode')

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
          console.log('[Auth] Fetching user info...')
          const userInfo = await getUserInfo(accessToken)
          console.log('[Auth] User info received:', userInfo)

          // 设置用户基本信息
          setUser({
            id: userInfo.id,
            nickname: userInfo.nickname,
            avatar: userInfo.avatar,
            shades: [], // 稍后可以从 API 获取
          })

          // 创建或更新用户和 Agent
          console.log('[Auth] Creating/updating user and agent...')
          const { user, agent } = await syncUser(userInfo.id, {
            nickname: userInfo.nickname,
            avatar: userInfo.avatar,
            shades: [],
          })

          console.log('[Auth] Agent loaded:', agent)

          // 设置 Agent 信息
          setAgent({
            id: agent.id,
            userId: user.id,
            name: agent.name,
            level: agent.level,
            coins: agent.coins,
            creditScore: agent.credit_score,
            avatar: agent.avatar || undefined,
            skills: [], // 初始为空，可以从数据库加载
            achievements: [], // 初始为空，可以从数据库加载
          })

          console.log('[Auth] User initialization complete!')
        } catch (error) {
          console.error('[Auth] Failed to initialize user:', error)
          // 即使失败也继续，但记录错误
        }
      }

      initializeUser()

      // 清除 URL 参数（重新加载页面）
      router.replace('/')
      return
    }

    // 标记已完成 URL 参数检查
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

  // Only redirect to login after checking URL params
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

  if (!isAuthenticated) {
    return null
  }

  if (!isReady) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            欢迎来到 AgentCraft
          </h1>
          <p className="text-zinc-400 text-lg">
            A2A 技能交易与创新平台 - 让 AI Agent 通过技能组合产生创新突破
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="活跃 Agent"
            value="1,234"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            label="技能总数"
            value={mockSkills.length}
            icon={<Sparkles className="w-5 h-5" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            label="今日交易"
            value="456"
            icon={<Activity className="w-5 h-5" />}
            trend={{ value: 23, isPositive: true }}
          />
          <StatCard
            label="美帝奇发现"
            value="89"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 技能市场 */}
          <Card className="group hover:border-purple-500/30 transition-all cursor-pointer" onClick={() => router.push('/market')}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <Badge variant="category">热门</Badge>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">技能市场</h3>
              <p className="text-zinc-400 text-sm mb-4">
                浏览、购买和租赁各种技能，提升你的 Agent 能力
              </p>
              <div className="flex items-center gap-2 text-purple-400">
                <span className="text-sm font-medium">立即探索</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* 美帝奇效应 */}
          <Card className="group hover:border-amber-500/30 transition-all cursor-pointer" onClick={() => router.push('/medici')}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <Badge variant="rarity" rarity="legendary">创新</Badge>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">美帝奇效应</h3>
              <p className="text-zinc-400 text-sm mb-4">
                跨域技能组合，发现意想不到的创新突破
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <span className="text-sm font-medium">开始实验</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* 我的 Agent */}
          <Card className="group hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => router.push('/profile')}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <Badge variant="default">个人</Badge>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">我的 Agent</h3>
              <p className="text-zinc-400 text-sm mb-4">
                查看你的 Agent 信息、技能树和成就
              </p>
              <div className="flex items-center gap-2 text-blue-400">
                <span className="text-sm font-medium">查看详情</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hot Skills */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">热门技能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {skills.slice(0, 3).map(skill => (
              <Card key={skill.id} className="hover:border-purple-500/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{skill.name}</h3>
                      <p className="text-xs text-zinc-500">{skill.category}</p>
                    </div>
                    <Badge variant="rarity" rarity={skill.rarity} className="text-xs">
                      {skill.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">{skill.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-semibold">💰 {skill.currentPrice.toLocaleString()}</span>
                    <span className="text-xs text-green-400">↑ 2.5%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
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
