import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadUnreadCount = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setUnreadCount(0)
        setLoading(false)
        return
      }

      let totalCount = 0

      // 1. 未读通知
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      totalCount += notifCount || 0

      // 2. 用户管理的组织的待处理申请
      const { data: managedOrgs } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role_in_org', ['admin', 'owner'])

      if (managedOrgs && managedOrgs.length > 0) {
        const orgIds = managedOrgs.map(o => o.organization_id)
        const { count: orgRequestsCount } = await supabase
          .from('organization_join_requests')
          .select('*', { count: 'exact', head: true })
          .in('organization_id', orgIds)
          .eq('status', 'pending')

        totalCount += orgRequestsCount || 0
      }

      // 3. 用户管理的项目的待处理申请
      const { data: managedProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)
        .in('role_in_project', ['owner', 'manager'])

      if (managedProjects && managedProjects.length > 0) {
        const projectIds = managedProjects.map(p => p.project_id)
        const { count: projectRequestsCount } = await supabase
          .from('project_join_requests')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('status', 'pending')

        totalCount += projectRequestsCount || 0
      }

      // 4. 收到的待处理邀请
      const { count: invitationsCount } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .or(`invitee_id.eq.${user.id},invitee_email.eq.${user.email}`)

      totalCount += invitationsCount || 0

      setUnreadCount(totalCount)
    } catch (err) {
      console.error('加载未读数量失败:', err)
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
