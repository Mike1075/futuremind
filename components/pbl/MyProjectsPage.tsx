// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react'
import {
  FolderOpen, Plus, Calendar, Users, Clock,
  CheckCircle, BookOpen, Eye, Settings, Mail, Trash2
} from 'lucide-react'
import { PBLProject } from '@/lib/pbl-data'
import { pblDataService } from '@/lib/pbl-real-data'
import { ProjectDetailModal } from './ProjectDetailModal'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface MyProjectsPageProps {
  user: any
  isGuest: boolean
  onProjectSelect: (projectId: string) => void
}

export function MyProjectsPage({ user, isGuest, onProjectSelect }: MyProjectsPageProps) {
  const toast = useToast()
  const { confirm } = useConfirm()
  const [projects, setProjects] = useState<PBLProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<PBLProject | null>(null)
  const [showProjectDetail, setShowProjectDetail] = useState(false)

  useEffect(() => {
    loadMyProjects()
  }, [])

  const loadMyProjects = async () => {
    try {
      setLoading(true)
      // 加载所有项目（模拟用户项目）
      const allProjects = await pblDataService.getProjects()
      setProjects(isGuest ? allProjects.slice(0, 6) : allProjects)
    } catch (error) {
      console.error('加载项目失败:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (project: PBLProject) => {
    setSelectedProject(project)
    setShowProjectDetail(true)
  }

  const handleDeleteProject = async (project: PBLProject) => {
    const confirmed = await confirm({
      title: '确认删除',
      message: `确定要删除项目"${project.title}"吗？`,
      type: 'warning'
    })

    if (confirmed) {
      setProjects(prev => prev.filter(p => p.id !== project.id))
      setShowProjectDetail(false)
      toast.success(`项目"${project.title}"已删除`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/30 border-green-700'
      case 'completed': return 'text-blue-400 bg-blue-900/30 border-blue-700'
      case 'paused': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700'
      case 'recruiting': return 'text-purple-400 bg-purple-900/30 border-purple-700'
      default: return 'text-cosmic-400 bg-cosmic-800/30 border-cosmic-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '进行中'
      case 'completed': return '已完成'
      case 'paused': return '已暂停'
      case 'recruiting': return '招募中'
      default: return status
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-900/30'
      case 'intermediate': return 'text-yellow-400 bg-yellow-900/30'
      case 'advanced': return 'text-red-400 bg-red-900/30'
      case 'expert': return 'text-purple-400 bg-purple-900/30'
      default: return 'text-cosmic-400 bg-cosmic-800/30'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初学者'
      case 'intermediate': return '中级'
      case 'advanced': return '高级'
      case 'expert': return '专家'
      default: return difficulty
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* 游客模式提示 */}
        {isGuest && (
          <div className="mb-6 bg-gradient-to-r from-primary-600/20 to-resonance-600/20 border border-primary-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center mr-3">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">游客模式体验</h3>
                  <p className="text-cosmic-300 text-sm">您正在以游客身份浏览，注册后可创建和管理自己的项目</p>
                </div>
              </div>
              <button
                onClick={() => toast.info('注册功能开发中...')}
                className="bg-gradient-cosmic text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all text-sm"
              >
                立即注册
              </button>
            </div>
          </div>
        )}

        {/* 页面标题和操作按钮 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <BookOpen className="w-8 h-8 mr-3 text-primary-400" />
                {isGuest ? '项目展示' : '我的项目'}
              </h1>
              <p className="text-cosmic-300">
                {isGuest ? '探索精彩的PBL项目，发现学习的无限可能' : '管理您的项目、任务和学习进度'}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.info('发送邀请功能开发中...')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-all"
              >
                <Mail className="w-5 h-5" />
                发送邀请
              </button>

              <button
                onClick={() => toast.info('创建项目功能开发中...')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-cosmic text-white rounded-lg hover:opacity-90 transition-all"
              >
                <Plus className="w-5 h-5" />
                创建项目
              </button>
            </div>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cosmic-400">总项目数</p>
                <p className="text-2xl font-bold text-white">{projects.length}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-primary-400" />
            </div>
          </div>

          <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cosmic-400">活跃项目</p>
                <p className="text-2xl font-bold text-white">{projects.filter(p => p.status === 'active').length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cosmic-400">已完成</p>
                <p className="text-2xl font-bold text-white">{projects.filter(p => p.status === 'completed').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cosmic-400">参与者</p>
                <p className="text-2xl font-bold text-white">{projects.reduce((sum, p) => sum + (p.current_participants || 0), 0)}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* 项目列表 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FolderOpen className="w-5 h-5 mr-2 text-primary-400" />
              {isGuest ? '精选项目' : '我的项目'} ({projects.length})
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto text-cosmic-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {isGuest ? '暂无项目展示' : '还没有项目'}
              </h3>
              <p className="text-cosmic-400 mb-6">
                {isGuest ? '项目数据加载中，请稍后再试' : '创建您的第一个项目开始学习之旅'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg border border-cosmic-700 hover:border-primary-500/50 transition-all duration-300 overflow-hidden group cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-300 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-cosmic-300 text-sm mb-3 line-clamp-2">{project.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </div>

                    {/* 项目标签 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(project.difficulty_level)}`}>
                        {getDifficultyText(project.difficulty_level)}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-cosmic-300 bg-cosmic-700/50">
                        {project.category}
                      </span>
                    </div>

                    {/* 项目统计 */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">{project.current_participants || 0}</div>
                        <div className="text-xs text-cosmic-400">参与者</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary-400">{project.duration_weeks || 0}</div>
                        <div className="text-xs text-cosmic-400">周</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-400">{Math.floor(Math.random() * 80) + 20}%</div>
                        <div className="text-xs text-cosmic-400">完成度</div>
                      </div>
                    </div>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between pt-4 border-t border-cosmic-700">
                      <div className="flex items-center text-sm text-cosmic-400">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-cosmic-400 hover:text-primary-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProjectClick(project)
                          }}
                          title="查看项目详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-cosmic-400 hover:text-red-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProject(project)
                          }}
                          title="删除项目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 项目详情模态框 */}
      <ProjectDetailModal
        isOpen={showProjectDetail}
        onClose={() => {
          setShowProjectDetail(false)
          setSelectedProject(null)
        }}
        project={selectedProject}
        onDelete={handleDeleteProject}
      />
    </div>
  )
}
