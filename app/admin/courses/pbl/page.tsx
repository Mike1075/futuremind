'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Edit, Save, X, Trash2, Plus, Users, UsersRound,
  PawPrint, Microscope, Atom, Sprout, Bug, Droplet, MapPin,
  Palette, Eye, Dices, Waves, TreePine
} from 'lucide-react'

interface PBLProject {
  id: string
  system_id: string | null
  content_type: string
  sequence_number: number
  title: string
  subtitle: string | null  // 用于存储difficulty: beginner/intermediate/advanced/expert
  original_text: string | null
  week_plan: any | null
  day_plan: any | null
  prerequisites: any | null
  estimated_duration: number | null
  is_published: boolean | null
  created_at: string | null
  updated_at: string | null
  project_intro: string | null
  project_cover_image: string | null
  module_name: string | null
  difficulty_level: string | null
}

const FIXED_MODULES = [
  { id: 1, name: '模块一：无形的纽带', range: [1, 2, 3] },
  { id: 2, name: '模块二：无形的地图', range: [4, 5, 6, 7] },
  { id: 3, name: '模块三：延展的心灵', range: [8, 9, 10, 11] }
]

const DIFFICULTY_LABELS = {
  option_a: { label: '选项A', color: 'from-green-500 to-emerald-500', icon: '🌱' },
  option_b: { label: '选项B', color: 'from-blue-500 to-cyan-500', icon: '🌿' },
  option_c: { label: '选项C', color: 'from-purple-500 to-pink-500', icon: '🌳' },
  option_d: { label: '选项D', color: 'from-orange-500 to-red-500', icon: '🌲' }
}

// 伊卡洛斯11个项目的差异化图标映射（基于sequence_number）
const ICARUS_PROJECT_ICONS: Record<number, any> = {
  1: PawPrint,      // 宠物侦探
  2: Microscope,    // 杰提计划
  3: Atom,          // 贝尔不等式
  4: Sprout,        // 植物的悄悄话
  5: Bug,           // 远程蚁巢
  6: Droplet,       // 记忆的水实验
  7: MapPin,        // 意识地理学
  8: Palette,       // 情绪的颜色
  9: Eye,           // 跨越距离的凝视
  10: Dices,        // 意念撼动概率
  11: Waves         // 幻肢与纠缠
}

// 获取项目图标（根据sequence_number）
const getProjectIcon = (sequenceNumber: number) => {
  return ICARUS_PROJECT_ICONS[sequenceNumber] || TreePine
}

