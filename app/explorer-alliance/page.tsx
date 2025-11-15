'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Building2, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOrganizations } from '@/lib/aip/hooks'
import { OrganizationList } from '@/components/aip/OrganizationList'
import { FloatingChatBot } from '@/components/aip/FloatingChatBot'
import { CreateOrganizationModal } from '@/components/aip/CreateOrganizationModal'
import { NotificationBadge } from '@/components/aip/NotificationBadge'
import { InteractionLog } from '@/components/aip/InteractionLog'
import { createClient } from '@/lib/supabase/client'

export default function ExplorerAlliancePage() {
  const router = useRouter()
  const { organizations, loading: orgsLoading, reload: reloadOrganizations } = useOrganizations()
  const [showCreateOrganization, setShowCreateOrganization] = useState(false)
  const [showInteractionLog, setShowInteractionLog] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // 确保只在客户端渲染并检查权限
  useEffect(() => {
    console.time('[探索者联盟] 页面总加载时间')
    setIsMounted(true)
    checkAdminStatus()
  }, [])

  // 检查管理员权限
  const checkAdminStatus = async () => {
    console.time('[探索者联盟] 检查管理员权限')
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
      // 静默失败，不影响页面加载
      setIsAdmin(false)
    }
    console.timeEnd('[探索者联盟] 检查管理员权限')
  }

  // 监听加载状态变化，加载完成时打印总时间
  useEffect(() => {
    if (!orgsLoading && isMounted) {
      console.timeEnd('[探索者联盟] 页面总加载时间')
    }
  }, [orgsLoading, isMounted])


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
    <div className="min-h-screen text-white relative overflow-hidden bg-black">
      {/* 星空背景 - 纯黑色背景 + 白色星星闪烁 */}
      <div className="absolute inset-0 overflow-hidden">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                探索者联盟 - AIP项目管理系统
              </h1>
              <p className="text-gray-400 mt-2">AI驱动的智能项目协作平台</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBadge onClick={() => setShowInteractionLog(true)} />
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              >
                <Home className="w-5 h-5" />
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-12 z-10 max-w-7xl">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">
            我的组织
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            管理你所属的组织，选择组织进入对应的工作台
          </p>
        </div>

        {/* 创建组织按钮 - 仅管理员可见 */}
        {isAdmin && organizations.length > 0 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowCreateOrganization(true)}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              创建新组织
            </button>
          </div>
        )}

        {orgsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-20 w-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">
              还没有加入任何组织
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              系统应该自动为您创建"社区项目"和"我的项目"两个默认组织
            </p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/aip/debug-orgs', { method: 'POST' })
                    const data = await response.json()
                    if (data.success) {
                      alert('组织数据已修复！正在刷新...')
                      reloadOrganizations()
                    } else {
                      alert('修复失败：' + (data.error || '未知错误'))
                    }
                  } catch (error) {
                    alert('修复失败，请联系管理员')
                    console.error(error)
                  }
                }}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                🔧 修复组织数据
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateOrganization(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  或者创建新组织
                </button>
              )}
            </div>
          </div>
        ) : (
          <OrganizationList
            organizations={organizations}
            onSelect={(orgId) => {
              router.push(`/explorer-alliance/organizations/${orgId}`)
            }}
          />
        )}
      </div>

      {/* 聊天机器人 */}
      <FloatingChatBot showProjectSelector={true} />

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

      {/* 消息盒子 */}
      {showInteractionLog && (
        <InteractionLog
          onClose={() => setShowInteractionLog(false)}
          onUnreadCountChange={() => {
            // 可以在这里添加刷新未读计数的逻辑
          }}
        />
      )}
    </div>
  )
}
