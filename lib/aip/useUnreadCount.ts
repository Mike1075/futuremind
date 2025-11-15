import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadUnreadCount = async () => {
    try {
      console.time('[未读计数] 总耗时')
      setLoading(true)
      const supabase = createClient()

      console.time('[未读计数] 获取用户')
      const { data: { user } } = await supabase.auth.getUser()
      console.timeEnd('[未读计数] 获取用户')

      if (!user) {
        setUnreadCount(0)
        setLoading(false)
        console.timeEnd('[未读计数] 总耗时')
        return
      }

      // 只查询 notifications 表（其他表暂时禁用，因为RLS权限问题）
      console.time('[未读计数] 查询通知')
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      console.timeEnd('[未读计数] 查询通知')

      const totalCount = notifCount || 0

      setUnreadCount(totalCount)

      // 保存到缓存
      localStorage.setItem('unreadCount', JSON.stringify({
        count: totalCount,
        timestamp: Date.now()
      }))

      console.log('[未读计数] 最终计数:', totalCount)
      console.timeEnd('[未读计数] 总耗时')
    } catch (err) {
      console.error('加载未读数量失败:', err)
      setUnreadCount(0)
      console.timeEnd('[未读计数] 总耗时')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 先尝试从缓存加载
    const cached = localStorage.getItem('unreadCount')
    if (cached) {
      const { count, timestamp } = JSON.parse(cached)
      // 如果缓存在5分钟内，直接使用
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        setUnreadCount(count)
        setLoading(false)
        console.log('[未读计数] 使用缓存:', count)
      }
    }

    // 然后异步加载最新数据
    loadUnreadCount()

    // 每30秒刷新一次
    const interval = setInterval(loadUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  const refresh = () => {
    loadUnreadCount()
  }

  return {
    unreadCount,
    loading,
    refresh
  }
}
