'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { TrendingUp, User, Sparkles, Home, LogOut, MessageSquare, FileText, CheckCircle, LineChart, Zap } from 'lucide-react'

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/market', label: '技能市场', icon: TrendingUp },
  { href: '/medici', label: '美帝奇效应', icon: Sparkles },
  { href: '/futures', label: '期货市场', icon: LineChart },
  { href: '/tasks', label: '任务系统', icon: CheckCircle },
  { href: '/chat', label: '聊天', icon: MessageSquare },
  { href: '/notes', label: '笔记', icon: FileText },
  { href: '/act', label: 'Act', icon: Zap },
  { href: '/profile', label: '我的 Agent', icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, agent, logout, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) return null

  return (
    <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              AgentCraft
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {agent && (
              <div className="hidden md:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <span className="text-amber-400">💰</span>
                  <span className="text-amber-300 font-semibold">{agent.coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <span className="text-purple-400">⭐</span>
                  <span className="text-purple-300 font-semibold">Lv.{agent.level}</span>
                </div>
              </div>
            )}
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.nickname?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="max-w-[100px] truncate">{user.nickname}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </div>
        </div>
      </div>

      {/* 移动端导航 */}
      <div className="lg:hidden border-t border-white/10 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
