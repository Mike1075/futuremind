'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

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

// 项目图标映射 - 为12个伊卡洛斯项目提供默认图标
const PROJECT_ICONS: Record<number, string> = {
  1: '🐾', 2: '🐱', 3: '🐶', 4: '🌍',
  5: '🌱', 6: '🐜', 7: '💧', 8: '🗺️',
  9: '🎨', 10: '👁️', 11: '🎲', 12: '🤝'
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

      // 并行加载我的项目和所有公开项目
      const [myResponse, allResponse] = await Promise.all([
        fetch('/api/pbl/my-projects?status=active'),
        fetch('/api/pbl/public-projects')
      ])

      if (myResponse.ok) {
        const myData = await myResponse.json()
        setMyProjects(myData.projects || [])
      }

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

  // 获取伊卡洛斯系统的12个项目
  const icarusProjects = allProjects
    .filter(p => p.is_system && p.project_visibility === 'system')
    .slice(0, 12)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link
          href="/portal"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回学习中心
        </Link>

        {/* 课程头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {courseSystem.title}
          </h1>
          <p className="text-gray-400 text-lg mb-6">{courseSystem.description}</p>

          {/* 标签页切换 */}
          <div className="flex gap-4 border-b border-gray-800 mb-6">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 px-4 font-medium transition-colors relative ${
                activeTab === 'my'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              我的项目
              {myProjects.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {myProjects.length}
                </span>
              )}
              {activeTab === 'my' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`pb-3 px-4 font-medium transition-colors relative ${
                activeTab === 'explore'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              探索项目
              {activeTab === 'explore' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              )}
            </button>
          </div>
        </div>

        {/* 我的项目 */}
        {activeTab === 'my' && (
          <div>
            {myProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map(selection => {
                  const project = selection.course_contents
                  return (
                    <div
                      key={selection.id}
                      className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-all"
                    >
                      {/* Cover Image */}
                      {project.project_cover_image && (
                        <div className="relative w-full h-40 bg-gray-800">
                          <Image
                            src={project.project_cover_image}
                            alt={project.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="p-6">
                        {/* Icon */}
                        <div className="flex items-start mb-3">
                          {project.project_icon_url ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 mr-3 border border-gray-700">
                              <Image
                                src={project.project_icon_url}
                                alt={`${project.title} icon`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-2xl flex-shrink-0 mr-3">
                              {PROJECT_ICONS[selection.course_contents.sequence_number] || '📚'}
                            </div>
                          )}
                        </div>

                        {/* 项目标题 */}
                        <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                      {project.subtitle && project.subtitle !== 'option_a' && project.subtitle !== 'option_b' && project.subtitle !== 'option_c' && project.subtitle !== 'option_d' && (
                        <p className="text-gray-400 text-sm mb-3">{project.subtitle}</p>
                      )}

                        {/* 进度条 */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">进度</span>
                            <span className="text-gray-400">{selection.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${selection.completion_percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-2">
                          <Link
                            href={`/courses/icarus/${project.id}`}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-sm font-medium text-center hover:opacity-90 transition-opacity"
                          >
                            继续学习
                          </Link>
                          <button
                            onClick={() => handleCancelProject(selection.id)}
                            className="px-4 py-2 bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">你还没有选择任何项目</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  去探索项目
                </button>
              </div>
            )}
          </div>
        )}

        {/* 探索项目 */}
        {activeTab === 'explore' && (
          <div>
            {/* 创建项目按钮 */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">伊卡洛斯12个项目</h2>
              <button
                onClick={() => router.push('/projects/create')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                创建我的项目
              </button>
            </div>

            {/* 项目网格 - 12个伊卡洛斯项目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {icarusProjects.map(project => {
                const isSelected = myProjects.some(
                  mp => mp.course_contents.id === project.id
                )

                return (
                  <div
                    key={project.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-all group"
                  >
                    {/* Cover Image or Gradient */}
                    {project.project_cover_image ? (
                      <div className="relative w-full h-32 bg-gray-800">
                        <Image
                          src={project.project_cover_image}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <div className="text-5xl">
                          {PROJECT_ICONS[project.sequence_number] || '📚'}
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      {/* 项目标题 */}
                      <h3 className="text-base font-semibold mb-2 line-clamp-2 min-h-[3rem]">{project.title}</h3>

                      {/* 项目简介 */}
                      {project.project_intro ? (
                        <p className="text-gray-500 text-sm mb-4 line-clamp-3 min-h-[4rem]">
                          {project.project_intro}
                        </p>
                      ) : (
                        <p className="text-gray-600 text-sm mb-4 italic min-h-[4rem]">
                          点击查看项目详情
                        </p>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                        >
                          查看介绍
                        </button>
                        {!isSelected ? (
                          <button
                            onClick={() => handleSelectProject(project.id)}
                            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                          >
                            选择
                          </button>
                        ) : (
                          <div className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium whitespace-nowrap">
                            ✓ 已选
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {icarusProjects.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                暂无项目
              </div>
            )}
          </div>
        )}
      </div>

      {/* 项目介绍模态框 */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-start justify-between">
              <div className="flex items-start gap-4">
                {selectedProject.project_icon_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700">
                    <Image
                      src={selectedProject.project_icon_url}
                      alt={selectedProject.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-3xl flex-shrink-0">
                    {PROJECT_ICONS[selectedProject.sequence_number] || '📚'}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedProject.title}</h2>
                  {selectedProject.subtitle && selectedProject.subtitle !== 'option_a' && selectedProject.subtitle !== 'option_b' && selectedProject.subtitle !== 'option_c' && selectedProject.subtitle !== 'option_d' && (
                    <p className="text-gray-400">{selectedProject.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cover Image */}
            {selectedProject.project_cover_image && (
              <div className="relative w-full h-64 bg-gray-800">
                <Image
                  src={selectedProject.project_cover_image}
                  alt={selectedProject.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {/* Project Intro */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-300">项目介绍</h3>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {selectedProject.project_intro || '暂无项目介绍，点击"查看详情"进入项目页面了解更多。'}
                </p>
              </div>

              {/* Meta Info */}
              {(selectedProject.module_name || selectedProject.estimated_duration || selectedProject.participant_count !== undefined) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-300">项目信息</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {selectedProject.module_name && (
                      <div className="flex items-center gap-2">
                        <span>📚</span>
                        <span>{selectedProject.module_name}</span>
                      </div>
                    )}
                    {selectedProject.estimated_duration && (
                      <div className="flex items-center gap-2">
                        <span>⏱️</span>
                        <span>{selectedProject.estimated_duration}分钟</span>
                      </div>
                    )}
                    {selectedProject.participant_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>{selectedProject.participant_count}人参与</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link
                  href={`/courses/icarus/${selectedProject.id}`}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-medium text-center hover:opacity-90 transition-opacity"
                >
                  查看详情
                </Link>
                {!myProjects.some(mp => mp.course_contents.id === selectedProject.id) && (
                  <button
                    onClick={() => {
                      handleSelectProject(selectedProject.id)
                      setSelectedProject(null)
                    }}
                    className="px-6 py-3 bg-green-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    选择项目
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
