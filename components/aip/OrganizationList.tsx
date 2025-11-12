'use client'

import { useState, useEffect } from 'react'
import { Building2, ChevronRight, Star, TrendingUp, CheckCircle2 } from 'lucide-react'
import { getOrganizationProjects } from '@/lib/aip/api'
import type { UserOrganization, Project } from '@/lib/aip/types'

interface OrganizationListProps {
  organizations: UserOrganization[]
  onSelect: (organizationId: string) => void
}

export function OrganizationList({ organizations, onSelect }: OrganizationListProps) {
  const [orgProjects, setOrgProjects] = useState<Record<string, Project[]>>({})
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    loadAllOrganizationProjects()
  }, [organizations])

  const loadAllOrganizationProjects = async () => {
    setLoadingProjects(true)
    try {
      const projectsData: Record<string, Project[]> = {}
      const supabase = (await import('@/lib/supabase/client')).createClient()

      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoadingProjects(false)
        return
      }

      // 并发加载所有组织的项目（用户创建的或参与的项目）
      await Promise.all(
        organizations.map(async (org) => {
          // 1. 获取用户创建的项目
          const { data: createdProjects } = await supabase
            .from('projects')
            .select('*')
            .eq('organization_id', org.organization_id)
            .eq('creator_id', user.id)

          // 2. 获取用户参与的项目（通过project_members）
          const { data: memberships } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id)

          const memberProjectIds = memberships?.map(m => m.project_id) || []

          let memberProjects: any[] = []
          if (memberProjectIds.length > 0) {
            const { data } = await supabase
              .from('projects')
              .select('*')
              .eq('organization_id', org.organization_id)
              .in('id', memberProjectIds)
              .neq('creator_id', user.id) // 排除已经通过creator查询的项目

            memberProjects = data || []
          }

          // 3. 合并并去重
          const allProjects = [...(createdProjects || []), ...memberProjects]
          // 按创建时间倒序排列
          allProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          projectsData[org.organization_id] = allProjects
        })
      )

      setOrgProjects(projectsData)
    } catch (error) {
      console.error('加载组织项目失败:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map((org) => {
        const projects = orgProjects[org.organization_id] || []
        const activeProjects = projects.filter(p => p.status === 'active').length
        const completedProjects = projects.filter(p => p.status === 'completed').length
        const totalProjects = projects.length

        return (
          <div
            key={org.id}
            onClick={() => onSelect(org.organization_id)}
            className="group relative bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* 悬停光效 */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/0 via-zinc-800/0 to-zinc-800/0 group-hover:from-zinc-800/20 group-hover:via-zinc-800/10 group-hover:to-transparent transition-all duration-500" />

            {/* 卡片内容 */}
            <div className="relative p-6">
              {/* 头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
                    <Building2 className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition-colors line-clamp-1">
                      {org.organization?.name || '未命名组织'}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {totalProjects} 个项目
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>

              {/* 描述 */}
              <p className="text-sm text-zinc-400 line-clamp-2 mb-6 min-h-[2.5rem]">
                {org.organization?.description || '暂无描述'}
              </p>

              {/* 统计数据 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs text-zinc-500">进行中</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {loadingProjects ? '-' : activeProjects}
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-zinc-500">已完成</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {loadingProjects ? '-' : completedProjects}
                  </div>
                </div>
              </div>

              {/* 最新项目列表 */}
              {!loadingProjects && projects.length > 0 && (
                <div className="border-t border-zinc-800 pt-4 mb-4">
                  <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">
                    最新项目
                  </p>
                  <div className="space-y-2">
                    {projects.slice(0, 2).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-2.5 px-3 py-2 bg-zinc-800/30 rounded-lg border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          project.status === 'active' ? 'bg-emerald-500' :
                          project.status === 'completed' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="text-sm text-zinc-300 truncate flex-1">
                          {project.name}
                        </span>
                        {project.is_recruiting && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" />
                        )}
                      </div>
                    ))}
                    {projects.length > 2 && (
                      <p className="text-xs text-zinc-600 text-center pt-1">
                        +{projects.length - 2} 个更多项目
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 空状态 */}
              {!loadingProjects && projects.length === 0 && (
                <div className="border-t border-zinc-800 pt-4 mb-4">
                  <p className="text-sm text-zinc-600 text-center py-4">
                    暂无项目
                  </p>
                </div>
              )}

              {/* 进入工作台按钮 */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="bg-zinc-800/50 group-hover:bg-zinc-700/50 rounded-lg px-4 py-2.5 text-center transition-all border border-zinc-800 group-hover:border-zinc-600">
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                    进入工作台 →
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