export default function IcarusAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [projects, setProjects] = useState<PBLProject[]>([])
  const [selectedProject, setSelectedProject] = useState<PBLProject | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [icarusSystemId, setIcarusSystemId] = useState<string | null>(null)

  // 表单状态 - 使用结构化数据
  const [formData, setFormData] = useState<{
    title: string
    subtitle: string
    original_text: string
    project_intro: string
    project_cover_image: string
    module_name: string
    difficulty_level: string
    week_plan: Array<{
      week: number
      theme: string
      goals: string[]
      activities: Array<{
        day: string
        title: string
        description: string
        deliverables: string[]
      }>
    }>
    prerequisites: Array<{
      type: string
      description: string
    }>
    estimated_duration: number
  }>({
    title: '',
    subtitle: '',
    original_text: '',
    project_intro: '',
    project_cover_image: '',
    module_name: '',
    difficulty_level: '',
    week_plan: [],
    prerequisites: [],
    estimated_duration: 0
  })

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      setFormData({
        title: selectedProject.title || '',
        subtitle: selectedProject.subtitle || '',
        original_text: selectedProject.original_text || '',
        project_intro: selectedProject.project_intro || '',
        project_cover_image: selectedProject.project_cover_image || '',
        module_name: selectedProject.module_name || '',
        difficulty_level: selectedProject.difficulty_level || '',
        week_plan: Array.isArray(selectedProject.week_plan) ? selectedProject.week_plan : [],
        prerequisites: Array.isArray(selectedProject.prerequisites) ? selectedProject.prerequisites : [],
        estimated_duration: selectedProject.estimated_duration || 0
      })
    }
  }, [selectedProject])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      await loadProjects()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const supabase = createClient()

      // Get icarus system ID
      const { data: systemData, error: systemError } = await supabase
        .from('course_systems')
        .select('id')
        .eq('system_key', 'icarus')
        .single()

      if (systemError) throw systemError
      setIcarusSystemId(systemData.id)

      // Get all PBL projects
      const { data, error } = await supabase
        .from('course_contents')
        .select('*')
        .eq('system_id', systemData.id)
        .eq('content_type', 'icarus')
        .order('sequence_number', { ascending: true })

      if (error) throw error
      setProjects((data as unknown as PBLProject[]) || [])
    } catch (error) {
      console.error('加载项目列表失败:', error)
    }
  }

  // 动态计算所有模块（包括固定模块和新增模块）
  const getAllModules = () => {
    if (projects.length === 0) return FIXED_MODULES

    const maxSeq = Math.max(...projects.map(p => p.sequence_number))
    const modules = [...FIXED_MODULES]

    // 如果有sequence_number >= 13的项目，说明有新增模块
    if (maxSeq >= 13) {
      const additionalModules = Math.floor((maxSeq - 12) / 4)
      for (let i = 1; i <= additionalModules; i++) {
        const startSeq = 9 + i * 4
        modules.push({
          id: 3 + i,
          name: `模块${3 + i}`,
          range: [startSeq, startSeq + 1, startSeq + 2, startSeq + 3]
        })
      }
    }

    return modules
  }

  const handleAddModule = async () => {
    if (!icarusSystemId) return

    const moduleName = prompt('请输入新模块名称:', `模块${getAllModules().length + 1}`)
    if (!moduleName) return

    try {
      const supabase = createClient()
      const maxSeq = projects.length > 0 ? Math.max(...projects.map(p => p.sequence_number)) : 12
      const startSeq = maxSeq + 1

      // 创建4个新项目（选项A/B/C/D）
      const newProjects = [
        { subtitle: 'option_a', title: `${moduleName} - 选项A` },
        { subtitle: 'option_b', title: `${moduleName} - 选项B` },
        { subtitle: 'option_c', title: `${moduleName} - 选项C` },
        { subtitle: 'option_d', title: `${moduleName} - 选项D` }
      ]

      for (let i = 0; i < 4; i++) {
        const { error } = await supabase
          .from('course_contents')
          .insert({
            system_id: icarusSystemId,
            content_type: 'icarus',
            sequence_number: startSeq + i,
            title: newProjects[i].title,
            subtitle: newProjects[i].subtitle,
            original_text: '',
            week_plan: [],
            day_plan: [],
            prerequisites: [],
            estimated_duration: 30,
            is_published: true,
            review_status: 'approved',
            project_visibility: 'system'
          })

        if (error) throw error
      }

      alert('新增模块成功！')
      await loadProjects()
    } catch (error) {
      console.error('新增模块失败:', error)
      alert('新增模块失败，请重试')
    }
  }

  const handleDeleteModule = async (moduleId: number, range: number[]) => {
    // 只能删除sequence_number >= 13的模块
    if (range[0] < 13) {
      alert('系统默认的前3个模块不能删除')
      return
    }

    if (!confirm(`确定要删除${getAllModules().find(m => m.id === moduleId)?.name}吗？删除后将无法恢复。`)) return

    try {
      const supabase = createClient()

      // 删除该模块的所有4个项目
      for (const seq of range) {
        const project = projects.find(p => p.sequence_number === seq)
        if (project) {
          // 先删除关联的媒体资源
          await supabase
            .from('media_resources')
            .delete()
            .eq('course_content_id', project.id)

          // 删除项目
          const { error } = await supabase
            .from('course_contents')
            .delete()
            .eq('id', project.id)

          if (error) throw error
        }
      }

      alert('删除成功！')
      await loadProjects()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleSave = async () => {
    if (!selectedProject) return

    setSaving(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('course_contents')
        .update({
          title: formData.title,
          subtitle: formData.subtitle,
          original_text: formData.original_text,
          project_intro: formData.project_intro,
          project_cover_image: formData.project_cover_image,
          module_name: formData.module_name,
          difficulty_level: formData.difficulty_level,
          week_plan: formData.week_plan,
          day_plan: [],  // day_plan不再使用，保留空数组
          prerequisites: formData.prerequisites,
          estimated_duration: formData.estimated_duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProject.id)

      if (error) throw error

      alert('保存成功！')
      setEditMode(false)
      await loadProjects()
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const getProjectBySequence = (seq: number): PBLProject | undefined => {
    return projects.find(p => p.sequence_number === seq)
  }

  // Week Plan 管理函数
  const addWeek = () => {
    const newWeek = {
      week: formData.week_plan.length + 1,
      theme: '',
      goals: [],
      activities: []
    }
    setFormData({ ...formData, week_plan: [...formData.week_plan, newWeek] })
  }

  const removeWeek = (index: number) => {
    const newWeekPlan = formData.week_plan.filter((_, i) => i !== index)
    // 重新编号
    newWeekPlan.forEach((week, i) => week.week = i + 1)
    setFormData({ ...formData, week_plan: newWeekPlan })
  }

  const updateWeek = (index: number, field: 'theme', value: string) => {
    const newWeekPlan = [...formData.week_plan]
    newWeekPlan[index] = { ...newWeekPlan[index], [field]: value }
    setFormData({ ...formData, week_plan: newWeekPlan })
  }

  const addGoal = (weekIndex: number) => {
    const newWeekPlan = [...formData.week_plan]
    newWeekPlan[weekIndex].goals.push('')
    setFormData({ ...formData, week_plan: newWeekPlan })
  }

  const updateGoal = (weekIndex: number, goalIndex: number, value: string) => {
    const newWeekPlan = [...formData.week_plan]
    newWeekPlan[weekIndex].goals[goalIndex] = value
    setFormData({ ...formData, week_plan: newWeekPlan })
  }

  const removeGoal = (weekIndex: number, goalIndex: number) => {
    const newWeekPlan = [...formData.week_plan]
    newWeekPlan[weekIndex].goals = newWeekPlan[weekIndex].goals.filter((_, i) => i !== goalIndex)
    setFormData({ ...formData, week_plan: newWeekPlan })
  }

  const addActivity = (weekIndex: number) => {
    const newWeekPlan = [...formData.week_plan]
    newWeekPlan[weekIndex].activities.push({
      day: '',
      title: '',
      description: '',
      deliverables: []
    })
    setFormData({ ...formData, week_plan: newWeekPlan })
  }

  const updateActivity = (weekIndex: number, activityIndex: number, field: 'day' | 'title' | 'description', value: string) => {
    const newWeekPlan = [...formData.week_plan]
    newWeekPlan[weekIndex].activities[activityIndex] = {
      ...newWeekPlan[weekIndex].activities[activityIndex],
      [field]: value
    }
    setFormData({ ...formData, week_plan: newWeekPlan })
  }

  const removeActivity = (weekIndex: number, activityIndex: number) => {
    const newWeekPlan = [...formData.week_plan]
    newWeekPlan[weekIndex].activities = newWeekPlan[weekIndex].activities.filter((_, i) => i !== activityIndex)
    setFormData({ ...formData, week_plan: newWeekPlan })
  }

  // Prerequisites 管理函数
  const addPrerequisite = () => {
    setFormData({
      ...formData,
      prerequisites: [...formData.prerequisites, { type: '', description: '' }]
    })
  }

  const updatePrerequisite = (index: number, field: 'type' | 'description', value: string) => {
    const newPrerequisites = [...formData.prerequisites]
    newPrerequisites[index] = { ...newPrerequisites[index], [field]: value }
    setFormData({ ...formData, prerequisites: newPrerequisites })
  }

  const removePrerequisite = (index: number) => {
    setFormData({
      ...formData,
      prerequisites: formData.prerequisites.filter((_, i) => i !== index)
    })
  }

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 星空背景 */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* 顶部栏 */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/courses')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">伊卡洛斯计划</h1>
              <p className="text-gray-400 text-sm">探索现实的边缘 - PBL项目体系</p>
            </div>
          </div>

          {/* 管理功能按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/courses/pbl/students')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 rounded-lg transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-orange-400" />
              <span className="text-white text-sm">选课学员</span>
            </button>
            <button
              onClick={() => router.push('/admin/courses/pbl/groups')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 rounded-lg transition-all flex items-center gap-2"
            >
              <UsersRound className="w-4 h-4 text-pink-400" />
              <span className="text-white text-sm">课程分组</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {!selectedProject ? (
          /* 矩阵视图 */
          <div className="space-y-8">
            {getAllModules().map((module) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: module.id * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 relative"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">{module.name}</h2>
                  {module.range[0] >= 13 && (
                    <button
                      onClick={() => handleDeleteModule(module.id, module.range)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all flex items-center gap-2"
                      title="删除模块"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除模块
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {module.range.map((seq) => {
                    const project = getProjectBySequence(seq)
                    const ProjectIcon = getProjectIcon(seq) // 获取对应的图标组件
                    const weekCount = project?.week_plan ? (Array.isArray(project.week_plan) ? project.week_plan.length : 0) : 0

                    return (
                      <motion.div
                        key={seq}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-green-500 to-emerald-500 p-0.5 rounded-lg cursor-pointer"
                        onClick={() => project && router.push(`/admin/courses/pbl/projects/${project.id}`)}
                      >
                        <div className="bg-black/90 p-6 rounded-lg h-full">
                          <div className="flex items-center justify-between mb-3">
                            {/* 使用Lucide图标代替emoji */}
                            <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg">
                              <ProjectIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs text-white/60">{weekCount}周</span>
                          </div>
                          <p className="text-sm font-bold text-white mb-2 line-clamp-2">
                            {project?.title || '未创建'}
                          </p>
                          {project && Array.isArray(project.week_plan) && (
                            <div className="mt-3 text-xs text-purple-300">
                              {project.week_plan.length} 周计划
                            </div>
                          )}
                          {project && (
                            <div className="mt-4 flex items-center gap-2">
                              <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                <Edit className="w-3 h-3" />
                                编辑
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}

            {/* 新增模块按钮 */}
            <motion.button
              onClick={handleAddModule}
              whileHover={{ scale: 1.02 }}
              className="w-full p-6 bg-white/5 hover:bg-white/10 backdrop-blur-sm border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-6 h-6 text-purple-400" />
              <span className="text-lg font-medium text-white">新增模块</span>
            </motion.button>
          </div>
        ) : (
          /* 详细编辑视图 */
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedProject(null)
                    setEditMode(false)
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-xl font-bold text-white">
                  第{selectedProject.sequence_number}阶段：{selectedProject.title}
                </h2>
              </div>
              <button
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : editMode ? (
                  <>
                    <Save className="w-4 h-4" />
                    保存
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    编辑
                  </>
                )}
              </button>
            </div>

            <div className="space-y-6">
              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">项目标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              {/* 项目简介 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">项目简介</label>
                <textarea
                  value={formData.project_intro}
                  onChange={(e) => setFormData({ ...formData, project_intro: e.target.value })}
                  disabled={!editMode}
                  rows={4}
                  placeholder="输入项目简介，用于在项目列表页显示..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">建议150-200字，简明扼要地介绍项目的核心价值和学习目标</p>
              </div>

              {/* 模块和难度 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">所属模块</label>
                  <input
                    type="text"
                    value={formData.module_name}
                    onChange={(e) => setFormData({ ...formData, module_name: e.target.value })}
                    disabled={!editMode}
                    placeholder="例如：模块1：观察与感知"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">难度级别</label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  >
                    <option value="">请选择...</option>
                    <option value="基础探索">基础探索</option>
                    <option value="进阶挑战">进阶挑战</option>
                    <option value="深度研究">深度研究</option>
                    <option value="创新实践">创新实践</option>
                  </select>
                </div>
              </div>

              {/* 封面图片 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">封面图片URL</label>
                <input
                  type="text"
                  value={formData.project_cover_image}
                  onChange={(e) => setFormData({ ...formData, project_cover_image: e.target.value })}
                  disabled={!editMode}
                  placeholder="输入图片URL（可选）"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                {formData.project_cover_image && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">封面图片预览：</p>
                    <img
                      src={formData.project_cover_image}
                      alt="封面预览"
                      className="max-w-sm h-48 object-cover rounded-lg border border-white/10"
                      onError={(e) => {
                        e.currentTarget.src = ''
                        e.currentTarget.alt = '图片加载失败'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 核心问题 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">核心问题（Original Text）</label>
                <textarea
                  value={formData.original_text}
                  onChange={(e) => setFormData({ ...formData, original_text: e.target.value })}
                  disabled={!editMode}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              {/* 预计时长 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">预计时长（天）</label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              {/* 周计划编辑器 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-white">周计划</label>
                  {editMode && (
                    <button
                      onClick={addWeek}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      添加周
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.week_plan.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400">暂无周计划{editMode ? '，点击"添加周"开始创建' : ''}</p>
                    </div>
                  ) : (
                    formData.week_plan.map((week, weekIndex) => (
                      <div key={weekIndex} className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-md font-bold text-white">第 {week.week} 周</h3>
                          {editMode && (
                            <button
                              onClick={() => removeWeek(weekIndex)}
                              className="p-1 hover:bg-red-600/20 text-red-400 rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* 主题 */}
                        <div className="mb-4">
                          <label className="block text-sm text-gray-400 mb-2">主题</label>
                          <input
                            type="text"
                            value={week.theme}
                            onChange={(e) => updateWeek(weekIndex, 'theme', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                            placeholder="输入本周主题..."
                          />
                        </div>

                        {/* 目标 */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-gray-400">本周目标</label>
                            {editMode && (
                              <button
                                onClick={() => addGoal(weekIndex)}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                添加目标
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {week.goals.map((goal, goalIndex) => (
                              <div key={goalIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={goal}
                                  onChange={(e) => updateGoal(weekIndex, goalIndex, e.target.value)}
                                  disabled={!editMode}
                                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                  placeholder={`目标 ${goalIndex + 1}`}
                                />
                                {editMode && (
                                  <button
                                    onClick={() => removeGoal(weekIndex, goalIndex)}
                                    className="p-2 hover:bg-red-600/20 text-red-400 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 活动 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-gray-400">本周活动</label>
                            {editMode && (
                              <button
                                onClick={() => addActivity(weekIndex)}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                添加活动
                              </button>
                            )}
                          </div>
                          <div className="space-y-3">
                            {week.activities.map((activity, actIndex) => (
                              <div key={actIndex} className="bg-white/5 p-3 rounded border border-white/10">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs text-purple-400">活动 {actIndex + 1}</span>
                                  {editMode && (
                                    <button
                                      onClick={() => removeActivity(weekIndex, actIndex)}
                                      className="p-1 hover:bg-red-600/20 text-red-400 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={activity.day}
                                    onChange={(e) => updateActivity(weekIndex, actIndex, 'day', e.target.value)}
                                    disabled={!editMode}
                                    placeholder="日期/时间"
                                    className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                  />
                                  <input
                                    type="text"
                                    value={activity.title}
                                    onChange={(e) => updateActivity(weekIndex, actIndex, 'title', e.target.value)}
                                    disabled={!editMode}
                                    placeholder="活动标题"
                                    className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                  />
                                  <textarea
                                    value={activity.description}
                                    onChange={(e) => updateActivity(weekIndex, actIndex, 'description', e.target.value)}
                                    disabled={!editMode}
                                    placeholder="活动描述"
                                    rows={2}
                                    className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 前置要求编辑器 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-white">前置要求</label>
                  {editMode && (
                    <button
                      onClick={addPrerequisite}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      添加要求
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.prerequisites.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400">暂无前置要求{editMode ? '，点击"添加要求"开始创建' : ''}</p>
                    </div>
                  ) : (
                    formData.prerequisites.map((prereq, index) => (
                      <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">类型</label>
                              <input
                                type="text"
                                value={prereq.type}
                                onChange={(e) => updatePrerequisite(index, 'type', e.target.value)}
                                disabled={!editMode}
                                placeholder="如：基础知识、技能要求、设备需求等"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">描述</label>
                              <textarea
                                value={prereq.description}
                                onChange={(e) => updatePrerequisite(index, 'description', e.target.value)}
                                disabled={!editMode}
                                placeholder="详细说明此项要求..."
                                rows={3}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                              />
                            </div>
                          </div>
                          {editMode && (
                            <button
                              onClick={() => removePrerequisite(index)}
                              className="p-2 hover:bg-red-600/20 text-red-400 rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
