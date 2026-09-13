// @ts-nocheck
'use client'

import Link from 'next/link'
import type { Project } from '@/lib/aip/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    archived: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  }

  const statusLabels = {
    active: '进行中',
    completed: '已完成',
    archived: '已归档',
  }

  return (
    <Link href={`/explorer-alliance/projects/${project.id}`}>
      <div className="group h-full bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
            {project.name}
          </h3>
          <span className={`text-xs px-2 py-1 rounded border ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-gray-400 text-sm line-clamp-3 mb-4">
            {project.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          {project.creator && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>{project.creator.full_name || project.creator.email}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {project.is_public && (
            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              公开
            </span>
          )}
          {project.is_recruiting && (
            <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse">
              招募中
            </span>
          )}
          {project.members && project.members.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {project.members.length} 成员
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {new Date(project.created_at).toLocaleDateString('zh-CN')}
          </span>
          <div className="text-purple-400 group-hover:text-purple-300 text-sm font-medium flex items-center gap-1">
            查看详情
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
