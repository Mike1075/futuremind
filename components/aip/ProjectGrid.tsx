// @ts-nocheck
'use client'

import { memo, useCallback } from 'react'
import {
  Folder,
  Lock,
  Globe,
  Star,
  Trash2,
  Edit3,
  UserPlus,
  CheckCircle2,
  Clock,
  Pause,
  AlertCircle,
  User,
  Crown
} from 'lucide-react'
import type { Project } from '@/lib/aip/types'

interface ProjectGridProps {
  projects: Project[]
  onProjectClick?: (project: Project) => void
  onDeleteProject?: (projectId: string, projectName: string) => void
  onEditDescription?: (projectId: string, projectName: string, description: string) => void
  onTogglePublic?: (projectId: string, isPublic: boolean) => void
  onToggleRecruiting?: (projectId: string, isRecruiting: boolean) => void
  onApplyToJoin?: (projectId: string, projectName: string) => void
  userProjectPermissions?: Record<string, 'owner' | 'manager' | 'member' | 'none'>
  userId?: string | null      // 当前用户ID，用于标识自己创建的项目
  showEditControls?: boolean  // 是否显示编辑控制（删除、编辑等）
  showApplyButton?: boolean   // 是否显示申请加入按钮
  showCreatorBadge?: boolean  // 是否显示创建者徽章（针对自己创建的项目）
}

// PF-04: 将状态配置移到组件外部，避免每次渲染都重新创建
const STATUS_CONFIG = {
  active: {
    label: '进行中',
    icon: Clock,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20'
  },
  completed: {
    label: '已完成',
    icon: CheckCircle2,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20'
  },
  paused: {
    label: '暂停',
    icon: Pause,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20'
  },
  default: {
    label: '计划中',
    icon: AlertCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20'
  }
} as const

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.default
}

// PF-04: 使用memo包装组件，避免不必要的重新渲染
export const ProjectGrid = memo(function ProjectGrid({
  projects,
  onProjectClick,
  onDeleteProject,
  onEditDescription,
  onTogglePublic,
  onToggleRecruiting,
  onApplyToJoin,
  userProjectPermissions = {},
  userId = null,
  showEditControls = true,
  showApplyButton = false,
  showCreatorBadge = false,
}: ProjectGridProps) {

  // PF-04: 使用useCallback优化canEdit函数
  const canEdit = useCallback((projectId: string) => {
    return userProjectPermissions[projectId] === 'owner' || userProjectPermissions[projectId] === 'manager'
  }, [userProjectPermissions])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const statusConfig = getStatusConfig(project.status)
        const StatusIcon = statusConfig.icon
        const isManager = canEdit(project.id)

        return (
          <div
            key={project.id}
            className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all duration-200"
          >
            {/* 项目头部 */}
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onProjectClick?.(project)}
              >
                <div className="flex items-start gap-2 mb-2">
                  <Folder className="h-5 w-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                  <h3 className="font-semibold text-white line-clamp-1 group-hover:text-zinc-100">
                    {project.name}
                  </h3>
                </div>
              </div>

              {/* 快捷操作图标 */}
              {showEditControls && isManager ? (
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* 可见性切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTogglePublic?.(project.id, !project.is_public)
                    }}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    title={project.is_public ? '设为私有' : '设为公开'}
                  >
                    {project.is_public ? (
                      <Globe className="h-4 w-4 text-zinc-400 hover:text-white" />
                    ) : (
                      <Lock className="h-4 w-4 text-zinc-400 hover:text-white" />
                    )}
                  </button>

                  {/* 招募切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleRecruiting?.(project.id, !project.is_recruiting)
                    }}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    title={project.is_recruiting ? '停止招募' : '开启招募'}
                  >
                    <Star
                      className={`h-4 w-4 transition-colors ${
                        project.is_recruiting
                          ? 'text-yellow-500 hover:text-yellow-400'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      fill={project.is_recruiting ? 'currentColor' : 'none'}
                    />
                  </button>

                  {/* 编辑描述 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditDescription?.(project.id, project.name, project.description || '')
                    }}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    title="编辑描述"
                  >
                    <Edit3 className="h-4 w-4 text-zinc-400 hover:text-white" />
                  </button>

                  {/* 删除项目 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteProject?.(project.id, project.name)
                    }}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    title="删除项目"
                  >
                    <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-400" />
                  </button>
                </div>
              ) : (
                /* 非管理员显示概览入口 */
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onProjectClick?.(project)
                  }}
                  className="flex-shrink-0 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                  title="查看项目概览"
                >
                  概览
                </button>
              )}
            </div>

            {/* 项目描述 */}
            <p className="text-sm text-zinc-400 line-clamp-2 mb-3 min-h-[2.5rem]">
              {project.description || '暂无描述'}
            </p>

            {/* 创建者信息 */}
            {project.creator && (
              <div className="flex items-center gap-2 mb-3 text-xs">
                {showCreatorBadge && userId && project.creator_id === userId ? (
                  // 当前用户创建的项目 - 显示皇冠标记
                  <>
                    <Crown className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" />
                    <span className="text-yellow-500 font-medium">
                      我创建的 · {project.creator.full_name || project.creator.email || '未知'}
                    </span>
                  </>
                ) : (
                  // 其他人创建的项目
                  <>
                    <User className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-zinc-500">
                      创建者: {project.creator.full_name || project.creator.email || '未知'}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* 状态标签和属性 */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusConfig.bg} border ${statusConfig.border}`}>
                <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.color}`} />
                <span className={`text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>

              {project.is_recruiting && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
                  <span className="text-xs text-yellow-500 font-medium">招募中</span>
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              {/* 状态指示器 */}
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <div className="flex items-center gap-1">
                  {project.is_public ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>{project.is_public ? '公开' : '私有'}</span>
                </div>
              </div>

              {/* 申请加入按钮 - 只对非成员且招募中的项目显示 */}
              {showApplyButton && project.is_recruiting && !userProjectPermissions[project.id] && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onApplyToJoin?.(project.id, project.name)
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  申请加入
                </button>
              )}

              {/* 进入项目按钮 - 对已经是成员的项目显示 */}
              {showApplyButton && userProjectPermissions[project.id] && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onProjectClick?.(project)
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Folder className="h-3.5 w-3.5" />
                  进入项目
                </button>
              )}

              {/* 查看详情按钮 */}
              {onProjectClick && !showApplyButton && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onProjectClick(project)
                  }}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  查看详情 →
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})
