'use client'

import { useState, useEffect } from 'react'
import { Building2, ChevronRight, Star } from 'lucide-react'
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

      // 并发加载所有组织的项目
      await Promise.all(
        organizations.map(async (org) => {
          const result = await getOrganizationProjects(org.organization_id)
          if (!result.error && result.data) {
            projectsData[org.organization_id] = result.data
          } else {
            projectsData[org.organization_id] = []
          }
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {organizations.map((org) => {
        const projects = orgProjects[org.organization_id] || []
        const activeProjects = projects.filter(p => p.status === 'active').length
        const completedProjects = projects.filter(p => p.status === 'completed').length

        return (
          <div
            key={org.id}
            onClick={() => onSelect(org.organization_id)}
            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden"
          >
            {/* 卡片头部 - 蓝色渐变 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-100 transition-colors">
                  {org.organization?.name || '未命名组织'}
                </h3>
                <p className="text-blue-100 text-sm line-clamp-2 opacity-90">
                  {org.organization?.description || '暂无描述'}
                </p>
              </div>
            </div>

            {/* 卡片内容 */}
            <div className="p-6">
              {/* 统计数据 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {loadingProjects ? '-' : activeProjects}
                  </div>
                  <div className="text-sm text-gray-600">
                    进行中项目
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {loadingProjects ? '-' : completedProjects}
                  </div>
                  <div className="text-sm text-gray-600">
                    已完成项目
                  </div>
                </div>
              </div>

              {/* 最新项目列表 */}
              {!loadingProjects && projects.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                    最新项目
                  </p>
                  <div className="space-y-2">
                    {projects.slice(0, 2).map((project) => (
                      <div key={project.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          project.status === 'active' ? 'bg-green-500' :
                          project.status === 'completed' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {project.name}
                        </span>
                        {project.is_recruiting && (
                          <Star className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    ))}
                    {projects.length > 2 && (
                      <p className="text-xs text-gray-500 italic text-center pt-1">
                        +{projects.length - 2} 个更多项目
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 进入工作台按钮 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="bg-blue-50 rounded-lg p-3 text-center group-hover:bg-blue-100 transition-colors">
                  <span className="text-sm font-medium text-blue-700">
                    点击进入 {org.organization?.name || '组织'} 工作台
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
