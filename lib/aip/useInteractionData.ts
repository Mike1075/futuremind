// @ts-nocheck
/**
 * 交互数据加载 Hook
 * 处理通知和项目申请的加载、订阅和刷新
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { triggerUnreadCountRefresh } from '@/lib/aip/useUnreadCount'
import type { UnifiedInteraction } from './notification-helpers'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  metadata: any
  is_read: boolean
  created_at: string
}

export function useInteractionData() {
  const [interactions, setInteractions] = useState<UnifiedInteraction[]>([])
  const [loading, setLoading] = useState(true)

  const loadInteractions = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const allInteractions: UnifiedInteraction[] = []

      // 1. 加载notifications（排除项目申请类通知，因为会从 project_join_requests 单独加载）
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!notifError && notifications) {
        notifications.forEach((notif: Notification) => {
          // 跳过项目申请相关的通知，因为 project_join_requests 表已经有完整数据
          if (notif.type === 'project_request_received' || notif.type === 'join_request_received') {
            return
          }
          allInteractions.push({
            id: notif.id,
            interactionType: 'notification',
            title: notif.title,
            message: notif.message,
            status: notif.is_read ? 'read' : 'unread',
            created_at: notif.created_at,
            metadata: notif.metadata,
            originalRequest: notif
          })
        })
      }

      // 2. 加载用户管理的项目的加入申请
      const { data: projectMembers } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)
        .in('role_in_project', ['owner', 'manager'])

      const managedProjectIds = projectMembers?.map(pm => pm.project_id) || []

      if (managedProjectIds.length > 0) {
        const { data: projectRequests, error: reqError } = await supabase
          .from('project_join_requests')
          .select(`
            *,
            user:user_id(id, full_name, email),
            project:project_id(name)
          `)
          .in('project_id', managedProjectIds)
          .order('created_at', { ascending: false })

        if (!reqError && projectRequests) {
          projectRequests.forEach((req: any) => {
            const applicantName = req.user?.full_name || req.user?.email || '未知用户'
            const projectName = req.project?.name || '未知项目'

            allInteractions.push({
              id: req.id,
              interactionType: 'project_request',
              title: '加入项目申请',
              message: `${applicantName} 申请加入项目"${projectName}"`,
              status: req.status,
              created_at: req.created_at,
              metadata: {
                project_id: req.project_id,
                project_name: projectName,
                applicant_id: req.user_id,
                applicant_name: applicantName
              },
              applicantName,
              applicantEmail: req.user?.email || '',
              requestMessage: req.message,
              originalRequest: req
            })
          })
        }
      }

      // 按时间倒序排列
      allInteractions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setInteractions(allInteractions)
    } catch (error) {
      console.error('加载交互记录失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载和实时订阅
  useEffect(() => {
    loadInteractions()

    // 实时订阅通知更新
    const supabase = createClient()
    const channel = supabase
      .channel('inbox-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        setTimeout(() => {
          loadInteractions()
          triggerUnreadCountRefresh()
        }, 500)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_join_requests'
      }, () => {
        setTimeout(() => {
          loadInteractions()
          triggerUnreadCountRefresh()
        }, 500)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadInteractions])

  // 更新单个交互项的状态
  const updateInteraction = useCallback((id: string, updates: Partial<UnifiedInteraction>) => {
    setInteractions(prev =>
      prev.map(i => i.id === id ? { ...i, ...updates } : i)
    )
  }, [])

  // 删除交互项
  const removeInteraction = useCallback((id: string) => {
    setInteractions(prev => prev.filter(i => i.id !== id))
  }, [])

  // 批量删除交互项
  const removeInteractions = useCallback((ids: Set<string>) => {
    setInteractions(prev => prev.filter(i => !ids.has(i.id)))
  }, [])

  return {
    interactions,
    loading,
    loadInteractions,
    updateInteraction,
    removeInteraction,
    removeInteractions
  }
}
