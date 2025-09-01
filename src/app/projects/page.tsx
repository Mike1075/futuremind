'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Calendar, MessageSquare, FileText, Plus, Search, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  title: string
  description: string
  members: number
  maxMembers: number
  startDate: string
  endDate: string
  status: 'recruiting' | 'active' | 'completed'
  category: 'meditation' | 'listening' | 'observation' | 'discussion'
  leader: string
  tags: string[]
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: '声音的交响：集体聆听实验',
    description: '一起探索自然声音对意识状态的影响，通过集体聆听创造共同的觉察体验',
    members: 8,
    maxMembers: 12,
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    status: 'recruiting',
    category: 'listening',
    leader: '张明',
    tags: ['自然声音', '集体体验', '意识探索']
  },
  {
    id: '2',
    title: '克里希那穆提思想研讨',
    description: '深入研读克里希那穆提的核心思想，通过讨论和实践加深理解',
    members: 15,
    maxMembers: 20,
    startDate: '2024-01-10',
    endDate: '2024-03-10',
    status: 'active',
    category: 'discussion',
    leader: '李华',
    tags: ['哲学思辨', '经典研读', '思想交流']
  },
  {
    id: '3',
    title: '观察者的训练营',
    description: '通过系统性的观察练习，培养纯粹的观察能力，不带判断地看待一切',
    members: 6,
    maxMembers: 10,
    startDate: '2024-01-20',
    endDate: '2024-02-20',
    status: 'recruiting',
    category: 'observation',
    leader: '王芳',
    tags: ['观察训练', '正念练习', '意识觉察']
  },
  {
    id: '4',
    title: '寂静中的冥想之旅',
    description: '21天集体冥想挑战，在寂静中探索内在的无限空间',
    members: 25,
    maxMembers: 30,
    startDate: '2023-12-01',
    endDate: '2023-12-21',
    status: 'completed',
    category: 'meditation',
    leader: '陈静',
    tags: ['冥想挑战', '内在探索', '集体修行']
  }
]

const statusColors = {
  recruiting: 'bg-green-500',
  active: 'bg-blue-500',
  completed: 'bg-gray-500'
}

const statusLabels = {
  recruiting: '招募中',
  active: '进行中',
  completed: '已完成'
}

const categoryLabels = {
  meditation: '冥想',
  listening: '聆听',
  observation: '观察',
  discussion: '讨论'
}

export default function ProjectsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(mockProjects)

  useEffect(() => {
    let filtered = mockProjects

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(project => project.category === selectedCategory)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(project => project.status === selectedStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredProjects(filtered)
  }, [selectedCategory, selectedStatus, searchTerm])

  const handleProjectClick = (projectId: string) => {
    console.log('跳转到项目详情:', projectId)
  }

  const handleJoinProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('加入项目:', projectId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回
            </button>
            <h1 className="text-xl font-semibold text-white">项目协作</h1>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center text-sm transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              创建项目
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索项目..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center text-gray-300 mr-4">
              <Filter className="w-4 h-4 mr-2" />
              筛选:
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">所有类别</option>
              <option value="meditation">冥想</option>
              <option value="listening">聆听</option>
              <option value="observation">观察</option>
              <option value="discussion">讨论</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">所有状态</option>
              <option value="recruiting">招募中</option>
              <option value="active">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer"
              onClick={() => handleProjectClick(project.id)}
              whileHover={{ scale: 1.02 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                      {categoryLabels[project.category]}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {project.title}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {project.members}/{project.maxMembers} 成员
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(project.startDate).toLocaleDateString()}
                </div>
                <div className="text-gray-300">
                  负责人: {project.leader}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-400 text-sm">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  讨论区
                </div>
                {project.status === 'recruiting' && (
                  <button
                    onClick={(e) => handleJoinProject(project.id, e)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    加入项目
                  </button>
                )}
                {project.status === 'active' && (
                  <button
                    onClick={(e) => handleJoinProject(project.id, e)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    查看详情
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">暂无匹配的项目</p>
              <p className="text-sm">尝试调整搜索条件或创建新项目</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}