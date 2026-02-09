'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { User, Command, ShoppingBag, Wand2, LogOut, Coins, Shield, Star, Briefcase } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

import { MarketTicker, CREATION_TICKER_ITEMS, VALUE_TICKER_ITEMS } from '@/components/dashboard/market-ticker'

const navItems = [
  { href: '/', label: '灵波', icon: Command },
  { href: '/studio', label: '灵境', icon: Wand2 },
  { href: '/lingxu', label: '灵墟', icon: ShoppingBag },
  { href: '/profile', label: '灵体', icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, agent, logout, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) return null

  return (
    <>
      {/* Top Bar: Clean Brand Header with Navigation */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50 h-16">
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
          
          {/* Left Navigation Links (LingBo, LingXu) */}
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 flex items-center gap-16 pointer-events-none">
             <div className="flex gap-8 pointer-events-auto pr-32">
                <Link href="/" className={cn("text-xs font-bold tracking-widest hover:text-purple-400 transition-colors", pathname === '/' ? "text-white" : "text-zinc-500")}>灵波</Link>
                <Link href="/lingxu" className={cn("text-xs font-bold tracking-widest hover:text-purple-400 transition-colors", pathname === '/lingxu' ? "text-white" : "text-zinc-500")}>灵墟</Link>
             </div>
             <div className="flex gap-8 pointer-events-auto pl-32">
                <Link href="/studio" className={cn("text-xs font-bold tracking-widest hover:text-purple-400 transition-colors", pathname === '/studio' ? "text-white" : "text-zinc-500")}>灵境</Link>
                
                {/* LingTi with Integrated Profile Hover */}
                <HoverCard openDelay={0} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <Link href="/profile" className={cn("text-xs font-bold tracking-widest hover:text-purple-400 transition-colors cursor-pointer", pathname === '/profile' ? "text-white" : "text-zinc-500")}>
                      灵体
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent side="bottom" align="end" className="w-80 bg-black/90 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden shadow-2xl mt-4">
                     {/* Integrated Profile Info */}
                     <div className="p-4 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-b border-white/10">
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden bg-black">
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold bg-zinc-800">
                                {user?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                         </div>
                         <div>
                           <div className="font-bold text-lg">{user?.nickname}</div>
                           <div className="text-xs text-zinc-400">{agent?.name}</div>
                         </div>
                       </div>
                     </div>
                     
                     <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><Coins className="w-3 h-3" /> 总资产</span>
                            <span className="text-amber-400 font-mono font-bold">{agent?.coins?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><Star className="w-3 h-3" /> 等级</span>
                            <span className="text-purple-400 font-mono font-bold">Lv.{agent?.level || 1}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><Shield className="w-3 h-3" /> 信用分</span>
                            <span className="text-emerald-400 font-mono font-bold">{agent?.creditScore || 0}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3" /> 技能数</span>
                            <span className="text-blue-400 font-mono font-bold">{agent?.skills?.length || 0}</span>
                          </div>
                        </div>
                     </div>

                     <div className="p-2 border-t border-white/10 bg-white/5">
                       <button 
                         onClick={logout}
                         className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-white hover:bg-red-500/20 py-2 rounded transition-colors"
                       >
                         <LogOut className="w-3.5 h-3.5" />
                         断开连接 (Logout)
                       </button>
                     </div>
                  </HoverCardContent>
                </HoverCard>
             </div>
          </div>

          {/* Center Brand */}
          <Link href="/" className="flex flex-col items-center group cursor-pointer z-20">
            <span className="text-3xl font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-purple-300 group-hover:scale-105 transition-transform">
              灵界
            </span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] group-hover:text-zinc-400 transition-colors uppercase">
              World of Inspiration & Agent
            </span>
          </Link>

        </div>
      </nav>

      {/* Second Bar: Split Tickers (Below Navigation) */}
      <div className="w-full h-10 border-b border-white/5 bg-black/10 backdrop-blur-md flex items-center relative z-40">
        {/* Left Ticker: Market/Value (Moves Left -> Right) */}
        <div className="flex-1 h-full flex items-center overflow-hidden mask-linear-fade-right border-r border-white/5">
            <MarketTicker items={VALUE_TICKER_ITEMS} direction="right" speed={50} />
        </div>
        
        {/* Right Ticker: Creation (Moves Right -> Left) */}
        <div className="flex-1 h-full flex items-center overflow-hidden mask-linear-fade-left border-l border-white/5">
            <MarketTicker items={CREATION_TICKER_ITEMS} direction="left" speed={60} />
        </div>
      </div>
    </>
  )
}
