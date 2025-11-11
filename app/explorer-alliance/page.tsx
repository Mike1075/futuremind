'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useOrganizations, useOrganizationProjects } from '@/lib/aip/hooks'
import { OrganizationList } from '@/components/aip/OrganizationList'
import { ProjectList } from '@/components/aip/ProjectList'
import { ChatBot } from '@/components/aip/ChatBot'
import { CreateProjectModal } from '@/components/aip/CreateProjectModal'
import { CreateOrganizationModal } from '@/components/aip/CreateOrganizationModal'
import { createClient } from '@/lib/supabase/client'

export default function ExplorerAlliancePage() {
  const { organizations, loading: orgsLoading, reload: reloadOrganizations } = useOrganizations()
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateOrganization, setShowCreateOrganization] = useState(false)
  const { projects, loading: projectsLoading, reload: reloadProjects } = useOrganizationProjects(selectedOrgId)
  const [isMounted, setIsMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // 确保只在客户端渲染并检查权限
  useEffect(() => {
    setIsMounted(true)
    checkAdminStatus()
  }, [])

  // 检查管理员权限
  const checkAdminStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const userRole = (profile as unknown as { role?: string })?.role
        setIsAdmin(userRole === 'principal' || userRole === 'teacher')
      }
    } catch (error) {
      console.error('检查管理员权限失败:', error)
    }
  }

  // 自动选择第一个组织
  if (!selectedOrgId && organizations.length > 0) {
    setSelectedOrgId(organizations[0].organization_id)
  }

  const selectedOrg = organizations.find(o => o.organization_id === selectedOrgId)

  // 生成固定的星空粒子配置
  const particles = useMemo(() => {
    if (!isMounted) return []
    return [...Array(50)].map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      duration: Math.random() * 3 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  }, [isMounted])

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* 星空背景 - 与首页保持一致 */}
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, particle.x],
              y: [0, particle.y],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>
      {/* Header */}
      <div className="relative border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            探索者联盟 - AIP项目管理系统
          </h1>
          <p className="text-gray-400 mt-2">AI驱动的智能项目协作平台</p>
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-8 z-10">
        {orgsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左侧：组织列表 */}
            <div className="lg:col-span-1 space-y-4">
              <OrganizationList
                organizations={organizations}
                selectedId={selectedOrgId}
                onSelect={setSelectedOrgId}
              />

              {/* 管理员创建组织按钮 */}
              {isAdmin && (
                <button
                  onClick={() => setShowCreateOrganization(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg text-purple-300 hover:bg-gradient-to-r hover:from-blue-500/30 hover:via-purple-500/30 hover:to-pink-500/30 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  创建新组织
                </button>
              )}
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

      {/* 创建组织弹窗（仅管理员） */}
      {showCreateOrganization && isAdmin && (
        <CreateOrganizationModal
          onClose={() => setShowCreateOrganization(false)}
          onSuccess={() => {
            setShowCreateOrganization(false)
            reloadOrganizations()
          }}
        />
      )}
    </div>
  )
}
