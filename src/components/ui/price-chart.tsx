'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { PricePoint } from '@/types'

interface PriceChartProps {
  data: PricePoint[]
  height?: number
}

export function PriceChart({ data, height = 100 }: PriceChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ height }} className="animate-pulse bg-white/5 rounded-lg" />
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp)
              return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
            }}
            stroke="rgba(255,255,255,0.3)"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value) => `💰 ${value}`}
            stroke="rgba(255,255,255,0.3)"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
            labelFormatter={(timestamp) => {
              const date = new Date(timestamp)
              return date.toLocaleTimeString()
            }}
            formatter={(value) => [`💰 ${value || 0}`, '价格']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="url(#gradient)"
            strokeWidth={2}
            dot={false}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
