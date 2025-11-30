// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Heart, Trash2, Image as ImageIcon, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Showcase {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  image_urls: string[] | null
  likes_count: number | null
  is_public: boolean
  created_at: string | null
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  is_liked?: boolean
}

interface ShowcasePanelProps {
  projectId: string
  isMember?: boolean
}

export function ShowcasePanel({ projectId, isMember = false }: ShowcasePanelProps) {
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<{ url: string; allUrls: string[]; index: number } | null>(null)

  useEffect(() => {
    loadShowcases()
    loadCurrentUser()
  }, [projectId, isMember])

  const loadCurrentUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)
  }

  const loadShowcases = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // 加载成果列表
      // 项目成员可以看到所有成果，非成员只能看到公开的成果
      let query = supabase
        .from('project_showcases')
        .select('*')
        .eq('project_id', projectId)

      if (!isMember) {
        query = query.eq('is_public', true)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // 获取用户信息
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(s => s.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        // 检查当前用户的点赞状态
        let likedIds: string[] = []
        if (user) {
          const { data: likes } = await supabase
            .from('showcase_likes')
            .select('showcase_id')
            .eq('user_id', user.id)
            .in('showcase_id', data.map(s => s.id))
          likedIds = likes?.map(l => l.showcase_id) || []
        }

        const showcasesWithUsers = data.map(showcase => ({
          ...showcase,
          user: profiles?.find(p => p.id === showcase.user_id),
          is_liked: likedIds.includes(showcase.id)
        }))

        setShowcases(showcasesWithUsers)
      } else {
        setShowcases([])
      }
    } catch (err) {
      console.error('加载成果失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (showcaseId: string, isLiked: boolean) => {
    if (!currentUserId) return

    const supabase = createClient()

    try {
      if (isLiked) {
        // 取消点赞
        await supabase
          .from('showcase_likes')
          .delete()
          .eq('showcase_id', showcaseId)
          .eq('user_id', currentUserId)
      } else {
        // 点赞
        await supabase
          .from('showcase_likes')
          .insert({ showcase_id: showcaseId, user_id: currentUserId })
      }

      // 更新本地状态
      setShowcases(prev => prev.map(s => {
        if (s.id === showcaseId) {
          return {
            ...s,
            is_liked: !isLiked,
            likes_count: isLiked ? (s.likes_count || 1) - 1 : (s.likes_count || 0) + 1
          }
        }
        return s
      }))
    } catch (err) {
      console.error('点赞失败:', err)
    }
  }

  const handleDelete = async (showcaseId: string) => {
    if (!confirm('确定要删除这个成果吗？')) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('project_showcases')
        .delete()
        .eq('id', showcaseId)

      if (error) throw error

      setShowcases(prev => prev.filter(s => s.id !== showcaseId))
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl">🏆</span>
          成果展示
          {showcases.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-sm rounded-full">
              {showcases.length}
            </span>
          )}
        </h2>
        {isMember && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            发布成果
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        </div>
      ) : showcases.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
          <p>暂无成果展示</p>
          <p className="text-sm mt-1">点击「发布成果」分享你的作品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showcases.map((showcase) => (
            <div
              key={showcase.id}
              className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
            >
              {/* 图片区域 */}
              {showcase.image_urls && showcase.image_urls.length > 0 && (
                <div className="relative aspect-video bg-zinc-900">
                  <img
                    src={showcase.image_urls[0]}
                    alt={showcase.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage({
                      url: showcase.image_urls![0],
                      allUrls: showcase.image_urls!,
                      index: 0
                    })}
                  />
                  {showcase.image_urls.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                      +{showcase.image_urls.length - 1} 张
                    </div>
                  )}
                </div>
              )}

              {/* 内容区域 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-white">{showcase.title}</h3>
                  {isMember && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      showcase.is_public
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {showcase.is_public ? '公开' : '私有'}
                    </span>
                  )}
                </div>
                {showcase.description && (
                  <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{showcase.description}</p>
                )}

                {/* 用户信息和操作 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-xs text-purple-400">
                        {showcase.user?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {showcase.user?.full_name || '未知用户'}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {formatDate(showcase.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 点赞按钮 */}
                    <button
                      onClick={() => handleLike(showcase.id, showcase.is_liked || false)}
                      className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                        showcase.is_liked
                          ? 'text-red-400 bg-red-500/10'
                          : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${showcase.is_liked ? 'fill-current' : ''}`} />
                      <span className="text-xs">{showcase.likes_count}</span>
                    </button>

                    {/* 删除按钮（仅创建者可见） */}
                    {currentUserId === showcase.user_id && (
                      <button
                        onClick={() => handleDelete(showcase.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建成果弹窗 */}
      {showCreateModal && (
        <CreateShowcaseModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadShowcases()
          }}
        />
      )}

      {/* 图片查看器 */}
      {selectedImage && (
        <ImageViewer
          imageUrls={selectedImage.allUrls}
          initialIndex={selectedImage.index}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  )
}

// 创建成果弹窗
function CreateShowcaseModal({
  projectId,
  onClose,
  onSuccess
}: {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    // 重置 input 值，允许再次选择相同的文件
    e.target.value = ''

    if (files.length + images.length > 9) {
      alert('最多上传9张图片')
      return
    }

    // 验证文件类型和大小
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} 不是图片文件`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} 超过10MB限制`)
        return false
      }
      return true
    })

    setImages(prev => [...prev, ...validFiles])

    // 生成预览
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('请输入标题')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      // 上传图片到Storage
      const imageUrls: string[] = []
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('showcases')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('showcases')
          .getPublicUrl(fileName)

        imageUrls.push(publicUrl)
        setUploadProgress(Math.round(((i + 1) / images.length) * 80))
      }

      setUploadProgress(90)

      // 创建成果记录
      const { error: insertError } = await supabase
        .from('project_showcases')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          image_urls: imageUrls,
          is_public: isPublic
        })

      if (insertError) throw insertError

      setUploadProgress(100)
      onSuccess()
    } catch (err) {
      console.error('发布失败:', err)
      alert('发布失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">发布成果</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的成果起个名字"
              disabled={submitting}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="介绍一下这个成果..."
              rows={3}
              disabled={submitting}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50"
            />
          </div>

          {/* 公开设置 */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-zinc-300">公开展示</div>
              <div className="text-xs text-zinc-500 mt-1">
                {isPublic ? '所有人都可以看到这个成果' : '仅项目成员可见'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              disabled={submitting}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                isPublic ? 'bg-green-600' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              图片 <span className="text-zinc-500">(最多9张)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    disabled={submitting}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <label className="aspect-square border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <ImageIcon className="h-6 w-6 text-zinc-600 mb-1" />
                  <span className="text-xs text-zinc-600">添加图片</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    disabled={submitting}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          {submitting && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>上传中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-1.5">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  发布中...
                </>
              ) : (
                '发布'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 图片查看器
function ImageViewer({
  imageUrls,
  initialIndex,
  onClose
}: {
  imageUrls: string[]
  initialIndex: number
  onClose: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : imageUrls.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev < imageUrls.length - 1 ? prev + 1 : 0))
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
      >
        <X className="h-8 w-8" />
      </button>

      {imageUrls.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev() }}
            className="absolute left-4 p-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext() }}
            className="absolute right-4 p-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </>
      )}

      <img
        src={imageUrls[currentIndex]}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {imageUrls.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {imageUrls.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(index) }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
