'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function SetupDatabasePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [tables, setTables] = useState<string[]>([])

  const setupDatabase = async () => {
    setStatus('loading')
    setMessage('正在设置数据库...')

    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage('数据库设置成功！')
        setTables(data.tables || [])
      } else {
        setStatus('error')
        setMessage(data.error || '设置失败')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || '网络错误')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-purple-400" />
            数据库设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400 text-sm">
            点击下面的按钮来自动创建 AgentCraft 所需的数据库表。
          </p>

          {status === 'idle' && (
            <Button onClick={setupDatabase} className="w-full" variant="default">
              <Database className="w-4 h-4 mr-2" />
              开始设置
            </Button>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <p className="text-zinc-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>{message}</span>
              </div>

              {tables.length > 0 && (
                <div>
                  <p className="text-sm text-zinc-400 mb-2">已创建的表：</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {tables.map(table => (
                      <div key={table} className="text-sm text-zinc-300 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        {table}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => window.location.href = '/'} className="w-full">
                前往首页
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-5 h-5" />
                <span>{message}</span>
              </div>
              <p className="text-xs text-zinc-500">
                请检查 DATABASE_URL 环境变量是否正确配置
              </p>
              <Button onClick={() => setStatus('idle')} variant="outline" className="w-full">
                重试
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
