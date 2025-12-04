'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  src: string
  title: string
}

export function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    console.log('[AudioPlayer] 初始化', { src, title })

    const updateTime = () => setCurrentTime(audio.currentTime)

    const updateDuration = () => {
      console.log('[AudioPlayer] ✅ 音频已加载', {
        duration: audio.duration,
        src: audio.src
      })
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleEnded = () => {
      console.log('[AudioPlayer] 播放结束')
      setIsPlaying(false)
    }

    const handleCanPlay = () => {
      console.log('[AudioPlayer] ✅ 可以播放', {
        duration: audio.duration,
        readyState: audio.readyState
      })
      setIsLoading(false)
    }

    const handleError = (e: Event) => {
      const mediaError = audio.error
      const errorMessage = mediaError
        ? `错误代码: ${mediaError.code}, ${mediaError.message || '未知错误'}`
        : '音频加载失败'
      console.error('[AudioPlayer] ❌ 加载失败', {
        code: mediaError?.code,
        message: mediaError?.message,
        src: audio.src,
        networkState: audio.networkState
      })
      setError(errorMessage)
      setIsLoading(false)
    }

    const handleLoadStart = () => {
      console.log('[AudioPlayer] 开始加载...', { src })
      setIsLoading(true)
      setError(null)
    }

    const handlePlay = () => {
      console.log('[AudioPlayer] ▶️ 开始播放')
      setIsPlaying(true)
    }

    const handlePause = () => {
      console.log('[AudioPlayer] ⏸️ 暂停')
      setIsPlaying(false)
    }

    const handleWaiting = () => {
      console.log('[AudioPlayer] ⏳ 缓冲中...')
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('waiting', handleWaiting)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('waiting', handleWaiting)
    }
  }, [src, title])

  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error('[AudioPlayer] audioRef 为空')
      return
    }

    try {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        console.log('[AudioPlayer] 尝试播放...')
        await audioRef.current.play()
      }
    } catch (err) {
      console.error('[AudioPlayer] 播放失败:', err)
      setError('播放失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || duration === 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
    console.log('[AudioPlayer] 跳转到:', Math.round(percent * 100) + '%')
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value
    }
    setIsMuted(value === 0)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-3">
      {/* 标题行 */}
      <div className="flex items-center">
        <div className="section-icon mr-3">
          <div className="section-icon-glow"></div>
          <div className="section-icon-border"></div>
          <div className="section-icon-inner"></div>
          <div className="section-icon-content">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>

      {/* 音频播放器 - 炫彩边框容器 */}
      <div className="audio-section-wrapper">
        <div className="audio-section-inner p-4">
          {/* 隐藏的原生 audio 元素 - 直接使用 src 属性 */}
          <audio
            ref={audioRef}
            src={src}
            preload="metadata"
          />

          {/* 错误提示 */}
          {error && (
            <div className="text-red-400 text-sm mb-3 p-2 bg-red-500/10 rounded-lg space-y-1">
              <div>❌ {error}</div>
              <div className="text-xs text-gray-500 break-all">URL: {src}</div>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              disabled={isLoading && !error}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Progress Bar */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-xs text-gray-400 w-10 text-right font-mono">
                {formatTime(currentTime)}
              </span>
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative"
              >
                {/* 炫彩进度条 */}
                <div
                  className="absolute h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* 拖动手柄 */}
                <div
                  className="absolute w-3 h-3 bg-white rounded-full -top-[3px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-10 font-mono">
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={isMuted ? '取消静音' : '静音'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 9v6h4l5 5V4L9 9H5zm11.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
