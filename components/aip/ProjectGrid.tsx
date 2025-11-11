'use client'

import { useState } from 'react'
import {
  Folder,
  Lock,
  Globe,
  Star,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  UserPlus,
  MoreVertical,
  CheckCircle2,
  Clock,
  Pause,
  AlertCircle
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
  showEditControls?: boolean  // 是否显示编辑控制（删除、编辑等）
  showApplyButton?: boolean   // 是否显示申请加入按钮
}

export function ProjectGrid({
  projects,
  onProjectClick,
  onDeleteProject,
  onEditDescription,
  onTogglePublic,
  onToggleRecruiting,
  onApplyToJoin,
  userProjectPermissions = {},
  showEditControls = true,
  showApplyButton = false,
}: ProjectGridProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: '进行中',
          icon: Clock,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20'
        }
      case 'completed':
        return {
          label: '已完成',
          icon: CheckCircle2,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20'
        }
      case 'paused':
        return {
          label: '暂停',
          icon: Pause,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20'
        }
      default:
        return {
          label: '计划中',
          icon: AlertCircle,
          color: 'text-gray-500',
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/20'
        }
    }
  }

  const canEdit = (projectId: string) => {
    return userProjectPermissions[projectId] === 'manager'
  }

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

              {/* 操作菜单 */}
              {showEditControls && isManager && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveMenu(activeMenu === project.id ? null : project.id)
                    }}
                    className="p-1 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-zinc-500" />
                  </button>

                  {activeMenu === project.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-0 top-8 z-20 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl min-w-[160px] py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditDescription?.(project.id, project.name, project.description || '')
                            setActiveMenu(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          编辑描述
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteProject?.(project.id, project.name)
                            setActiveMenu(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除项目
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 项目描述 */}
            <p className="text-sm text-zinc-400 line-clamp-2 mb-4 min-h-[2.5rem]">
              {project.description || '暂无描述'}
            </p>

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
              {/* 可见性 */}
              <div className="flex items-center gap-3">
                {showEditControls && isManager ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTogglePublic?.(project.id, !project.is_public)
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {project.is_public ? (
                      <>
                        <Globe className="h-3.5 w-3.5" />
                        <span>公开</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>私有</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    {project.is_public ? (
                      <>
                        <Globe className="h-3.5 w-3.5" />
                        <span>公开</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>私有</span>
                      </>
                    )}
                  </div>
                )}

                {/* 招募开关 */}
                {showEditControls && isManager && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleRecruiting?.(project.id, !project.is_recruiting)
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {project.is_recruiting ? (
                      <>
                        <Star className="h-3.5 w-3.5" fill="currentColor" />
                        <span>停止招募</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-3.5 w-3.5" />
                        <span>开启招募</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 申请加入按钮 */}
              {showApplyButton && project.is_recruiting && (
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

              {/* 查看详情按钮 */}
              {onProjectClick && (
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
}
