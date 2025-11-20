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
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('explore')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 只加载公开项目，大幅提升加载速度
      const allResponse = await fetch('/api/pbl/public-projects')

      if (allResponse.ok) {
        const allData = await allResponse.json()
        setAllProjects(allData.projects || [])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
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

  // 获取伊卡洛斯系统的11个项目
  const icarusProjects = allProjects
    .filter(p => p.project_visibility === 'system')
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .slice(0, 11)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
      </div>
    )
  }

  // 使用新的三角形视图
  return <IcarusTriangleView modules={MODULES} />
}
