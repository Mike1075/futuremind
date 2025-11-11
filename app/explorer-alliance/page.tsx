'use client'

import { useState } from 'react'
import { useOrganizations, useOrganizationProjects } from '@/lib/aip/hooks'
import { OrganizationList } from '@/components/aip/OrganizationList'
import { ProjectList } from '@/components/aip/ProjectList'
import { ChatBot } from '@/components/aip/ChatBot'
import { CreateProjectModal } from '@/components/aip/CreateProjectModal'

export default function ExplorerAlliancePage() {
  const { organizations, loading: orgsLoading } = useOrganizations()
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const { projects, loading: projectsLoading, reload: reloadProjects } = useOrganizationProjects(selectedOrgId)

  // 自动选择第一个组织
  if (!selectedOrgId && organizations.length > 0) {
    setSelectedOrgId(organizations[0].organization_id)
  }

  const selectedOrg = organizations.find(o => o.organization_id === selectedOrgId)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            探索者联盟 - AIP项目管理系统
          </h1>
          <p className="text-gray-400 mt-2">AI驱动的智能项目协作平台</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {orgsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左侧：组织列表 */}
            <div className="lg:col-span-1">
              <OrganizationList
                organizations={organizations}
                selectedId={selectedOrgId}
                onSelect={setSelectedOrgId}
              />
            </div>

            {/* 右侧：项目列表 */}
            <div className="lg:col-span-3">
              {selectedOrgId && selectedOrg ? (
                <div>
                  {/* 组织信息和操作栏 */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedOrg.organization?.name}</h2>
                      {selectedOrg.organization?.description && (
                        <p className="text-gray-400 mt-1">{selectedOrg.organization.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCreateProject(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity duration-200"
                    >
                      + 创建项目
                    </button>
                  </div>

                  {/* 项目列表 */}
                  <ProjectList
                    projects={projects}
                    loading={projectsLoading}
                    organizationId={selectedOrgId}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-black/30 rounded-xl border border-white/10">
                  <p className="text-gray-400">请选择一个组织查看项目</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 聊天机器人 */}
      <ChatBot />

      {/* 创建项目弹窗 */}
      {showCreateProject && selectedOrgId && (
        <CreateProjectModal
          organizationId={selectedOrgId}
          onClose={() => setShowCreateProject(false)}
          onSuccess={() => {
            setShowCreateProject(false)
            reloadProjects()
          }}
        />
      )}
    </div>
  )
}
