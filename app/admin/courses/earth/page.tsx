'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Save, Upload, FileVideo, Trash2, ChevronRight, BookOpen, Edit, Users, UsersRound } from 'lucide-react'

interface EarthStage {
  id: string
  system_id: string
  content_type: string
  sequence_number: number
  title: string
  subtitle: string
  documentary_url: string
  pre_watch_guide: string
  knowledge_points: any[]
  socratic_questions: {
    pre_watch: string[]
    during_watch: string[]
    post_watch: string[]
  }
  post_reflection: string[]
  estimated_duration: number
  is_published: boolean
  created_at: string
  updated_at: string
}

interface MediaResource {
  id: string
  course_content_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  resource_type: string
  external_url: string
  created_at: string
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

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    documentary_url: '',
    pre_watch_guide: '',
    knowledge_points: [] as string[],
    socratic_questions: {
      pre_watch: [] as string[],
      during_watch: [] as string[],
      post_watch: [] as string[]
    },
    post_reflection: [] as string[],
    estimated_duration: 60
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
        pre_watch_guide: selectedStage.pre_watch_guide || '',
        knowledge_points: selectedStage.knowledge_points || [],
        socratic_questions: selectedStage.socratic_questions || {
          pre_watch: [],
          during_watch: [],
          post_watch: []
        },
        post_reflection: selectedStage.post_reflection || [],
        estimated_duration: selectedStage.estimated_duration || 60
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
      const { data: systemData, error: systemError } = await (supabase
        .from('course_systems') as any)
        .select('id')
        .eq('system_key', 'earth')
        .single()

      if (systemError) throw systemError
      if (!systemData) throw new Error('未找到欢迎来到地球课程体系')

      setEarthSystemId(systemData.id)

      // Then, get all stages for this system
      const { data, error } = await (supabase
        .from('course_contents') as any)
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
      const { data, error } = await (supabase
        .from('media_resources') as any)
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
      const { error } = await (supabase
        .from('course_contents') as any)
        .update({
          title: formData.title,
          subtitle: formData.subtitle,
          documentary_url: formData.documentary_url,
          pre_watch_guide: formData.pre_watch_guide,
          knowledge_points: formData.knowledge_points,
          socratic_questions: formData.socratic_questions,
          post_reflection: formData.post_reflection,
          estimated_duration: formData.estimated_duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStage.id)

      if (error) throw error

      alert('保存成功！')
      await loadStages()
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleAddExternalVideo = async () => {
    if (!selectedStage) return

    const url = prompt('请输入视频URL（YouTube/Bilibili）:')
    if (!url) return

    const description = prompt('请输入视频描述:')

    try {
      const supabase = createClient()
      const { error } = await (supabase
        .from('media_resources') as any)
        .insert({
          course_content_id: selectedStage.id,
          file_name: description || '外部视频',
          file_url: url,
          external_url: url,
          file_type: 'video/external',
          resource_type: 'video',
          description: description
        })

      if (error) throw error

      alert('视频链接添加成功！')
      await loadMediaResources(selectedStage.id)
    } catch (error) {
      console.error('添加视频失败:', error)
      alert('添加视频失败，请重试')
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('确定要删除这个资源吗？')) return

    try {
      const supabase = createClient()
      const { error } = await (supabase
        .from('media_resources') as any)
        .delete()
        .eq('id', mediaId)

      if (error) throw error

      alert('删除成功！')
      if (selectedStage) {
        await loadMediaResources(selectedStage.id)
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleAddNewStage = async () => {
    if (!earthSystemId) return

    const newSequenceNumber = stages.length > 0
      ? Math.max(...stages.map(s => s.sequence_number)) + 1
      : 1

    try {
      const supabase = createClient()
      const { data, error } = await (supabase
        .from('course_contents') as any)
        .insert({
          system_id: earthSystemId,
          content_type: 'stage',
          sequence_number: newSequenceNumber,
          title: `第${newSequenceNumber}阶段`,
          subtitle: '',
          documentary_url: '',
          pre_watch_guide: '',
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

      alert('新增成功！')
      await loadStages()
      setSelectedStage(data)
    } catch (error) {
      console.error('新增失败:', error)
      alert('新增失败，请重试')
    }
  }

  const handleDeleteStage = async (stageId: string, sequenceNumber: number) => {
    // 保护前6个阶段的固定内容
    if (sequenceNumber <= 6) {
      alert('前6个阶段是固定内容，不能删除，只能修改。')
      return
    }

    if (!confirm(`确定要删除第 ${sequenceNumber} 阶段吗？删除后将无法恢复。`)) return

    try {
      const supabase = createClient()

      // 先删除关联的媒体资源
      const { error: mediaError } = await (supabase
        .from('media_resources') as any)
        .delete()
        .eq('course_content_id', stageId)

      if (mediaError) throw mediaError

      // 删除阶段内容
      const { error } = await (supabase
        .from('course_contents') as any)
        .delete()
        .eq('id', stageId)

      if (error) throw error

      alert('删除成功！')

      // 如果删除的是当前选中的阶段，清空选中状态
      if (selectedStage?.id === stageId) {
        setSelectedStage(null)
      }

      await loadStages()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleEditVideoUrl = async (mediaId: string, currentUrl: string, currentName: string) => {
    const newUrl = prompt('请输入新的视频URL:', currentUrl)
    if (!newUrl || newUrl === currentUrl) return

    const newName = prompt('请输入新的视频描述:', currentName)

    try {
      const supabase = createClient()
      const { error } = await (supabase
        .from('media_resources') as any)
        .update({
          file_url: newUrl,
          external_url: newUrl,
          file_name: newName || currentName,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId)

      if (error) throw error

      alert('修改成功！')
      if (selectedStage) {
        await loadMediaResources(selectedStage.id)
      }
    } catch (error) {
      console.error('修改失败:', error)
      alert('修改失败，请重试')
    }
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
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
                onClick={() => earthSystemId && router.push(`/admin/courses/${earthSystemId}?tab=students`)}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg transition-all flex items-center gap-3 text-left"
              >
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white font-medium">选课学员</p>
                  <p className="text-gray-400 text-xs">管理课程学员</p>
                </div>
              </button>
              <button
                onClick={() => earthSystemId && router.push(`/admin/courses/${earthSystemId}?tab=groups`)}
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
                  <label className="block text-white font-medium mb-2">纪录片URL</label>
                  <input
                    type="text"
                    value={formData.documentary_url}
                    onChange={(e) => setFormData({ ...formData, documentary_url: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入纪录片URL..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">观前指南</label>
                  <textarea
                    value={formData.pre_watch_guide}
                    onChange={(e) => setFormData({ ...formData, pre_watch_guide: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入观前指南..."
                  />
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
                  <label className="block text-white font-medium mb-2">苏格拉底问题 - 课前引导（每行一个）</label>
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
                    placeholder="输入课前问题，每行一个..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">苏格拉底问题 - 观看时（每行一个）</label>
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
                    placeholder="输入观看时问题，每行一个..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">苏格拉底问题 - 课后思辨（每行一个）</label>
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
                    placeholder="输入课后问题，每行一个..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">课后反思问题（每行一个）</label>
                  <textarea
                    value={formData.post_reflection.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      post_reflection: e.target.value.split('\n').filter(r => r.trim())
                    })}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="输入课后反思问题，每行一个..."
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

              {/* 资料管理模块 */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">资料管理</h3>
                  <button
                    onClick={handleAddExternalVideo}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    添加视频链接
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
                            href={media.external_url || media.file_url}
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
    </div>
  )
}
