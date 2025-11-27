import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { playNotificationSound, isNotificationSoundEnabled } from '@/lib/utils/notificationSound'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const prevTotalCountRef = useRef<number | null>(null)

  const loadUnreadCount = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setUnreadCount(0)
        setPendingRequestCount(0)
        setLoading(false)
        return
      }

      // 1. 查询未读通知数量
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      // 2. 查询当前用户管理的项目的待审核申请数量
      // 首先获取用户管理的项目ID列表
      const { data: managedProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)
        .in('role_in_project', ['manager', 'owner'])

      let pendingCount = 0
      if (managedProjects && managedProjects.length > 0) {
        const projectIds = managedProjects.map(p => p.project_id)
        const { count } = await supabase
          .from('project_join_requests')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('status', 'pending')
        pendingCount = count || 0
      }

      const newTotalCount = (notifCount || 0) + pendingCount

      // 检测是否有新通知（数量增加），播放提示音
      if (prevTotalCountRef.current !== null && newTotalCount > prevTotalCountRef.current) {
        if (isNotificationSoundEnabled()) {
          playNotificationSound('notification')
        }
      }
      prevTotalCountRef.current = newTotalCount

      setUnreadCount(notifCount || 0)
      setPendingRequestCount(pendingCount)

      // 保存到缓存
      localStorage.setItem('unreadCount', JSON.stringify({
        count: newTotalCount,
        timestamp: Date.now()
      }))
    } catch (err) {
      console.error('加载未读数量失败:', err)
      setUnreadCount(0)
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

  // 总数 = 未读通知 + 待审核申请
  const totalCount = unreadCount + pendingRequestCount

  return {
    unreadCount,           // 未读通知数
    pendingRequestCount,   // 待审核申请数
    totalCount,            // 总数（用于显示徽章）
    loading,
    refresh
  }
}
