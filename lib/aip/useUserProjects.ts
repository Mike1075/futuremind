import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProject {
  id: string
  name: string
  description?: string
  organization_id: string
  organization_name?: string
}

export function useUserProjects(organizationId?: string) {
  const [projects, setProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [organizationId])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setProjects([])
        return
      }

      // 获取用户参与的所有项目ID
      const { data: memberships } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)

      const projectIds = memberships?.map(m => m.project_id) || []

      if (projectIds.length === 0) {
        setProjects([])
        return
      }

      // 查询项目详情和组织信息
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          organization_id,
          organization:organizations(name)
        `)
        .in('id', projectIds)

      // 如果指定了组织，只返回该组织的项目
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      const userProjects: UserProject[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        organization_id: p.organization_id,
        organization_name: p.organization?.name
      }))

      setProjects(userProjects)
    } catch (error) {
      console.error('加载用户项目失败:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  return {
    projects,
    loading,
    reload: loadProjects
  }
}
