"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { PBLProject } from '@/lib/pbl-data'
import { pblDataService } from '@/lib/pbl-real-data'
import { ProjectCard } from './ProjectCard'
import { ProjectFilters } from './ProjectFilters'
import { CreateProjectModal, ProjectFormData } from './CreateProjectModal'
import {
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Layers,
  Target,
  ArrowUpDown,
  Sparkles
} from 'lucide-react'

interface ProjectExplorerProps {
  onProjectSelect: (projectId: string) => void
}

type ViewMode = 'grid' | 'list' | 'stages' | 'modules'
type SortOption = 'latest' | 'popular' | 'difficulty' | 'participants'

export function ProjectExplorer({ onProjectSelect }: ProjectExplorerProps) {
  const [projects, setProjects] = useState<PBLProject[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 筛选状态
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('latest')

  // 加载项目数据
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await pblDataService.getProjects()
      setProjects(data)
    } catch (error) {
      // 加载失败时静默处理
    } finally {
      setLoading(false)
    }
  }

  // 获取年龄阶段
  const getAgeStage = (project: PBLProject): string => {
    if (project.tags.includes('儿童教育') || project.difficulty_level === 'beginner') {
      return 'elementary'
    } else if (project.difficulty_level === 'intermediate') {
      return 'middle'
    } else if (project.difficulty_level === 'advanced') {
      return 'high'
    } else {
      return 'adult'
    }
  }

  // 获取模块分组
  const getModule = (project: PBLProject): number => {
    const title = project.title
    if (title.includes('宠物') || title.includes('薛定谔') || title.includes('贝尔') || title.includes('全球意识场')) {
      return 1
    } else if (title.includes('植物') || title.includes('蚁巢') || title.includes('水实验') || title.includes('意识地理')) {
      return 2
    } else {
      return 3
    }
  }

  // 筛选和排序逻辑
  const filteredProjects = useMemo(() => {
    let result = [...projects]

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory)
    }

    // 难度过滤
    if (selectedDifficulty !== 'all') {
      result = result.filter(p => p.difficulty_level === selectedDifficulty)
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      result = result.filter(p => p.status === selectedStatus)
    }

    // 年龄阶段过滤
    if (selectedStage !== 'all') {
      result = result.filter(p => getAgeStage(p) === selectedStage)
    }

    // 排序
    switch (sortBy) {
      case 'latest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'popular':
        result.sort((a, b) => b.current_participants - a.current_participants)
        break
      case 'difficulty':
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
        result.sort((a, b) => difficultyOrder[a.difficulty_level] - difficultyOrder[b.difficulty_level])
        break
      case 'participants':
        result.sort((a, b) => {
          const rateA = a.current_participants / a.max_participants
          const rateB = b.current_participants / b.max_participants
          return rateB - rateA
        })
        break
    }

    return result
  }, [projects, searchQuery, selectedCategory, selectedDifficulty, selectedStatus, selectedStage, sortBy])

  // 按年龄阶段分组
  const groupedProjects = useMemo(() => {
    return {
      elementary: filteredProjects.filter(p => getAgeStage(p) === 'elementary'),
      middle: filteredProjects.filter(p => getAgeStage(p) === 'middle'),
      high: filteredProjects.filter(p => getAgeStage(p) === 'high'),
      adult: filteredProjects.filter(p => getAgeStage(p) === 'adult')
    }
  }, [filteredProjects])

  // 按模块分组
  const groupedModules = useMemo(() => {
    return {
      module1: filteredProjects.filter(p => getModule(p) === 1),
      module2: filteredProjects.filter(p => getModule(p) === 2),
      module3: filteredProjects.filter(p => getModule(p) === 3)
    }
  }, [filteredProjects])

  // 统计信息
  const categoryStats = useMemo(() => {
    return {
      all: projects.length,
      consciousness: projects.filter(p => p.category === 'consciousness').length,
      science: projects.filter(p => p.category === 'science').length,
      guidance: projects.filter(p => p.category === 'guidance').length
    }
  }, [projects])

  const stageStats = useMemo(() => {
    return {
      all: projects.length,
      elementary: projects.filter(p => getAgeStage(p) === 'elementary').length,
      middle: projects.filter(p => getAgeStage(p) === 'middle').length,
      high: projects.filter(p => getAgeStage(p) === 'high').length,
      adult: projects.filter(p => getAgeStage(p) === 'adult').length
    }
  }, [projects])

  const handleCreateProject = async (projectData: ProjectFormData) => {
    setIsCreating(true)
    try {
      // 这里应该调用API创建项目
      // 模拟创建延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      setShowCreateProject(false)
      // 重新加载项目列表
      await loadProjects()
    } catch (error) {
      console.error('创建项目失败:', error)
      alert('创建项目失败，请稍后重试')
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-pulse" />
          <p className="text-cosmic-400">加载探索项目中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* 顶部工具栏 */}
      <div className="bg-cosmic-800/50 backdrop-blur-sm border-b border-cosmic-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">探索者联盟</h1>
            <p className="text-cosmic-400 text-sm">发现志同道合的探索伙伴，开启意识探索之旅</p>
          </div>

          <div className="flex items-center gap-4">
            {/* 排序选择 */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-cosmic-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input-cosmic text-sm py-2"
              >
                <option value="latest">最新发布</option>
                <option value="popular">最受欢迎</option>
                <option value="difficulty">难度排序</option>
                <option value="participants">参与度</option>
              </select>
            </div>

            {/* 创建项目按钮 */}
            <button
              onClick={() => setShowCreateProject(true)}
              className="btn-cosmic flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              创建项目
            </button>

            {/* 视图切换 */}
            <div className="flex items-center gap-1 bg-cosmic-800/50 rounded-lg p-1 border border-cosmic-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-cosmic-400 hover:text-white'
                  }`}
                title="网格视图"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-cosmic-400 hover:text-white'
                  }`}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('stages')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'stages'
                    ? 'bg-primary-600 text-white'
                    : 'text-cosmic-400 hover:text-white'
                  }`}
                title="阶段分组视图"
              >
                <Target className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('modules')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'modules'
                    ? 'bg-primary-600 text-white'
                    : 'text-cosmic-400 hover:text-white'
                  }`}
                title="模块分组视图"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 搜索和过滤器 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cosmic-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目、标签或关键词..."
              className="input-cosmic pl-10 w-full"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-cosmic-outline flex items-center ${showFilters ? 'bg-primary-600/20 border-primary-500' : ''
              }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>

        {/* 分类标签 */}
        <div className="space-y-3 mt-4">
          {/* 项目类别 */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <span className="text-sm text-cosmic-400 font-medium">项目类别:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              全部 ({categoryStats.all})
            </button>
            <button
              onClick={() => setSelectedCategory('consciousness')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedCategory === 'consciousness'
                  ? 'bg-resonance-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              意识探索 ({categoryStats.consciousness})
            </button>
            <button
              onClick={() => setSelectedCategory('science')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedCategory === 'science'
                  ? 'bg-blue-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              科学研究 ({categoryStats.science})
            </button>
            <button
              onClick={() => setSelectedCategory('guidance')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedCategory === 'guidance'
                  ? 'bg-green-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              学习引导 ({categoryStats.guidance})
            </button>
          </div>

          {/* 年龄阶段 */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <span className="text-sm text-cosmic-400 font-medium">年龄阶段:</span>
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedStage === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              全部 ({stageStats.all})
            </button>
            <button
              onClick={() => setSelectedStage('elementary')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedStage === 'elementary'
                  ? 'bg-green-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              小学阶段 ({stageStats.elementary})
            </button>
            <button
              onClick={() => setSelectedStage('middle')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedStage === 'middle'
                  ? 'bg-blue-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              初中阶段 ({stageStats.middle})
            </button>
            <button
              onClick={() => setSelectedStage('high')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedStage === 'high'
                  ? 'bg-orange-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              高中阶段 ({stageStats.high})
            </button>
            <button
              onClick={() => setSelectedStage('adult')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedStage === 'adult'
                  ? 'bg-purple-600 text-white'
                  : 'bg-cosmic-700/50 text-cosmic-300 hover:bg-cosmic-700 hover:text-white'
                }`}
            >
              成人阶段 ({stageStats.adult})
            </button>
          </div>
        </div>
      </div>

      {/* 过滤器面板 */}
      {showFilters && (
        <ProjectFilters
          selectedDifficulty={selectedDifficulty}
          selectedStatus={selectedStatus}
          onDifficultyChange={setSelectedDifficulty}
          onStatusChange={setSelectedStatus}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* 项目列表 */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'modules' ? (
          // 模块分组视图
          <div className="space-y-8">
            {/* 模块一：无形的纽带 */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-bold text-white">模块一：无形的纽带</h2>
                <span className="ml-2 text-sm text-cosmic-400">从心灵感应到量子纠缠</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {groupedModules.module1.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    onClick={() => onProjectSelect(project.id)}
                  />
                ))}
              </div>
            </div>

            {/* 模块二：无形的地图 */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-bold text-white">模块二：无形的地图</h2>
                <span className="ml-2 text-sm text-cosmic-400">探索空间记忆与形态场</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {groupedModules.module2.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    onClick={() => onProjectSelect(project.id)}
                  />
                ))}
              </div>
            </div>

            {/* 模块三：延展的心灵 */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-rose-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-bold text-white">模块三：延展的心灵</h2>
                <span className="ml-2 text-sm text-cosmic-400">意识作为非定域场</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {groupedModules.module3.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    onClick={() => onProjectSelect(project.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'stages' ? (
          // 阶段分组视图
          <div className="space-y-8">
            {/* 小学阶段 */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-bold text-white">小学阶段 (6-12岁)</h2>
                <span className="ml-2 text-sm text-cosmic-400">启蒙探索</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects.elementary.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    onClick={() => onProjectSelect(project.id)}
                  />
                ))}
              </div>
            </div>

            {/* 初中阶段 */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-bold text-white">初中阶段 (12-16岁)</h2>
                <span className="ml-2 text-sm text-cosmic-400">科学方法</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects.middle.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    onClick={() => onProjectSelect(project.id)}
                  />
                ))}
              </div>
            </div>

            {/* 高中阶段 */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-bold text-white">高中阶段 (16岁以上)</h2>
                <span className="ml-2 text-sm text-cosmic-400">深度研究</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects.high.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    onClick={() => onProjectSelect(project.id)}
                  />
                ))}
              </div>
            </div>

            {/* 成人阶段 */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-bold text-white">成人阶段</h2>
                <span className="ml-2 text-sm text-cosmic-400">前沿探索</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects.adult.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    onClick={() => onProjectSelect(project.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-cosmic-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">暂无匹配的项目</h3>
            <p className="text-cosmic-400">尝试调整搜索条件或筛选器</p>
          </div>
        ) : (
          <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                onClick={() => onProjectSelect(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建项目模态框 */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onConfirm={handleCreateProject}
        loading={isCreating}
      />
    </div>
  )
}
