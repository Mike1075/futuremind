'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { IcarusTriangleView } from './IcarusTriangleView'

interface Project {
  id: string
  title: string
  subtitle: string | null
  project_intro: string | null
  difficulty_level: string | null
  module_name: string | null
  estimated_duration: number | null
  project_visibility: string
  project_icon_url: string | null
  project_cover_image: string | null
  sequence_number: number
  week_plan?: any[] | null
  participant_count?: number
  is_system?: boolean
  is_completed?: boolean  // 用户是否完成该项目
  progress?: number  // 项目进度 (0-100)
  creator?: {
    id: string
    username: string
    full_name: string | null
  } | null
}

interface UserSelectedProject {
  id: string
  status: string
  completion_percentage: number
  last_activity_at: string
  course_contents: Project
}

interface PBLCourseViewProps {
  courseSystem: {
    id: string
    title: string
    description: string | null
    system_key: string
  }
}

// 项目图标映射 - 为11个伊卡洛斯项目提供默认图标
const PROJECT_ICONS: Record<number, string> = {
  1: '🐾', 2: '🐱', 3: '🐶',
  4: '🌱', 5: '🐜', 6: '💧', 7: '🗺️',
  8: '🎨', 9: '👁️', 10: '🎲', 11: '🤝'
}

export function PBLCourseView({ courseSystem }: PBLCourseViewProps) {
  const router = useRouter()
  const [myProjects, setMyProjects] = useState<UserSelectedProject[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('explore')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 并行加载所有项目和用户的项目数据
      const [allResponse, myResponse] = await Promise.all([
        fetch('/api/pbl/public-projects'),
        fetch('/api/pbl/my-projects')
      ])

      if (allResponse.ok) {
        const allData = await allResponse.json()
        let projects = allData.projects || []

        // 如果成功获取用户项目数据，合并完成状态
        if (myResponse.ok) {
          const myData = await myResponse.json()
          const myProjectsData = myData.projects || []
          setMyProjects(myProjectsData)

          // 创建项目完成状态映射
          const completionMap = new Map<string, { is_completed: boolean; progress: number }>(
            myProjectsData.map((mp: UserSelectedProject) => [
              mp.course_contents.id,
              {
                is_completed: mp.status === 'completed' || mp.completion_percentage >= 100,
                progress: mp.completion_percentage
              }
            ])
          )

          // 为所有项目添加完成状态
          projects = projects.map((p: Project) => ({
            ...p,
            is_completed: completionMap.get(p.id)?.is_completed ?? false,
            progress: completionMap.get(p.id)?.progress ?? 0
          }))

          // 🐛 调试日志：打印伊卡洛斯项目的进度数据
          console.log('[数据加载] 合并后的项目进度:', projects.map(p => ({
            title: p.title,
            sequence: p.sequence_number,
            progress: p.progress,
            is_completed: p.is_completed
          })))
        }

        setAllProjects(projects)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const handleSelectProject = async (projectId: string) => {
    try {
      const response = await fetch('/api/pbl/select-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (response.ok) {
        // 重新加载数据
        await loadData()
        // 切换到"我的项目"标签
        setActiveTab('my')
      } else {
        const error = await response.json()
        alert(error.error || '选择项目失败')
      }
    } catch (error) {
      console.error('Failed to select project:', error)
      alert('选择项目失败，请重试')
    }
  }

  const handleCancelProject = async (selectionId: string) => {
    if (!confirm('确定要取消这个项目吗？')) return

    try {
      const response = await fetch('/api/pbl/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectionId,
          status: 'cancelled'
        })
      })

      if (response.ok) {
        await loadData()
      } else {
        alert('取消项目失败')
      }
    } catch (error) {
      console.error('Failed to cancel project:', error)
      alert('取消项目失败，请重试')
    }
  }

  // 获取伊卡洛斯系统的11个项目（通过subtitle中的年龄段识别）
  const icarusProjects = allProjects
    .filter(p =>
      p.project_visibility === 'system' &&
      p.subtitle &&
      /\d+[-~]\d+岁|\d+岁以上/.test(p.subtitle)
    )
    .sort((a, b) => a.sequence_number - b.sequence_number)

  // 准备模块数据
  const MODULES = [
    {
      id: 1,
      name: '模块一：无形的纽带',
      projectCount: 3,
      projects: icarusProjects.filter(p => p.sequence_number >= 1 && p.sequence_number <= 3),
      gradient: '#10B981, #14B8A6',  // emerald to teal
      icon: '🌱'
    },
    {
      id: 2,
      name: '模块二：无形的地图',
      projectCount: 4,
      projects: icarusProjects.filter(p => p.sequence_number >= 4 && p.sequence_number <= 7),
      gradient: '#3B82F6, #06B6D4',  // blue to cyan
      icon: '🔬'
    },
    {
      id: 3,
      name: '模块三：延展的心灵',
      projectCount: 4,
      projects: icarusProjects.filter(p => p.sequence_number >= 8 && p.sequence_number <= 11),
      gradient: '#8B5CF6, #EC4899',  // purple to pink
      icon: '🌐'
    }
  ]

  // 直接渲染伊卡洛斯三角形视图，数据在后台加载
  return <IcarusTriangleView modules={MODULES} />
}
