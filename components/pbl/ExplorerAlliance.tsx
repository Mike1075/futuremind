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

const DIFFICULTY_LEVELS = ['基础探索', '进阶挑战', '深度研究', '创新实践']
const MODULES = ['意识觉醒', '科学探索', '创意表达']

const DIFFICULTY_COLORS = {
  '基础探索': 'from-green-500 to-emerald-600',
  '进阶挑战': 'from-blue-500 to-cyan-600',
  '深度研究': 'from-purple-500 to-pink-600',
  '创新实践': 'from-orange-500 to-red-600'
}

export function ExplorerAlliance() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [myProjectIds, setMyProjectIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [projects, selectedModule, selectedDifficulty, searchQuery])

  const loadProjects = async () => {
    try {
      setLoading(true)

      // 并行加载公开项目和我的项目
      const [publicResponse, myResponse] = await Promise.all([
        fetch('/api/pbl/public-projects'),
        fetch('/api/pbl/my-projects?status=active')
      ])

      if (publicResponse.ok) {
        const data = await publicResponse.json()
        setProjects(data.projects || [])
      }

      if (myResponse.ok) {
        const myData = await myResponse.json()
        const ids = new Set<string>(myData.projects.map((p: any) => p.course_contents.id))
        setMyProjectIds(ids)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...projects]

    // 应用模块筛选
    if (selectedModule) {
      filtered = filtered.filter(p => p.module_name === selectedModule)
    }

    // 应用难度筛选
    if (selectedDifficulty) {
      filtered = filtered.filter(p => p.difficulty_level === selectedDifficulty)
    }

    // 应用搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.subtitle?.toLowerCase().includes(query) ||
        p.project_intro?.toLowerCase().includes(query)
      )
    }

    setFilteredProjects(filtered)
  }

  const handleSelectProject = async (projectId: string) => {
    try {
      const response = await fetch('/api/pbl/select-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (response.ok) {
        // 重新加载项目列表
        await loadProjects()
      } else {
        const error = await response.json()
        alert(error.error || '选择项目失败')
      }
    } catch (error) {
      console.error('Failed to select project:', error)
      alert('选择项目失败，请重试')
    }
  }

  // 统计信息
  const stats = {
    total: projects.length,
    byDifficulty: DIFFICULTY_LEVELS.map(level => ({
      level,
      count: projects.filter(p => p.difficulty_level === level).length
    })),
    byModule: MODULES.map(module => ({
      module,
      count: projects.filter(p => p.module_name === module).length
    }))
  }

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
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                探索者联盟
              </h1>
              <p className="text-gray-400 text-lg">
                发现并加入精彩的PBL项目，与全球学习者一起探索未知
              </p>
            </div>
            <Link
              href="/portal"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              返回学习中心
            </Link>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-sm text-gray-400">可选项目</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{myProjectIds.size}</div>
              <div className="text-sm text-gray-400">我的项目</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">
                {projects.reduce((sum, p) => sum + (p.participant_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">总参与人次</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-400">
                {projects.filter(p => !p.is_system).length}
              </div>
              <div className="text-sm text-gray-400">社区项目</div>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 搜索 */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">搜索</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索项目标题或描述..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 模块筛选 */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">模块</label>
                <select
                  value={selectedModule || ''}
                  onChange={(e) => setSelectedModule(e.target.value || null)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部模块</option>
                  {MODULES.map(module => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>

              {/* 难度筛选 */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">难度</label>
                <select
                  value={selectedDifficulty || ''}
                  onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部难度</option>
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 视图切换 */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                网格视图
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                列表视图
              </button>
            </div>
          </div>

          {/* 结果计数 */}
          <div className="text-gray-400 text-sm mb-4">
            找到 {filteredProjects.length} 个项目
            {(selectedModule || selectedDifficulty || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedModule(null)
                  setSelectedDifficulty(null)
                  setSearchQuery('')
                }}
                className="ml-3 text-blue-400 hover:text-blue-300"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>

        {/* 项目列表 */}
        {filteredProjects.length > 0 ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredProjects.map(project => {
              const isSelected = myProjectIds.has(project.id)

              return (
                <div
                  key={project.id}
                  className={`bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all ${
                    isSelected ? 'ring-2 ring-blue-500/30' : ''
                  }`}
                >
                  {/* 标签 */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {project.difficulty_level && (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                        DIFFICULTY_COLORS[project.difficulty_level as keyof typeof DIFFICULTY_COLORS] || 'from-gray-500 to-gray-600'
                      } text-white`}>
                        {project.difficulty_level}
                      </span>
                    )}
                    {isSelected && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
                        ✓ 已选择
                      </span>
                    )}
                    {project.is_system && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">
                        官方项目
                      </span>
                    )}
                  </div>

                  {/* 项目信息 */}
                  <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                  {project.subtitle && (
                    <p className="text-gray-400 text-sm mb-3">{project.subtitle}</p>
                  )}

                  {project.project_intro && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {project.project_intro}
                    </p>
                  )}

                  {/* 元信息 */}
                  <div className="flex gap-4 text-xs text-gray-500 mb-4 flex-wrap">
                    {project.module_name && (
                      <span>📚 {project.module_name}</span>
                    )}
                    {project.estimated_duration && (
                      <span>⏱️ {project.estimated_duration}分钟</span>
                    )}
                    {project.participant_count !== undefined && (
                      <span>👥 {project.participant_count}人</span>
                    )}
                  </div>

                  {/* 创建者 (用户项目) */}
                  {project.creator && (
                    <div className="text-xs text-gray-500 mb-4">
                      创建者: {project.creator.full_name || project.creator.username}
                    </div>
                  )}

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
                    {isSelected && (
                      <Link
                        href="/courses/icarus"
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors whitespace-nowrap"
                      >
                        去学习
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchQuery || selectedModule || selectedDifficulty
              ? '没有找到符合条件的项目'
              : '暂无可用项目'}
          </div>
        )}
      </div>
    </div>
  )
}
