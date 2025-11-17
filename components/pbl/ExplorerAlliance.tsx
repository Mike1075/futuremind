'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExplorerProjectCard } from '@/components/courses/ExplorerProjectCard'
import type { ExplorerProject } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/client'

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
    full_name: string | null
    email: string | null
  } | null
}

interface EarthStageWithProjects {
  id: string
  title: string
  sequence_number: number
  explorer_projects: ExplorerProject[]
}

interface EarthCourseContent {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  sequence_number: number
  stage_id: string
  duration: string | null
}

type ProjectType = 'all' | 'icarus' | 'earth' | 'community'

export function ExplorerAlliance() {
  const router = useRouter()
  const [icarusProjects, setIcarusProjects] = useState<Project[]>([])
  const [earthProjects, setEarthProjects] = useState<EarthStageWithProjects[]>([])
  const [earthContents, setEarthContents] = useState<EarthCourseContent[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [filteredEarthProjects, setFilteredEarthProjects] = useState<EarthStageWithProjects[]>([])
  const [filteredEarthContents, setFilteredEarthContents] = useState<EarthCourseContent[]>([])
  const [selectedType, setSelectedType] = useState<ProjectType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [myProjectIds, setMyProjectIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAllProjects()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [icarusProjects, earthProjects, earthContents, selectedType, searchQuery])

  const loadAllProjects = async () => {
    try {
      setLoading(true)

      // 并行加载所有类型的项目
      const [publicResponse, myResponse, earthResponse, earthContentsData] = await Promise.all([
        fetch('/api/pbl/public-projects'),
        fetch('/api/pbl/my-projects?status=active'),
        loadEarthProjects(),
        loadEarthCourseContents()
      ])

      if (publicResponse.ok) {
        const data = await publicResponse.json()
        setIcarusProjects(data.projects || [])
      }

      if (myResponse.ok) {
        const myData = await myResponse.json()
        const ids = new Set<string>(myData.projects.map((p: any) => p.course_contents.id))
        setMyProjectIds(ids)
      }

      setEarthProjects(earthResponse)
      setEarthContents(earthContentsData)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEarthProjects = async (): Promise<EarthStageWithProjects[]> => {
    try {
      const supabase = createClient()

      // 获取地球课程体系ID
      const { data: systemData } = await supabase
        .from('course_systems')
        .select('id')
        .eq('system_key', 'earth')
        .single()

      if (!systemData) return []

      // 获取所有阶段的explorer_projects
      const { data: stages } = (await supabase
        .from('course_contents')
        .select('id, title, sequence_number, explorer_projects')
        .eq('system_id', systemData.id)
        .not('explorer_projects', 'is', null)
        .order('sequence_number')) as { data: Array<{
          id: string
          title: string
          sequence_number: number
          explorer_projects: unknown
        }> | null }

      if (!stages) return []

      // 过滤出有项目的阶段
      return stages
        .filter(stage => {
          const projects = stage.explorer_projects
          return Array.isArray(projects) && projects.length > 0
        })
        .map(stage => ({
          ...stage,
          explorer_projects: stage.explorer_projects as ExplorerProject[]
        }))
    } catch (error) {
      console.error('Failed to load earth projects:', error)
      return []
    }
  }

  const loadEarthCourseContents = async (): Promise<EarthCourseContent[]> => {
    try {
      const supabase = createClient()

      // 获取地球课程体系ID
      const { data: systemData } = await supabase
        .from('course_systems')
        .select('id')
        .eq('system_key', 'earth')
        .single()

      if (!systemData) return []

      // 获取所有地球课程内容
      const { data: contents } = (await supabase
        .from('course_contents')
        .select('id, title, subtitle, description, sequence_number, stage_id, duration')
        .eq('system_id', systemData.id)
        .eq('is_published', true)
        .order('sequence_number')) as { data: EarthCourseContent[] | null }

      return contents || []
    } catch (error) {
      console.error('Failed to load earth course contents:', error)
      return []
    }
  }

  const applyFilters = () => {
    // 筛选伊卡洛斯项目
    let filteredIcarus = [...icarusProjects]

    // 应用模糊搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredIcarus = filteredIcarus.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.subtitle?.toLowerCase().includes(query) ||
        p.project_intro?.toLowerCase().includes(query) ||
        p.module_name?.toLowerCase().includes(query) ||
        p.difficulty_level?.toLowerCase().includes(query)
      )
    }

    // 筛选地球项目（explorer_projects字段）
    let filteredEarth = [...earthProjects]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredEarth = filteredEarth.map(stage => ({
        ...stage,
        explorer_projects: stage.explorer_projects.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.goal?.toLowerCase().includes(query)
        )
      })).filter(stage => stage.explorer_projects.length > 0)
    }

    // 筛选地球课程内容
    let filteredEarthCourseContents = [...earthContents]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredEarthCourseContents = filteredEarthCourseContents.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.subtitle?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
    }

    setFilteredProjects(filteredIcarus)
    setFilteredEarthProjects(filteredEarth)
    setFilteredEarthContents(filteredEarthCourseContents)
  }

  const handleSelectProject = async (projectId: string) => {
    try {
      const response = await fetch('/api/pbl/select-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (response.ok) {
        await loadAllProjects()
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
  const totalEarthExplorerProjects = earthProjects.reduce((sum, stage) => sum + stage.explorer_projects.length, 0)
  const totalEarthCourseContents = earthContents.length
  const totalEarthProjects = totalEarthExplorerProjects + totalEarthCourseContents
  const icarusSystemProjects = icarusProjects.filter(p => p.is_system).length
  const communityProjects = icarusProjects.filter(p => !p.is_system).length

  const stats = {
    total: icarusProjects.length + totalEarthProjects,
    icarus: icarusSystemProjects,
    earth: totalEarthProjects,
    community: communityProjects,
    myProjects: myProjectIds.size
  }

  // 根据类型筛选决定显示什么
  const shouldShowIcarus = selectedType === 'all' || selectedType === 'icarus' || selectedType === 'community'
  const shouldShowEarth = selectedType === 'all' || selectedType === 'earth'
  const filteredIcarusByType = shouldShowIcarus
    ? filteredProjects.filter(p => {
        if (selectedType === 'icarus') return p.is_system
        if (selectedType === 'community') return !p.is_system
        return true
      })
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
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
                发现并加入精彩的学习项目，与全球学习者一起探索未知
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-sm text-gray-400">全部项目</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.icarus}</div>
              <div className="text-sm text-gray-400">伊卡洛斯</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-400">{stats.earth}</div>
              <div className="text-sm text-gray-400">小探险家</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-400">{stats.community}</div>
              <div className="text-sm text-gray-400">社区项目</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.myProjects}</div>
              <div className="text-sm text-gray-400">我的项目</div>
            </div>
          </div>

          {/* 项目类型筛选 */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              全部项目 ({stats.total})
            </button>
            <button
              onClick={() => setSelectedType('icarus')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === 'icarus'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🚀 伊卡洛斯项目 ({stats.icarus})
            </button>
            <button
              onClick={() => setSelectedType('earth')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === 'earth'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🌍 小探险家项目 ({stats.earth})
            </button>
            <button
              onClick={() => setSelectedType('community')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === 'community'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              👥 社区项目 ({stats.community})
            </button>
          </div>

          {/* 搜索框 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索项目标题、描述、模块或难度..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              {/* 清除搜索 */}
              {(searchQuery || selectedType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedType('all')
                  }}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                >
                  清除筛选
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 提示：支持模糊搜索，可以搜索标题、描述、模块名称、难度等任何相关内容
            </p>
          </div>
        </div>

        {/* 地球课程内容 */}
        {shouldShowEarth && filteredEarthContents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🌍 地球课程 - 全部内容
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              "欢迎来到地球"课程的所有学习内容，系统化的知识体系
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEarthContents.map((content) => (
                <Link
                  key={content.id}
                  href={`/courses/earth/${content.id}`}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all group"
                >
                  {/* 序号标识 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
                      {content.sequence_number}
                    </div>
                    {content.duration && (
                      <span className="text-xs text-gray-500">⏱️ {content.duration}</span>
                    )}
                  </div>

                  {/* 标题 */}
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-400 transition-colors">
                    {content.title}
                  </h3>

                  {/* 副标题 */}
                  {content.subtitle && (
                    <p className="text-gray-400 text-sm mb-3">{content.subtitle}</p>
                  )}

                  {/* 描述 */}
                  {content.description && (
                    <p className="text-gray-500 text-sm line-clamp-3">
                      {content.description}
                    </p>
                  )}

                  {/* 查看箭头 */}
                  <div className="mt-4 flex items-center text-sm text-amber-400 group-hover:gap-2 transition-all">
                    <span>开始学习</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 小探险家项目 */}
        {shouldShowEarth && filteredEarthProjects.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🌍 地球课程 - 小探险家项目
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              来自"欢迎来到地球"课程的动手实践项目，帮助你将学到的知识应用到实际中
            </p>

            {filteredEarthProjects.map((stage) => (
              <div key={stage.id} className="mb-8">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">
                  {stage.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stage.explorer_projects.map((project, idx) => (
                    <ExplorerProjectCard
                      key={`${stage.id}-${idx}`}
                      project={project}
                      index={idx}
                      source="earth"
                      stageTitle={`第${stage.sequence_number}阶段`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 伊卡洛斯和社区项目 */}
        {shouldShowIcarus && filteredIcarusByType.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              {selectedType === 'icarus' && '🚀 伊卡洛斯项目'}
              {selectedType === 'community' && '👥 社区项目'}
              {selectedType === 'all' && '🚀 伊卡洛斯 & 社区项目'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {selectedType === 'icarus' && '官方策划的PBL项目，系统化的学习路径'}
              {selectedType === 'community' && '由学习者创建的创新项目，激发无限可能'}
              {selectedType === 'all' && 'PBL项目式学习，理论与实践相结合'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIcarusByType.map(project => {
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
                      {!project.is_system && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                          社区项目
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
                        创建者: {project.creator.full_name || project.creator.email}
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
          </div>
        )}

        {/* 空状态 */}
        {!shouldShowEarth && !shouldShowIcarus && (
          <div className="text-center py-12 text-gray-500">
            请选择项目类型
          </div>
        )}

        {shouldShowEarth && filteredEarthProjects.length === 0 && filteredEarthContents.length === 0 &&
         shouldShowIcarus && filteredIcarusByType.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery
              ? '没有找到符合条件的项目'
              : '暂无可用项目'}
          </div>
        )}
      </div>
    </div>
  )
}
