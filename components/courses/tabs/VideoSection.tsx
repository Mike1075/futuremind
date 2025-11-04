'use client'

import { useState, useEffect } from 'react'
import { Play, FileVideo, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MediaResource {
  id: string
  file_name: string | null
  file_url: string | null
  external_url: string | null
  resource_type: string | null
}

interface VideoSectionProps {
  documentaryUrl: string
  courseContentId: string
  preWatchGuide: string
}

export function VideoSection({
  documentaryUrl,
  courseContentId,
  preWatchGuide
}: VideoSectionProps) {
  const [supplementaryVideos, setSupplementaryVideos] = useState<MediaResource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSupplementaryVideos()
  }, [courseContentId])

  const loadSupplementaryVideos = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('media_resources')
        .select('*')
        .eq('course_content_id', courseContentId)
        .eq('resource_type', 'video')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSupplementaryVideos(data || [])
    } catch (error) {
      console.error('Error loading supplementary videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVideoEmbedUrl = (url: string): string | null => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Bilibili
    const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV[^?]+)/)
    if (bilibiliMatch) {
      return `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&high_quality=1`
    }

    return url // 返回原始URL，可能是直接的视频链接
  }

  return (
    <div className="space-y-6">
      {/* 观前指南 */}
      {preWatchGuide && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            观前指南
          </h3>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {preWatchGuide}
          </p>
        </div>
      )}

      {/* 主纪录片 */}
      {documentaryUrl ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-6 py-4 border-b border-white/10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-400" />
              主纪录片
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              这是本阶段的核心视频内容
            </p>
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={getVideoEmbedUrl(documentaryUrl) || documentaryUrl}
              className="absolute top-0 left-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="主纪录片"
            />
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
          <FileVideo className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">暂无主纪录片</p>
        </div>
      )}

      {/* 补充视频资源 */}
      {!loading && supplementaryVideos.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-cyan-400" />
            补充视频资源
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplementaryVideos.map((video) => (
              <div
                key={video.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-all"
              >
                <div className="p-4 border-b border-white/10">
                  <h4 className="font-medium text-white">{video.file_name || '补充视频'}</h4>
                </div>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={getVideoEmbedUrl(video.external_url || video.file_url || '') || video.external_url || video.file_url || ''}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={video.file_name || '补充视频'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-400 mt-3">加载补充视频中...</p>
        </div>
      )}
    </div>
  )
}
