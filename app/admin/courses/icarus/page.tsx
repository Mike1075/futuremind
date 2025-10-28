'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Save, X } from 'lucide-react'

interface PBLProject {
  id: string
  system_id: string
  content_type: string
  sequence_number: number
  title: string
  subtitle: string  // 用于存储difficulty: beginner/intermediate/advanced/expert
  original_text: string
  week_plan: any
  day_plan: any
  prerequisites: any
  estimated_duration: number
  is_published: boolean
  created_at: string
  updated_at: string
}

const MODULES = [
  { id: 1, name: '模块一：无形的纽带', range: [1, 2, 3, 4] },
  { id: 2, name: '模块二：无形的地图', range: [5, 6, 7, 8] },
  { id: 3, name: '模块三：延展的心灵', range: [9, 10, 11, 12] }
]

const DIFFICULTY_LABELS = {
  beginner: { label: '小学', color: 'from-green-500 to-emerald-500', icon: '🌱' },
  intermediate: { label: '初中', color: 'from-blue-500 to-cyan-500', icon: '🌿' },
  advanced: { label: '高中', color: 'from-purple-500 to-pink-500', icon: '🌳' },
  expert: { label: '成人', color: 'from-orange-500 to-red-500', icon: '🌲' }
}

export default function IcarusAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [projects, setProjects] = useState<PBLProject[]>([])
  const [selectedProject, setSelectedProject] = useState<PBLProject | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    original_text: '',
    week_plan: '',
    day_plan: '',
    prerequisites: '',
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
        week_plan: JSON.stringify(selectedProject.week_plan, null, 2) || '',
        day_plan: JSON.stringify(selectedProject.day_plan, null, 2) || '',
        prerequisites: JSON.stringify(selectedProject.prerequisites, null, 2) || '',
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
      const { data: systemData, error: systemError } = await (supabase
        .from('course_systems') as any)
        .select('id')
        .eq('system_key', 'icarus')
        .single()

      if (systemError) throw systemError

      // Get all PBL projects
      const { data, error } = await (supabase
        .from('course_contents') as any)
        .select('*')
        .eq('system_id', systemData.id)
        .eq('content_type', 'pbl_project')
        .order('sequence_number', { ascending: true })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('加载项目列表失败:', error)
    }
  }

  const handleSave = async () => {
    if (!selectedProject) return

    setSaving(true)
    try {
      const supabase = createClient()

      // Parse JSON fields
      const weekPlan = formData.week_plan ? JSON.parse(formData.week_plan) : []
      const dayPlan = formData.day_plan ? JSON.parse(formData.day_plan) : []
      const prerequisites = formData.prerequisites ? JSON.parse(formData.prerequisites) : []

      const { error } = await (supabase
        .from('course_contents') as any)
        .update({
          title: formData.title,
          subtitle: formData.subtitle,
          original_text: formData.original_text,
          week_plan: weekPlan,
          day_plan: dayPlan,
          prerequisites: prerequisites,
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
      alert('保存失败，请检查JSON格式')
    } finally {
      setSaving(false)
    }
  }

  const getProjectBySequence = (seq: number): PBLProject | undefined => {
    return projects.find(p => p.sequence_number === seq)
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {!selectedProject ? (
          /* 矩阵视图 */
          <div className="space-y-8">
            {MODULES.map((module) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: module.id * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">{module.name}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {module.range.map((seq) => {
                    const project = getProjectBySequence(seq)
                    const difficulty = project?.subtitle as keyof typeof DIFFICULTY_LABELS || 'beginner'
                    const diffConfig = DIFFICULTY_LABELS[difficulty]

                    return (
                      <motion.div
                        key={seq}
                        whileHover={{ scale: 1.02 }}
                        className={`bg-gradient-to-br ${diffConfig.color} p-0.5 rounded-lg cursor-pointer`}
                        onClick={() => project && setSelectedProject(project)}
                      >
                        <div className="bg-black/90 p-6 rounded-lg h-full">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl">{diffConfig.icon}</span>
                            <span className="text-xs text-white/60">{project?.estimated_duration || 0}天</span>
                          </div>
                          <h3 className="text-sm font-bold text-white mb-2">{diffConfig.label}</h3>
                          <p className="text-xs text-white/80 line-clamp-2">
                            {project?.title || '未创建'}
                          </p>
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
                  {DIFFICULTY_LABELS[selectedProject.subtitle as keyof typeof DIFFICULTY_LABELS]?.label} -
                  {selectedProject.title}
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

              {/* Week Plan (JSON) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">周计划（Week Plan - JSON格式）</label>
                <textarea
                  value={formData.week_plan}
                  onChange={(e) => setFormData({ ...formData, week_plan: e.target.value })}
                  disabled={!editMode}
                  rows={10}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  placeholder='[{"week": 1, "theme": "主题", "goals": [], "activities": []}]'
                />
              </div>

              {/* Prerequisites (JSON) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">前置要求（Prerequisites - JSON格式）</label>
                <textarea
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  disabled={!editMode}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  placeholder='[{"type": "none", "description": "无要求"}]'
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
