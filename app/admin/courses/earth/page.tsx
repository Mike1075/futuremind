// @ts-nocheck
'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Save, Upload, FileVideo, Trash2, ChevronRight, BookOpen, Edit, Users, UsersRound } from 'lucide-react'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PromptDialog } from '@/components/ui/PromptDialog'

interface EarthStage {
  id: string
  system_id: string | null
  content_type: string
  sequence_number: number
  title: string
  subtitle: string | null
  documentary_url: string | null
  knowledge_points: any | null
  socratic_questions: any | null
  post_reflection: any | null
  estimated_duration: number | null
  is_published: boolean | null
  created_at: string | null
  updated_at: string | null
}

interface MediaResource {
  id: string
  course_content_id: string | null
  file_name: string | null
  file_url: string | null
  file_type: string | null
  file_size: number | null
  resource_type: string | null
  external_url: string | null
  created_at: string | null
}

export default function EarthCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [stages, setStages] = useState<EarthStage[]>([])
  const [selectedStage, setSelectedStage] = useState<EarthStage | null>(null)
  const [mediaResources, setMediaResources] = useState<MediaResource[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [earthSystemId, setEarthSystemId] = useState<string | null>(null)

  // Toast 状态
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success')

  // ConfirmDialog 状态
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null)

  // PromptDialog 状态
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptTitle, setPromptTitle] = useState('')
  const [promptMessage, setPromptMessage] = useState('')
  const [promptDefaultValue, setPromptDefaultValue] = useState('')
  const [promptCallback, setPromptCallback] = useState<((value: string) => void) | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmTitle(title)
    setConfirmMessage(message)
    setConfirmCallback(() => onConfirm)
    setConfirmOpen(true)
  }

  const showPrompt = (title: string, message: string, defaultValue: string, onConfirm: (value: string) => void) => {
    setPromptTitle(title)
    setPromptMessage(message)
    setPromptDefaultValue(defaultValue)
    setPromptCallback(() => onConfirm)
    setPromptOpen(true)
  }

  // 项目编辑状态
  const [showProjectEditor, setShowProjectEditor] = useState(false)
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null)
  const [projectFormData, setProjectFormData] = useState({
    id: '',
    title: '',
    subtitle: '',
    duration: '',
    goal: '',
    materials: [] as string[],
    steps: [] as string[],
    expectedOutcome: '',
    tips: [] as string[]
  })

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    documentary_url: '',
    knowledge_points: [] as string[],
    socratic_questions: {
      pre_watch: [] as string[],
      during_watch: [] as string[],
      post_watch: [] as string[]
    },
    post_reflection: [] as string[],
    estimated_duration: 60,
    explorer_projects: [] as Array<{
      id: string
      title: string
      subtitle?: string
      duration?: string
      goal?: string
      materials?: string[]
      steps?: string[]
      expectedOutcome?: string
      tips?: string[]
    }>
  })

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedStage) {
      setFormData({
        title: selectedStage.title || '',
        subtitle: selectedStage.subtitle || '',
        documentary_url: selectedStage.documentary_url || '',
        knowledge_points: selectedStage.knowledge_points || [],
        socratic_questions: selectedStage.socratic_questions || {
          pre_watch: [],
          during_watch: [],
          post_watch: []
        },
        post_reflection: selectedStage.post_reflection || [],
        estimated_duration: selectedStage.estimated_duration || 60,
        explorer_projects: (selectedStage as any).explorer_projects || []
      })
      loadMediaResources(selectedStage.id)
    }
  }, [selectedStage])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      await loadStages()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadStages = async () => {
    try {
      const supabase = createClient()

      // First, get the earth system ID
      const { data: systemData, error: systemError } = await supabase
        .from('course_systems')
        .select('id')
        .eq('system_key', 'earth')
        .maybeSingle()

      if (systemError) throw systemError
      if (!systemData) throw new Error('未找到欢迎来到地球课程体系')

      setEarthSystemId(systemData.id)

      // Then, get all stages for this system
      const { data, error } = await supabase
        .from('course_contents')
        .select('*')
        .eq('system_id', systemData.id)
        .order('sequence_number', { ascending: true })

      if (error) throw error
      setStages(data || [])
      if (data && data.length > 0) {
        setSelectedStage(data[0])
      }
    } catch (error) {
      console.error('加载课程列表失败:', error)
    }
  }

  const loadMediaResources = async (stageId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('media_resources')
        .select('*')
        .eq('course_content_id', stageId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMediaResources(data || [])
    } catch (error) {
      console.error('加载媒体资源失败:', error)
    }
  }

  const handleSave = async () => {
    if (!selectedStage) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('course_contents')
        .update({
          title: formData.title,
          subtitle: formData.subtitle,
          documentary_url: formData.documentary_url,
          knowledge_points: formData.knowledge_points,
          socratic_questions: formData.socratic_questions,
          post_reflection: formData.post_reflection,
          estimated_duration: formData.estimated_duration,
          explorer_projects: formData.explorer_projects,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStage.id)

      if (error) throw error

      showToast('保存成功！', 'success')
      await loadStages()
    } catch (error) {
      console.error('保存失败:', error)
      showToast('保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddExternalVideo = async () => {
    if (!selectedStage) return

    showPrompt('添加补充视频', '请输入补充视频URL（YouTube/Bilibili）\n\n注意：这是补充资源，不是主纪录片。', '', async (url) => {
      if (!url) return

      showPrompt('视频描述', '请输入视频描述（例如：相关资料片段、延伸阅读）:', '', async (description) => {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('media_resources')
            .insert({
              course_content_id: selectedStage.id,
              file_name: description || '补充视频',
              file_url: url,
              external_url: url,
              file_type: 'video/external',
              resource_type: 'video',
              description: description
            })

          if (error) throw error

          showToast('补充视频添加成功！', 'success')
          await loadMediaResources(selectedStage.id)
        } catch (error) {
          console.error('添加视频失败:', error)
          showToast('添加视频失败，请重试', 'error')
        }
      })
    })
  }

  const handleDeleteMedia = async (mediaId: string) => {
    showConfirm('删除确认', '确定要删除这个资源吗？', async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('media_resources')
          .delete()
          .eq('id', mediaId)

        if (error) throw error

        showToast('删除成功！', 'success')
        if (selectedStage) {
          await loadMediaResources(selectedStage.id)
        }
      } catch (error) {
        console.error('删除失败:', error)
        showToast('删除失败，请重试', 'error')
      }
    })
  }

  const handleAddNewStage = async () => {
    if (!earthSystemId) return

    const newSequenceNumber = stages.length > 0
      ? Math.max(...stages.map(s => s.sequence_number)) + 1
      : 1

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('course_contents')
        .insert({
          system_id: earthSystemId,
          content_type: 'stage',
          sequence_number: newSequenceNumber,
          title: `第${newSequenceNumber}阶段`,
          subtitle: '',
          documentary_url: '',
          knowledge_points: [],
          socratic_questions: {
            pre_watch: [],
            during_watch: [],
            post_watch: []
          },
          post_reflection: [],
          estimated_duration: 60,
          is_published: false
        })
        .select()
        .single()

      if (error) throw error

      showToast('新增成功！', 'success')
      await loadStages()
      setSelectedStage(data)
    } catch (error) {
      console.error('新增失败:', error)
      showToast('新增失败，请重试', 'error')
    }
  }

  const handleDeleteStage = async (stageId: string, sequenceNumber: number) => {
    // 保护前6个阶段的固定内容
    if (sequenceNumber <= 6) {
      showToast('前6个阶段是固定内容，不能删除，只能修改。', 'warning')
      return
    }

    showConfirm('删除确认', `确定要删除第 ${sequenceNumber} 阶段吗？删除后将无法恢复。`, async () => {
      try {
        const supabase = createClient()

        // 先删除关联的媒体资源
        const { error: mediaError } = await supabase
          .from('media_resources')
          .delete()
          .eq('course_content_id', stageId)

        if (mediaError) throw mediaError

        // 删除阶段内容
        const { error } = await supabase
          .from('course_contents')
          .delete()
          .eq('id', stageId)

        if (error) throw error

        showToast('删除成功！', 'success')

        // 如果删除的是当前选中的阶段，清空选中状态
        if (selectedStage?.id === stageId) {
          setSelectedStage(null)
        }

        await loadStages()
      } catch (error) {
        console.error('删除失败:', error)
        showToast('删除失败，请重试', 'error')
      }
    })
  }

  const handleEditVideoUrl = async (mediaId: string, currentUrl: string | null, currentName: string | null) => {
    showPrompt('编辑视频', '请输入新的补充视频URL:', currentUrl || '', async (newUrl) => {
      if (!newUrl || newUrl === currentUrl) return

      showPrompt('视频描述', '请输入新的视频描述:', currentName || '', async (newName) => {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('media_resources')
            .update({
              file_url: newUrl,
              external_url: newUrl,
              file_name: newName || currentName || undefined,
              updated_at: new Date().toISOString()
            })
            .eq('id', mediaId)

          if (error) throw error

          showToast('修改成功！', 'success')
          if (selectedStage) {
            await loadMediaResources(selectedStage.id)
          }
        } catch (error) {
          console.error('修改失败:', error)
          showToast('修改失败，请重试', 'error')
        }
      })
    })
  }

  const openProjectEditor = (index: number | null = null) => {
    if (index !== null) {
      // 编辑现有项目
      const project = formData.explorer_projects[index]
      setProjectFormData({
        id: project.id || '',
        title: project.title || '',
        subtitle: project.subtitle || '',
        duration: project.duration || '',
        goal: project.goal || '',
        materials: project.materials || [],
        steps: project.steps || [],
        expectedOutcome: project.expectedOutcome || '',
        tips: project.tips || []
      })
      setEditingProjectIndex(index)
    } else {
      // 新建项目
      setProjectFormData({
        id: '',
        title: '',
        subtitle: '',
        duration: '20分钟',
        goal: '',
        materials: [],
        steps: [],
        expectedOutcome: '',
        tips: []
      })
      setEditingProjectIndex(null)
    }
    setShowProjectEditor(true)
  }

  const handleSaveProject = () => {
    // 如果没有ID，生成一个
    const projectId = projectFormData.id || projectFormData.title.replace(/\s+/g, '_')

    const newProject = {
      ...projectFormData,
      id: projectId
    }

    if (editingProjectIndex !== null) {
      // 更新现有项目
      const newProjects = [...formData.explorer_projects]
      newProjects[editingProjectIndex] = newProject
      setFormData({
        ...formData,
        explorer_projects: newProjects
      })
    } else {
      // 添加新项目
      setFormData({
        ...formData,
        explorer_projects: [...formData.explorer_projects, newProject]
      })
    }

    setShowProjectEditor(false)
  }

  const handleDeleteProject = (index: number) => {
    showConfirm('删除确认', '确定要删除这个项目吗？', () => {
      const newProjects = formData.explorer_projects.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        explorer_projects: newProjects
      })
    })
  }

  // 生成星空粒子
  const particles = useMemo(() => {
    if (!isMounted) return []
    return [...Array(50)].map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      duration: Math.random() * 3 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  }, [isMounted])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, particle.x],
              y: [0, particle.y],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/courses')}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">欢迎来到地球</h1>
              <p className="text-sm text-purple-300 mt-1">6个阶段的认知探索之旅</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-88px)] relative z-10">
        {/* 左侧栏 - 阶段列表 */}
        <div className="w-80 bg-white/5 backdrop-blur-md border-r border-white/10 overflow-y-auto">
          <div className="p-4">
            {/* 管理功能链接 */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => router.push('/admin/courses/earth/students')}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg transition-all flex items-center gap-3 text-left"
              >
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white font-medium">选课学员</p>
                  <p className="text-gray-400 text-xs">管理课程学员</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/admin/courses/earth/groups')}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/50 rounded-lg transition-all flex items-center gap-3 text-left"
              >
                <UsersRound className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">课程分组</p>
                  <p className="text-gray-400 text-xs">管理课程分组</p>
                </div>
              </button>
            </div>

            {/* 分隔线 */}
            <div className="mb-4 border-t border-white/10"></div>

            <button
              onClick={handleAddNewStage}
              className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              新增阶段
            </button>

            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className={`relative rounded-lg transition-all ${
                    selectedStage?.id === stage.id
                      ? 'bg-purple-600/30 border border-purple-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <button
                    onClick={() => setSelectedStage(stage)}
                    className={`w-full text-left px-4 py-3 ${stage.sequence_number > 6 ? 'pr-20' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">第 {stage.sequence_number} 阶段</p>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-1">{stage.title}</p>
                      </div>
                    </div>
                  </button>
                  {/* 只显示第7阶段及以后的删除按钮 */}
                  {stage.sequence_number > 6 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteStage(stage.id, stage.sequence_number)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-all"
                      title="删除阶段"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧栏 - 内容编辑器 */}
        <div className="flex-1 overflow-y-auto">
          {selectedStage ? (
            <div className="max-w-4xl mx-auto p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">第 {selectedStage.sequence_number} 阶段</h2>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>

              {/* 表单字段 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入阶段标题..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">副标题</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入副标题..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    📺 主纪录片URL
                    <span className="text-purple-300 text-sm font-normal ml-2">（核心视频资源）</span>
                  </label>
                  <input
                    type="text"
                    value={formData.documentary_url}
                    onChange={(e) => setFormData({ ...formData, documentary_url: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入主纪录片URL（此阶段的核心观看内容）..."
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    💡 这是本阶段的主要视频内容。补充视频资源请使用下方的"补充视频资源"模块添加。
                  </p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">知识点（每行一个）</label>
                  <textarea
                    value={formData.knowledge_points.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      knowledge_points: e.target.value.split('\n').filter(k => k.trim())
                    })}
                    rows={8}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入知识点，每行一个..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">观看前思考问题（每行一个）</label>
                  <textarea
                    value={formData.socratic_questions.pre_watch.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      socratic_questions: {
                        ...formData.socratic_questions,
                        pre_watch: e.target.value.split('\n').filter(q => q.trim())
                      }
                    })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入观看前思考问题，每行一个..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">观看中思考问题（每行一个）</label>
                  <textarea
                    value={formData.socratic_questions.during_watch.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      socratic_questions: {
                        ...formData.socratic_questions,
                        during_watch: e.target.value.split('\n').filter(q => q.trim())
                      }
                    })}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入观看中思考问题，每行一个..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">观看后思考问题（每行一个）</label>
                  <textarea
                    value={formData.socratic_questions.post_watch.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      socratic_questions: {
                        ...formData.socratic_questions,
                        post_watch: e.target.value.split('\n').filter(q => q.trim())
                      }
                    })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入观看后思考问题，每行一个..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">观看后反思问题（每行一个）</label>
                  <textarea
                    value={formData.post_reflection.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      post_reflection: e.target.value.split('\n').filter(r => r.trim())
                    })}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入观看后反思问题，每行一个..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">预计时长（分钟）</label>
                  <input
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入预计时长..."
                  />
                </div>
              </div>

              {/* 探索者项目管理模块 */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">🔬 探索者联盟 - 小探险家项目</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      设置实践项目，让学生动手探索和实验
                    </p>
                  </div>
                  <button
                    onClick={() => openProjectEditor(null)}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    添加项目
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.explorer_projects.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400">暂无项目，点击按钮添加</p>
                    </div>
                  ) : (
                    formData.explorer_projects.map((project, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2">
                              <h4 className="text-white font-medium text-lg">{project.title}</h4>
                              {project.subtitle && (
                                <p className="text-gray-400 text-sm">{project.subtitle}</p>
                              )}
                            </div>

                            {project.goal && (
                              <p className="text-gray-300 text-sm mb-2">
                                <span className="text-orange-400">🎯 目标：</span>
                                {project.goal}
                              </p>
                            )}

                            {project.materials && project.materials.length > 0 && (
                              <div className="mb-2">
                                <span className="text-gray-400 text-xs">📦 所需材料：</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {project.materials.slice(0, 5).map((material, i) => (
                                    <span key={i} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">
                                      {material}
                                    </span>
                                  ))}
                                  {project.materials.length > 5 && (
                                    <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded">
                                      +{project.materials.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {project.steps && project.steps.length > 0 && (
                              <p className="text-gray-400 text-xs mb-2">
                                📝 {project.steps.length} 个实验步骤
                              </p>
                            )}

                            {project.duration && (
                              <p className="text-gray-400 text-xs">
                                ⏰ 预计时长：{project.duration}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => openProjectEditor(index)}
                              className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded transition-all"
                              title="编辑项目"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(index)}
                              className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-all"
                              title="删除项目"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 资料管理模块 */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">📚 补充视频资源</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      添加辅助学习的补充视频（例如：相关资料片段、延伸阅读视频等）
                    </p>
                  </div>
                  <button
                    onClick={handleAddExternalVideo}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    添加补充视频
                  </button>
                </div>

                <div className="space-y-3">
                  {mediaResources.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                      <FileVideo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400">暂无资料，点击按钮添加</p>
                    </div>
                  ) : (
                    mediaResources.map((media) => (
                      <div
                        key={media.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <FileVideo className="w-6 h-6 text-purple-400" />
                          <div>
                            <p className="text-white font-medium">{media.file_name}</p>
                            <p className="text-gray-400 text-sm truncate max-w-md">
                              {media.external_url || media.file_url}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={(media.external_url || media.file_url) || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-all"
                          >
                            查看
                          </a>
                          <button
                            onClick={() => handleEditVideoUrl(media.id, media.external_url || media.file_url, media.file_name)}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded transition-all"
                            title="编辑链接"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedia(media.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-lg">请从左侧选择一个阶段进行编辑</p>
            </div>
          )}
        </div>
      </div>

      {/* 项目编辑模态框 */}
      {showProjectEditor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-orange-500/30 rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                {editingProjectIndex !== null ? '编辑项目' : '新建项目'}
              </h2>
              <button
                onClick={() => setShowProjectEditor(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">基本信息</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">项目标题 *</label>
                  <input
                    type="text"
                    value={projectFormData.title}
                    onChange={(e) => setProjectFormData({...projectFormData, title: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    placeholder="例如：振动猎人"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">副标题</label>
                  <input
                    type="text"
                    value={projectFormData.subtitle}
                    onChange={(e) => setProjectFormData({...projectFormData, subtitle: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    placeholder="例如：亲身验证声音就是振动"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">预计时长</label>
                  <input
                    type="text"
                    value={projectFormData.duration}
                    onChange={(e) => setProjectFormData({...projectFormData, duration: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    placeholder="例如：20分钟"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">项目目标</label>
                  <textarea
                    value={projectFormData.goal}
                    onChange={(e) => setProjectFormData({...projectFormData, goal: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    placeholder="例如：通过动手实验，直观感受声音的物理本质"
                  />
                </div>
              </div>

              {/* 所需材料 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">所需材料</h3>
                <textarea
                  value={projectFormData.materials.join('\n')}
                  onChange={(e) => setProjectFormData({
                    ...projectFormData,
                    materials: e.target.value.split('\n').filter(m => m.trim())
                  })}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="每行一个材料，例如：&#10;碗&#10;保鲜膜&#10;盐或米粒&#10;音响或手机"
                />
              </div>

              {/* 实验步骤 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">实验步骤</h3>
                <textarea
                  value={projectFormData.steps.join('\n')}
                  onChange={(e) => setProjectFormData({
                    ...projectFormData,
                    steps: e.target.value.split('\n').filter(s => s.trim())
                  })}
                  rows={6}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="每行一个步骤，例如：&#10;用保鲜膜紧紧封住碗口，做成'鼓面'&#10;在鼓面上撒上盐粒或米粒&#10;将碗靠近音响，播放低音重的音乐&#10;观察盐粒或米粒的'舞蹈'"
                />
              </div>

              {/* 预期成果（可选） */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">预期成果 <span className="text-sm text-gray-500">(可选)</span></h3>
                <textarea
                  value={projectFormData.expectedOutcome}
                  onChange={(e) => setProjectFormData({...projectFormData, expectedOutcome: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="描述学生完成项目后应该看到或理解什么"
                />
              </div>

              {/* 温馨提示（可选） */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">温馨提示 <span className="text-sm text-gray-500">(可选)</span></h3>
                <textarea
                  value={projectFormData.tips.join('\n')}
                  onChange={(e) => setProjectFormData({
                    ...projectFormData,
                    tips: e.target.value.split('\n').filter(t => t.trim())
                  })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="每行一个提示，例如安全注意事项、实验技巧等"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowProjectEditor(false)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all border border-white/10"
              >
                取消
              </button>
              <button
                onClick={handleSaveProject}
                disabled={!projectFormData.title}
                className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
              >
                保存项目
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        type={toastType}
      />

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (confirmCallback) confirmCallback()
          setConfirmOpen(false)
        }}
        title={confirmTitle}
        message={confirmMessage}
      />

      {/* PromptDialog */}
      <PromptDialog
        isOpen={promptOpen}
        onClose={() => setPromptOpen(false)}
        onConfirm={(value) => {
          if (promptCallback) promptCallback(value)
          setPromptOpen(false)
        }}
        title={promptTitle}
        message={promptMessage}
        defaultValue={promptDefaultValue}
      />
    </div>
  )
}
