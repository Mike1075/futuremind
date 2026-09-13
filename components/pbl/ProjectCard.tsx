// @ts-nocheck
"use client"

import React, { memo } from 'react'
import { PBLProject } from '@/lib/pbl-data'
import {
  Users,
  Clock,
  Star,
  Calendar,
  Target,
  Zap,
  Brain,
  Palette,
  BookOpen
} from 'lucide-react'

interface ProjectCardProps {
  project: PBLProject
  viewMode: 'grid' | 'list'
  onClick: () => void
}

// PF-13: 将样式配置提取到组件外部，避免每次渲染重新创建
const CATEGORY_COLORS: Record<string, string> = {
  consciousness: 'bg-resonance-600',
  science: 'bg-blue-600',
  creative: 'bg-purple-600',
  guidance: 'bg-green-600',
  default: 'bg-primary-600'
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-orange-400',
  expert: 'text-red-400',
  default: 'text-cosmic-400'
}

const STATUS_COLORS: Record<string, string> = {
  recruiting: 'bg-green-600',
  active: 'bg-blue-600',
  completed: 'bg-cosmic-600',
  paused: 'bg-yellow-600',
  default: 'bg-cosmic-600'
}

const STATUS_TEXT: Record<string, string> = {
  recruiting: '招募中',
  active: '进行中',
  completed: '已完成',
  paused: '暂停'
}

const DIFFICULTY_TEXT: Record<string, string> = {
  beginner: '初学者',
  intermediate: '中级',
  advanced: '高级',
  expert: '专家'
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  consciousness: <Brain className="w-5 h-5" />,
  science: <Zap className="w-5 h-5" />,
  creative: <Palette className="w-5 h-5" />,
  guidance: <BookOpen className="w-5 h-5" />,
  default: <Target className="w-5 h-5" />
}

// PF-13: 使用memo优化组件，避免不必要的重渲染
export const ProjectCard = memo(function ProjectCard({ project, viewMode, onClick }: ProjectCardProps) {
  const getCategoryIcon = (category: string) => CATEGORY_ICONS[category] || CATEGORY_ICONS.default
  const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || CATEGORY_COLORS.default
  const getDifficultyColor = (difficulty: string) => DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.default
  const getStatusColor = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.default
  const getStatusText = (status: string) => STATUS_TEXT[status] || status
  const getDifficultyText = (difficulty: string) => DIFFICULTY_TEXT[difficulty] || difficulty

  const participationRate = (project.current_participants / project.max_participants) * 100

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="card-cosmic cursor-pointer hover:scale-[1.02] transition-all duration-300 p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className={`w-10 h-10 ${getCategoryColor(project.category)} rounded-lg flex items-center justify-center text-white mr-4`}>
                {getCategoryIcon(project.category)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-cosmic-400">
                  <span className={getDifficultyColor(project.difficulty_level)}>
                    {getDifficultyText(project.difficulty_level)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {project.duration_weeks}周
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {project.current_participants}/{project.max_participants}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-cosmic-300 text-sm mb-3 line-clamp-2">{project.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-cosmic-700/50 text-cosmic-300 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <span className={`px-3 py-1 ${getStatusColor(project.status)} text-white text-xs rounded-full`}>
                {getStatusText(project.status)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="card-cosmic cursor-pointer hover:scale-105 transition-all duration-300 consciousness-wave"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${getCategoryColor(project.category)} rounded-xl flex items-center justify-center text-white`}>
          {getCategoryIcon(project.category)}
        </div>
        <span className={`px-3 py-1 ${getStatusColor(project.status)} text-white text-xs rounded-full`}>
          {getStatusText(project.status)}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{project.title}</h3>
      <p className="text-cosmic-300 text-sm mb-4 line-clamp-3">{project.description}</p>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-cosmic-400">难度等级</span>
          <span className={`font-medium ${getDifficultyColor(project.difficulty_level)}`}>
            {getDifficultyText(project.difficulty_level)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-cosmic-400">项目周期</span>
          <span className="text-white flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {project.duration_weeks}周
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-cosmic-400">参与者</span>
            <span className="text-white">
              {project.current_participants}/{project.max_participants}
            </span>
          </div>
          <div className="w-full bg-cosmic-700 rounded-full h-2">
            <div
              className="bg-gradient-cosmic h-2 rounded-full transition-all duration-300"
              style={{ width: `${participationRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {project.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-cosmic-700/50 text-cosmic-300 text-xs rounded-full">
            {tag}
          </span>
        ))}
        {project.tags.length > 3 && (
          <span className="px-2 py-1 bg-cosmic-700/50 text-cosmic-400 text-xs rounded-full">
            +{project.tags.length - 3}
          </span>
        )}
      </div>

      <button className="w-full btn-cosmic-outline text-sm py-2">
        {project.status === 'recruiting' ? '申请加入' : '查看详情'}
      </button>
    </div>
  )
})
