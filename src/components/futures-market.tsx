'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockFuturesContracts, mockFuturesOrders, calculatePnL, calculatePnLPercent } from '@/lib/futures-data'
import type { FuturesContract } from '@/lib/futures-data'
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, Target } from 'lucide-react'

export function FuturesMarket() {
  const [contracts, setContracts] = useState(mockFuturesContracts)
  const [orders, setOrders] = useState(mockFuturesOrders)
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'trade'>('positions')

  // 模拟价格更新
  const updatePrices = () => {
    setContracts(prev => prev.map(contract => {
      const priceChange = (Math.random() - 0.5) * 100
      const newPrice = Math.max(100, contract.current_price + priceChange)
      return { ...contract, current_price: Math.round(newPrice) }
    }))
  }

  // 每5秒更新一次价格
  useState(() => {
    const interval = setInterval(updatePrices, 5000)
    return () => clearInterval(interval)
  })

  const totalPnL = contracts.reduce((sum, c) => sum + calculatePnL(c), 0)
  const totalMargin = contracts.reduce((sum, c) => sum + c.margin, 0)

  return (
    <div className="space-y-6">
      {/* 期货统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{contracts.length}</p>
                <p className="text-xs text-zinc-500">持仓数量</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalMargin.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">保证金</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {totalPnL >= 0 ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">未实现盈亏</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
                <p className="text-xs text-zinc-500">挂单数量</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 选项卡 */}
      <div className="flex gap-2 border-b border-white/10">
        <Button
          variant={activeTab === 'positions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('positions')}
        >
          我的持仓
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('orders')}
        >
          挂单
        </Button>
        <Button
          variant={activeTab === 'trade' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('trade')}
        >
          交易
        </Button>
      </div>

      {/* 持仓列表 */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          {contracts.map(contract => {
            const pnl = calculatePnL(contract)
            const pnlPercent = calculatePnLPercent(contract)
            const isProfit = pnl >= 0

            const daysToExpiry = Math.ceil((contract.expiry_date - Date.now()) / (1000 * 60 * 60 * 24))

            return (
              <Card key={contract.id} className="hover:border-purple-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{contract.skill_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={contract.contract_type === 'long' ? 'category' : 'default'}>
                          {contract.contract_type === 'long' ? '做多' : '做空'}
                        </Badge>
                        <Badge variant="default">{contract.leverage}x 杠杆</Badge>
                        <span className="text-sm text-zinc-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {daysToExpiry}天后到期
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        💰 {contract.current_price.toLocaleString()}
                      </p>
                      <p className="text-sm text-zinc-500">
                        开仓: {contract.strike_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">数量</p>
                      <p className="text-lg font-semibold text-white">{contract.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">保证金</p>
                      <p className="text-lg font-semibold text-white">{contract.margin.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">未实现盈亏</p>
                      <p className={`text-lg font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : ''}{pnl.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">盈亏比例</p>
                      <p className={`text-lg font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {pnlPercent < -50 && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">警告：接近清算线</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      加仓
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      减仓
                    </Button>
                    <Button size="sm" variant="danger" className="flex-1">
                      平仓
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {contracts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-500">暂无持仓</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 挂单列表 */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{order.skill_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={order.type === 'long' ? 'category' : 'default'}>
                        {order.type === 'long' ? '做多' : '做空'}
                      </Badge>
                      <Badge variant="default">{order.leverage}x</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{order.price.toLocaleString()}</p>
                    <p className="text-sm text-zinc-500">数量: {order.quantity}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    编辑
                  </Button>
                  <Button size="sm" variant="danger" className="flex-1">
                    撤单
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 交易面板 */}
      {activeTab === 'trade' && (
        <Card>
          <CardHeader>
            <CardTitle>创建期货合约</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">技能</label>
                <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50">
                  <option>Python 编程大师</option>
                  <option>UI 设计灵感</option>
                  <option>技术写作</option>
                  <option>数据分析技能</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">方向</label>
                  <div className="flex gap-2">
                    <Button variant={true ? 'default' : 'outline'} className="flex-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      做多
                    </Button>
                    <Button variant={false ? 'default' : 'outline'} className="flex-1">
                      <TrendingDown className="w-4 h-4 mr-1" />
                      做空
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">杠杆</label>
                  <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50">
                    <option>2x</option>
                    <option>3x</option>
                    <option>5x</option>
                    <option>10x</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-1 block">数量</label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-1 block">到期时间</label>
                <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50">
                  <option>3 天</option>
                  <option>7 天</option>
                  <option>14 天</option>
                  <option>30 天</option>
                </select>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">开仓价格</span>
                  <span className="text-white">5,000</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">合约价值</span>
                  <span className="text-white">50,000</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">杠杆倍数</span>
                  <span className="text-white">2x</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-zinc-400">所需保证金</span>
                  <span className="text-amber-400 font-semibold">25,000</span>
                </div>
              </div>

              <Button className="w-full" size="lg">
                开仓
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
