// @ts-nocheck
"use client"

import React from 'react'
import { X, Calendar, Users, Clock, Target, CheckCircle, BookOpen, Tag, Trash2 } from 'lucide-react'
import { PBLProject } from '@/lib/pbl-data'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface ProjectDetailModalProps {
  isOpen: boolean
  onClose: () => void
  project: PBLProject | null
  onDelete?: (project: PBLProject) => void
}

export function ProjectDetailModal({ isOpen, onClose, project, onDelete }: ProjectDetailModalProps) {
  const toast = useToast()
  const { confirm } = useConfirm()

  if (!isOpen || !project) return null

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '确认删除',
      message: `确定要删除项目"${project.title}"吗？\n\n此操作不可撤销，项目的所有数据将被永久删除。`,
      type: 'warning'
    })

    if (confirmed && onDelete) {
      onDelete(project)
      onClose()
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

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'consciousness': return '意识探索'
      case 'science': return '科学研究'
      case 'creative': return '创意实践'
      case 'guidance': return '学习引导'
      default: return category
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-cosmic-900 rounded-2xl border border-cosmic-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        {/* 头部 */}
        <div className="p-6 border-b border-cosmic-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{project.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              <p className="text-cosmic-300">{project.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-cosmic-400 hover:text-white transition-colors rounded-lg hover:bg-cosmic-800 ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 项目信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-cosmic-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-lg font-semibold text-white">
                    {project.current_participants || 0}/{project.max_participants}
                  </div>
                  <div className="text-sm text-cosmic-400">参与者</div>
                </div>
              </div>
            </div>

            <div className="bg-cosmic-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-lg font-semibold text-white">{project.duration_weeks}</div>
                  <div className="text-sm text-cosmic-400">周期（周）</div>
                </div>
              </div>
            </div>

            <div className="bg-cosmic-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-lg font-semibold text-white">
                    {getDifficultyText(project.difficulty_level)}
                  </div>
                  <div className="text-sm text-cosmic-400">难度等级</div>
                </div>
              </div>
            </div>

            <div className="bg-cosmic-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-orange-400" />
                <div>
                  <div className="text-lg font-semibold text-white">
                    {getCategoryText(project.category)}
                  </div>
                  <div className="text-sm text-cosmic-400">项目分类</div>
                </div>
              </div>
            </div>
          </div>

          {/* 学习目标 */}
          {project.learning_objectives && project.learning_objectives.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary-400" />
                学习目标
              </h3>
              <div className="space-y-2">
                {project.learning_objectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-cosmic-800/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-cosmic-300">{objective}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 参与要求 */}
          {project.requirements && project.requirements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-400" />
                参与要求
              </h3>
              <div className="space-y-2">
                {project.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-cosmic-800/30 rounded-lg">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-cosmic-300">{requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 项目标签 */}
          {project.tags && project.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-yellow-400" />
                项目标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full text-sm border border-primary-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 项目时间信息 */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-400" />
              时间信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-cosmic-800/30 rounded-lg p-4">
                <div className="text-sm text-cosmic-400 mb-1">创建时间</div>
                <div className="text-white font-medium">
                  {new Date(project.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="bg-cosmic-800/30 rounded-lg p-4">
                <div className="text-sm text-cosmic-400 mb-1">最后更新</div>
                <div className="text-white font-medium">
                  {new Date(project.updated_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-6 border-t border-cosmic-700">
            <button
              onClick={onClose}
              className="btn-cosmic-outline flex-1"
            >
              关闭
            </button>

            {onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all flex items-center justify-center gap-2"
                title="删除项目"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            )}

            <button
              onClick={() => {
                toast.success(`申请加入项目: ${project.title}`)
                onClose()
              }}
              className="btn-cosmic flex-1 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              申请加入项目
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
