'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createIntersectionObserver } from '@/utils/mobilePerformance'

interface MobileLazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  blurDataURL?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

export default function MobileLazyImage({
  src,
  alt,
  className = '',
  placeholder,
  blurDataURL,
  priority = false,
  onLoad,
  onError
}: MobileLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority) return

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '50px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* 占位符 */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse">
          {placeholder && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-400 text-sm">{placeholder}</span>
            </div>
          )}
          {blurDataURL && (
            <img
              src={blurDataURL}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
            />
          )}
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-600 rounded"></div>
            <span className="text-xs">图片加载失败</span>
          </div>
        </div>
      )}

      {/* 实际图片 */}
      {isInView && (
        <motion.img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* 加载指示器 */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"
          />
        </div>
      )}
    </div>
  )
}

// 移动端图片优化Hook
export function useMobileImageOptimization() {
  const [shouldLoadImages, setShouldLoadImages] = useState(true)

  useEffect(() => {
    // 检测网络状态
    const connection = (navigator as any).connection
    if (connection) {
      const isSlowConnection = connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g'
      const isSaveData = connection.saveData
      
      setShouldLoadImages(!isSlowConnection && !isSaveData)
    }

    // 检测电池状态
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2 && !battery.charging) {
          setShouldLoadImages(false)
        }
      })
    }
  }, [])

  return { shouldLoadImages }
}

// 图片预加载工具
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// 批量预加载图片
export async function preloadImages(srcs: string[], maxConcurrent = 3): Promise<void> {
  const chunks = []
  for (let i = 0; i < srcs.length; i += maxConcurrent) {
    chunks.push(srcs.slice(i, i + maxConcurrent))
  }

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(preloadImage))
  }
}
