'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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

const DIFFICULTY_LEVELS = ['基础探索', '进阶挑战', '深度研究', '创新实践']
const MODULES = ['意识觉醒', '科学探索', '创意表达']

const DIFFICULTY_COLORS = {
  '基础探索': 'from-green-500 to-emerald-600',
  '进阶挑战': 'from-blue-500 to-cyan-600',
  '深度研究': 'from-purple-500 to-pink-600',
  '创新实践': 'from-orange-500 to-red-600'
}

export function PBLCourseView({ courseSystem }: PBLCourseViewProps) {
  const router = useRouter()
  const [myProjects, setMyProjects] = useState<UserSelectedProject[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('my')

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

  // 筛选项目
  const filteredProjects = allProjects.filter(project => {
    if (selectedModule && project.module_name !== selectedModule) return false
    if (selectedDifficulty && project.difficulty_level !== selectedDifficulty) return false
    return true
  })

  // 按难度和模块分组项目（用于网格展示）
  const projectGrid = DIFFICULTY_LEVELS.map(difficulty => ({
    difficulty,
    modules: MODULES.map(module => {
      const project = filteredProjects.find(
        p => p.difficulty_level === difficulty && p.module_name === module
      )
      return { module, project }
    })
  }))

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
                      className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all"
                    >
                      {/* 难度标签 */}
                      {project.difficulty_level && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 bg-gradient-to-r ${
                          DIFFICULTY_COLORS[project.difficulty_level as keyof typeof DIFFICULTY_COLORS] || 'from-gray-500 to-gray-600'
                        } text-white`}>
                          {project.difficulty_level}
                        </span>
                      )}

                      {/* 项目标题 */}
                      <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                      {project.subtitle && (
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
            {/* 筛选器 */}
            <div className="mb-6 flex gap-4 flex-wrap">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">模块</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedModule(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedModule === null
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    全部
                  </button>
                  {MODULES.map(module => (
                    <button
                      key={module}
                      onClick={() => setSelectedModule(module)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedModule === module
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {module}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">难度</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDifficulty(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDifficulty === null
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    全部
                  </button>
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => setSelectedDifficulty(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDifficulty === level
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 项目网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => {
                const isSelected = myProjects.some(
                  mp => mp.course_contents.id === project.id
                )

                return (
                  <div
                    key={project.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all"
                  >
                    {/* 难度标签 */}
                    {project.difficulty_level && (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 bg-gradient-to-r ${
                        DIFFICULTY_COLORS[project.difficulty_level as keyof typeof DIFFICULTY_COLORS] || 'from-gray-500 to-gray-600'
                      } text-white`}>
                        {project.difficulty_level}
                      </span>
                    )}

                    {/* 项目信息 */}
                    <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                    {project.subtitle && (
                      <p className="text-gray-400 text-sm mb-3">{project.subtitle}</p>
                    )}

                    {/* 项目简介 */}
                    {project.project_intro && (
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {project.project_intro}
                      </p>
                    )}

                    {/* 元信息 */}
                    <div className="flex gap-4 text-xs text-gray-500 mb-4">
                      {project.module_name && (
                        <span>📚 {project.module_name}</span>
                      )}
                      {project.estimated_duration && (
                        <span>⏱️ {project.estimated_duration}分钟</span>
                      )}
                      {project.participant_count !== undefined && (
                        <span>👥 {project.participant_count}人参与</span>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Link
                        href={`/courses/icarus/${project.id}`}
                        className="flex-1 px-4 py-2 bg-gray-800 rounded-lg text-sm font-medium text-center hover:bg-gray-700 transition-colors"
                      >
                        查看详情
                      </Link>
                      {!isSelected && (
                        <button
                          onClick={() => handleSelectProject(project.id)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          选择
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                暂无符合条件的项目
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
