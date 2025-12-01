// @ts-nocheck
"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ProjectExplorer } from './ProjectExplorer'
import { ProjectDetailModal } from './ProjectDetailModal'
import { MyProjectsPage } from './MyProjectsPage'
import { CommunityPage } from './CommunityPage'
import { UserProfile } from './UserProfile'
import GaiaDialog from '@/components/GaiaDialog'
import { PBLProject, pblDataService } from '@/lib/pbl-data'
import { createClient } from '@/lib/supabase/client'
import {
  Compass,
  BookOpen,
  Users,
  Sparkles,
  LogOut,
  User,
  Home,
  MessageCircle
} from 'lucide-react'

type ViewType = 'explore' | 'my-projects' | 'community' | 'profile'

// PF-10: 合并相关状态的类型定义
interface UserState {
  data: {
    name: string
    email: string
    consciousness_level: number
  } | null
  isGuest: boolean
  loading: boolean
}

interface ModalState {
  projectDetail: boolean
  gaiaDialog: boolean
}

// PF-10: 默认用户状态
const GUEST_USER = {
  name: '匿名探索者',
  email: 'guest@pbl.local',
  consciousness_level: 0
}

export function MainDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('explore')
  const [selectedProject, setSelectedProject] = useState<PBLProject | null>(null)

  // PF-10: 合并模态框状态
  const [modals, setModals] = useState<ModalState>({
    projectDetail: false,
    gaiaDialog: false
  })

  // PF-10: 合并用户相关状态
  const [userState, setUserState] = useState<UserState>({
    data: null,
    isGuest: true,
    loading: true
  })

  // 检查认证状态
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        setUserState({
          data: {
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '探索者',
            email: authUser.email || '',
            consciousness_level: authUser.user_metadata?.consciousness_level || 0
          },
          isGuest: false,
          loading: false
        })
      } else {
        setUserState({
          data: GUEST_USER,
          isGuest: true,
          loading: false
        })
      }
    } catch {
      // 静默处理错误，使用访客模式
      setUserState({
        data: GUEST_USER,
        isGuest: true,
        loading: false
      })
    }
  }

  // PF-10: 使用useCallback优化回调
  const handleProjectSelect = useCallback(async (projectId: string) => {
    try {
      const project = await pblDataService.getProjectById(projectId)
      setSelectedProject(project)
      setModals(prev => ({ ...prev, projectDetail: true }))
    } catch {
      // 静默处理错误
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch {
      // 静默处理错误
    }
  }, [])

  const handleDeleteProject = useCallback(() => {
    // TODO: 实现实际的删除逻辑
    setModals(prev => ({ ...prev, projectDetail: false }))
  }, [])

  const renderContent = () => {
    switch (currentView) {
      case 'explore':
        return <ProjectExplorer onProjectSelect={handleProjectSelect} />
      case 'my-projects':
        return (
          <MyProjectsPage
            user={userState.data}
            isGuest={userState.isGuest}
            onProjectSelect={handleProjectSelect}
          />
        )
      case 'community':
        return <CommunityPage isGuest={userState.isGuest} />
      case 'profile':
        return <UserProfile user={userState.data} isGuest={userState.isGuest} />
      default:
        return <ProjectExplorer onProjectSelect={handleProjectSelect} />
    }
  }

  if (userState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* 侧边栏 */}
      <div className="w-64 bg-cosmic-800/50 backdrop-blur-sm border-r border-cosmic-700">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center mr-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-cosmic">探索者联盟</h1>
              <p className="text-xs text-cosmic-400">PBL学习平台</p>
            </div>
          </div>

          {/* 返回主页按钮 */}
          <Link
            href="/"
            className="w-full flex items-center px-4 py-3 rounded-lg text-cosmic-300 hover:bg-cosmic-700/50 hover:text-white transition-colors mb-6 border border-cosmic-700"
          >
            <Home className="w-5 h-5 mr-3" />
            返回主页
          </Link>

          {/* 用户信息 */}
          <div className="mb-8 p-4 bg-cosmic-700/30 rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userState.data?.name || '探索者'}
                </p>
                <p className="text-xs text-cosmic-400 truncate">
                  {userState.isGuest ? '游客模式' : userState.data?.email}
                </p>
              </div>
            </div>
            {userState.data?.consciousness_level !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-cosmic-400 mb-1">
                  <span>意识等级</span>
                  <span>Lv.{userState.data.consciousness_level}</span>
                </div>
                <div className="w-full bg-cosmic-800 rounded-full h-2">
                  <div
                    className="bg-gradient-cosmic h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(userState.data.consciousness_level * 20, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* 导航菜单 */}
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView('explore')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                currentView === 'explore'
                  ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                  : 'text-cosmic-300 hover:bg-cosmic-700/50 hover:text-white'
              }`}
            >
              <Compass className="w-5 h-5 mr-3" />
              探索项目
            </button>

            <button
              onClick={() => setCurrentView('my-projects')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                currentView === 'my-projects'
                  ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                  : 'text-cosmic-300 hover:bg-cosmic-700/50 hover:text-white'
              }`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              我的项目
            </button>

            <button
              onClick={() => setCurrentView('community')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                currentView === 'community'
                  ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                  : 'text-cosmic-300 hover:bg-cosmic-700/50 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              社区
            </button>

            <button
              onClick={() => setCurrentView('profile')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                currentView === 'profile'
                  ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                  : 'text-cosmic-300 hover:bg-cosmic-700/50 hover:text-white'
              }`}
            >
              <User className="w-5 h-5 mr-3" />
              个人资料
            </button>
          </nav>

          {/* 登出按钮 */}
          <div className="mt-8 pt-4 border-t border-cosmic-700">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-3 rounded-lg text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {userState.isGuest ? '退出游客模式' : '退出登录'}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* 塞娅AI助手 - 浮动按钮 */}
      <button
        onClick={() => setModals(prev => ({ ...prev, gaiaDialog: true }))}
        className="fixed bottom-8 right-8 w-16 h-16 btn-stardust rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
        aria-label="打开塞娅对话"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </button>

      {/* 塞娅对话框 */}
      <GaiaDialog
        isOpen={modals.gaiaDialog}
        onClose={() => setModals(prev => ({ ...prev, gaiaDialog: false }))}
      />

      {/* 项目详情模态框 */}
      <ProjectDetailModal
        isOpen={modals.projectDetail}
        onClose={() => setModals(prev => ({ ...prev, projectDetail: false }))}
        project={selectedProject}
        onDelete={handleDeleteProject}
      />
    </div>
  )
}
