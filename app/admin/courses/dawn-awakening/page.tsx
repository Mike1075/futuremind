// @ts-nocheck
'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Save, Upload, FileAudio, Trash2, ChevronRight, Users, Sunrise } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface CourseContent {
  id: string
  system_id: string | null
  content_type: string
  sequence_number: number
  title: string
  original_text: string | null
  deep_interpretation: string | null
  meditation_guide: string | null
  life_practice: string | null
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
  created_at: string | null
}

export default function DawnAwakeningCoursePage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [courseContents, setCourseContents] = useState<CourseContent[]>([])
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null)
  const [mediaResources, setMediaResources] = useState<MediaResource[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [systemId, setSystemId] = useState<string | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    original_text: '',
    deep_interpretation: '',
    meditation_guide: '',
    life_practice: ''
  })

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedContent) {
      setFormData({
        title: selectedContent.title || '',
        original_text: selectedContent.original_text || '',
        deep_interpretation: selectedContent.deep_interpretation || '',
        meditation_guide: selectedContent.meditation_guide || '',
        life_practice: selectedContent.life_practice || ''
      })
      loadMediaResources(selectedContent.id)
    }
  }, [selectedContent])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      await loadCourseContents()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadCourseContents = async (keepSelection = false) => {
    try {
      const supabase = createClient()
      const currentSelectedId = selectedContent?.id

      // 获取破晓觉醒课程体系ID
      const { data: systemData, error: systemError } = await supabase
        .from('course_systems')
        .select('id')
        .eq('system_key', 'dawn_awakening')
        .maybeSingle()

      if (systemError) throw systemError
      if (!systemData) throw new Error('未找到破晓觉醒课程体系')

      setSystemId(systemData.id)

      // 获取所有课程内容
      const { data, error } = await supabase
        .from('course_contents')
        .select('*')
        .eq('system_id', systemData.id)
        .order('sequence_number', { ascending: true })

      if (error) throw error
      setCourseContents(data || [])

      if (data && data.length > 0) {
        if (keepSelection && currentSelectedId) {
          const previouslySelected = data.find(c => c.id === currentSelectedId)
          if (previouslySelected) {
            setSelectedContent(previouslySelected)
          } else {
            setSelectedContent(data[0])
          }
        } else {
          setSelectedContent(data[0])
        }
      }
    } catch (error) {
      console.error('加载课程列表失败:', error)
    }
  }

  const loadMediaResources = async (contentId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('media_resources')
        .select('*')
        .eq('course_content_id', contentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMediaResources(data || [])
    } catch (error) {
      console.error('加载媒体资源失败:', error)
    }
  }

  const handleSave = async () => {
    if (!selectedContent) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('course_contents')
        .update({
          title: formData.title,
          original_text: formData.original_text,
          deep_interpretation: formData.deep_interpretation,
          meditation_guide: formData.meditation_guide,
          life_practice: formData.life_practice,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedContent.id)

      if (error) throw error

      toast.success('保存成功')
      await loadCourseContents(true)
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedContent || !event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    setUploading(true)

    try {
      const supabase = createClient()

      // 上传文件到 Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `day_${selectedContent.sequence_number}_${Date.now()}.${fileExt}`
      const filePath = `dawn-awakening/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      // 保存到 media_resources 表
      const { error: dbError } = await supabase
        .from('media_resources')
        .insert({
          course_content_id: selectedContent.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          resource_type: 'audio'
        })

      if (dbError) throw dbError

      toast.success('文件上传成功')
      await loadMediaResources(selectedContent.id)
    } catch (error) {
      console.error('文件上传失败:', error)
      toast.error('文件上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (!await confirm({ title: '确认操作', message: '确定要删除这个文件吗？', type: 'warning' })) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('media_resources')
        .delete()
        .eq('id', mediaId)

      if (error) throw error

      toast.success('删除成功')
      if (selectedContent) {
        await loadMediaResources(selectedContent.id)
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  const handleAddNewDay = async () => {
    if (!systemId) return

    const newSequenceNumber = courseContents.length > 0
      ? Math.max(...courseContents.map(c => c.sequence_number)) + 1
      : 1

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('course_contents')
        .insert({
          system_id: systemId,
          content_type: 'daily_lesson',
          sequence_number: newSequenceNumber,
          title: `第${newSequenceNumber}天`,
          original_text: '',
          deep_interpretation: '',
          meditation_guide: '',
          life_practice: '',
          is_published: false
        })
        .select()
        .single()

      if (error) throw error

      toast.success('新增成功')
      await loadCourseContents()
      setSelectedContent(data)
    } catch (error) {
      console.error('新增失败:', error)
      toast.error('新增失败，请重试')
    }
  }

  const handleDeleteCourse = async (contentId: string, sequenceNumber: number) => {
    // 保护前23天的固定课程
    if (sequenceNumber <= 23) {
      toast.warning('前23天的课程是固定内容，不能删除，只能修改。')
      return
    }

    if (!await confirm({
      title: '确认操作',
      message: `确定要删除第 ${sequenceNumber} 天的课程吗？删除后将无法恢复。`,
      type: 'warning'
    })) return

    try {
      const supabase = createClient()

      // 先删除关联的媒体资源
      const { error: mediaError } = await supabase
        .from('media_resources')
        .delete()
        .eq('course_content_id', contentId)

      if (mediaError) throw mediaError

      // 删除课程内容
      const { error } = await supabase
        .from('course_contents')
        .delete()
        .eq('id', contentId)

      if (error) throw error

      toast.success('删除成功')

      if (selectedContent?.id === contentId) {
        setSelectedContent(null)
      }

      await loadCourseContents()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  // 生成日出粒子效果
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
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
          <p className="text-amber-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cosmic-void relative overflow-hidden">
      {/* Background particles - 日出主题金橙色 */}
      <div className="absolute inset-0 overflow-hidden">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-amber-400 rounded-full opacity-30"
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
              className="p-2 bg-white/10 hover:bg-white/20 text-starlight rounded-lg border border-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Sunrise className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-h2 font-bold text-starlight">破晓觉醒</h1>
              <p className="text-small text-amber-300 mt-1">23天晨间冥想之旅</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-88px)] relative z-10">
        {/* 左侧栏 - 课程列表 */}
        <div className="w-80 bg-white/5 backdrop-blur-md border-r border-white/10 overflow-y-auto">
          <div className="p-4">
            {/* 管理功能链接 */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => router.push('/admin/courses/dawn-awakening/students')}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 rounded-lg transition-all flex items-center gap-3 text-left"
              >
                <Users className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-starlight font-medium">选课学员</p>
                  <p className="text-starlight-muted text-xs">管理课程学员</p>
                </div>
              </button>
            </div>

            {/* 分隔线 */}
            <div className="mb-4 border-t border-white/10"></div>

            <button
              onClick={handleAddNewDay}
              className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-starlight rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              新增一天
            </button>

            <div className="space-y-2">
              {courseContents.map((content) => (
                <div
                  key={content.id}
                  className={`relative rounded-lg transition-all ${
                    selectedContent?.id === content.id
                      ? 'bg-amber-600/30 border border-amber-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <button
                    onClick={() => setSelectedContent(content)}
                    className={`w-full text-left px-4 py-3 ${content.sequence_number > 23 ? 'pr-20' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-starlight font-medium">第 {content.sequence_number} 天</p>
                        <p className="text-starlight-muted text-small mt-1 line-clamp-1">{content.title}</p>
                      </div>
                    </div>
                  </button>
                  {/* 只显示第24天及以后的删除按钮 */}
                  {content.sequence_number > 23 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCourse(content.id, content.sequence_number)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-all"
                      title="删除课程"
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
          {selectedContent ? (
            <div className="w-full max-w-none p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h2 font-bold text-starlight">第 {selectedContent.sequence_number} 天</h2>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-starlight rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>

              {/* 表单字段 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-starlight font-medium mb-2">标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-ethereal w-full"
                    placeholder="输入标题..."
                  />
                </div>

                <div>
                  <label className="block text-starlight font-medium mb-2">Mike老师晨间寄语</label>
                  <textarea
                    value={formData.original_text}
                    onChange={(e) => setFormData({ ...formData, original_text: e.target.value })}
                    rows={6}
                    className="input-ethereal w-full"
                    placeholder="输入Mike老师的晨间寄语..."
                  />
                </div>

                <div>
                  <label className="block text-starlight font-medium mb-2">基于原著</label>
                  <textarea
                    value={formData.deep_interpretation}
                    onChange={(e) => setFormData({ ...formData, deep_interpretation: e.target.value })}
                    rows={3}
                    className="input-ethereal w-full"
                    placeholder="基于原著的日期和主题..."
                  />
                </div>

                <div>
                  <label className="block text-starlight font-medium mb-2">深度冥想引导</label>
                  <textarea
                    value={formData.meditation_guide}
                    onChange={(e) => setFormData({ ...formData, meditation_guide: e.target.value })}
                    rows={15}
                    className="input-ethereal w-full"
                    placeholder="输入深度冥想引导语..."
                  />
                </div>

                <div>
                  <label className="block text-starlight font-medium mb-2">生活实修</label>
                  <textarea
                    value={formData.life_practice}
                    onChange={(e) => setFormData({ ...formData, life_practice: e.target.value })}
                    rows={8}
                    className="input-ethereal w-full"
                    placeholder="输入生活实修练习..."
                  />
                </div>
              </div>

              {/* 资料管理模块 */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-h3 font-bold text-starlight">冥想音频</h3>
                  <label className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-starlight rounded-lg font-medium transition-all flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploading ? '上传中...' : '上传音频'}
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="audio/*,video/*,.pdf,.doc,.docx"
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  {mediaResources.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                      <FileAudio className="w-12 h-12 text-starlight-muted mx-auto mb-3" />
                      <p className="text-starlight-muted">暂无音频，点击上传按钮添加冥想音频</p>
                    </div>
                  ) : (
                    mediaResources.map((media) => (
                      <div
                        key={media.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <FileAudio className="w-6 h-6 text-amber-400" />
                          <div>
                            <p className="text-starlight font-medium">{media.file_name || '未命名文件'}</p>
                            <p className="text-starlight-muted text-small">
                              {media.file_size ? (media.file_size / 1024 / 1024).toFixed(2) : '0.00'} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={media.file_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-starlight rounded text-small transition-all"
                          >
                            播放
                          </a>
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
              <p className="text-starlight-muted text-lg">请从左侧选择一天课程进行编辑</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
