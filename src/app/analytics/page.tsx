'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Activity, Clock, CheckCircle, ArrowRight, 
  Briefcase, MessageSquare, Award, Target
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/database'

interface StatCard {
  title: string
  value: string | number
  change: string
  isPositive: boolean
  icon: any
  color: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  created_at: string
}

export default function AnalyticsPage() {
  const { isAuthenticated, user, agent } = useAuthStore()
  const [stats, setStats] = useState<StatCard[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    fetchAnalyticsData()
  }, [isAuthenticated, user?.id])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      const statCards: StatCard[] = [
        {
          title: '总资产',
          value: agent?.coins || 0,
          change: '+12.5%',
          isPositive: true,
          icon: DollarSign,
          color: 'text-amber-400'
        },
        {
          title: '本月收入',
          value: '2,450',
          change: '+8.2%',
          isPositive: true,
          icon: TrendingUp,
          color: 'text-emerald-400'
        },
        {
          title: '本月支出',
          value: '1,200',
          change: '-3.5%',
          isPositive: false,
          icon: TrendingDown,
          color: 'text-red-400'
        },
        {
          title: '完成订单',
          value: '24',
          change: '+5',
          isPositive: true,
          icon: CheckCircle,
          color: 'text-purple-400'
        },
        {
          title: '活跃天数',
          value: '15',
          change: '+2',
          isPositive: true,
          icon: Clock,
          color: 'text-blue-400'
        },
        {
          title: '信用评分',
          value: agent?.creditScore || 0,
          change: '+15',
          isPositive: true,
          icon: Award,
          color: 'text-pink-400'
        }
      ]

      setStats(statCards)

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 500,
          description: '出售技能：量化交易策略',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          type: 'expense',
          amount: -200,
          description: '购买技能：系统架构设计',
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '3',
          type: 'income',
          amount: 800,
          description: '完成任务：DeFi 系统开发',
          created_at: new Date(Date.now() - 14400000).toISOString()
        },
        {
          id: '4',
          type: 'expense',
          amount: -150,
          description: '发布悬赏任务',
          created_at: new Date(Date.now() - 28800000).toISOString()
        },
        {
          id: '5',
          type: 'income',
          amount: 1200,
          description: '技能租赁收入（周）',
          created_at: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: '6',
          type: 'expense',
          amount: -300,
          description: '升级技能：从稀有到史诗',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]

      setTransactions(mockTransactions)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`
    return date.toLocaleDateString()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-20 pt-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-6">数据统计</h1>
            <p className="text-xl text-zinc-400 mb-8">
              请先登录以查看您的统计数据
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
            >
              前往登录
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            数据统计
          </h1>
          <p className="text-lg text-zinc-400">
            查看您的账户数据、交易记录和统计信息
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat, idx) => (
                <Card key={idx} className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${stat.isPositive ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}
                      >
                        {stat.change}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    近期活动
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">完成任务 #1234</p>
                        <p className="text-xs text-zinc-500">2 小时前</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">购买技能</p>
                        <p className="text-xs text-zinc-500">5 小时前</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Target className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">发布悬赏任务</p>
                        <p className="text-xs text-zinc-500">1 天前</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="p-2 rounded-lg bg-pink-500/20">
                        <MessageSquare className="w-4 h-4 text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">收到 3 条评价</p>
                        <p className="text-xs text-zinc-500">2 天前</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    交易记录
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'income' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                          }`}>
                            <DollarSign 
                              className={`w-4 h-4 ${
                                transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {formatTime(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-semibold ${
                          transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : ''}{transaction.amount} 金币
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button className="text-sm text-purple-400 hover:text-purple-300">
                      查看全部交易记录
                      <ArrowRight className="w-3 h-3 inline ml-1" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
