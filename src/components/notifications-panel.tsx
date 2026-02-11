'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, Package, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/database'

interface Notification {
  id: string
  type: 'task' | 'trade' | 'system' | 'review'
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

export function NotificationsPanel() {
  const { isAuthenticated, user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isTableExists, setIsTableExists] = useState<boolean | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const checkTableAndFetch = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id')
          .limit(1)

        if (error && error.code === 'PGRST116') {
          setIsTableExists(false)
          return
        }

        setIsTableExists(true)
        await fetchNotifications()
      } catch (error) {
        console.error('Error checking table:', error)
        setIsTableExists(false)
      }
    }

    checkTableAndFetch()
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !isTableExists) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        console.log('New notification:', payload)
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, user?.id, isTableExists])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        if (error.code === 'PGRST116') {
          setIsTableExists(false)
        }
        console.warn('Failed to fetch notifications:', error)
        return
      }

      const notifs = data as Notification[]
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!isTableExists) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Failed to mark notification as read:', error)
        return
      }

      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!isTableExists) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) {
        console.error('Failed to mark all as read:', error)
        return
      }

      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!isTableExists) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Failed to delete notification:', error)
        return
      }

      setNotifications(notifications.filter(n => n.id !== notificationId))
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Package className="w-4 h-4 text-purple-400" />
      case 'trade':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />
      case 'review':
        return <MessageSquare className="w-4 h-4 text-blue-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-amber-400" />
    }
  }

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'trade':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'review':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      window.location.href = notification.link
    }
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!isAuthenticated || !isTableExists) return null

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-zinc-400" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-2 border-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">通知</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={markAllAsRead}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  全部已读
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">暂无通知</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getNotificationTypeColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white line-clamp-1">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mb-1">
                          {formatTime(notification.created_at)}
                        </p>
                        <p className="text-sm text-zinc-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3 text-zinc-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
