'use client'

import { useEffect, useRef, useState } from 'react'

interface GestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onLongPress?: () => void
  onDoubleTap?: () => void
  onPinch?: (scale: number) => void
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export function useMobileGestures(handlers: GestureHandlers) {
  const elementRef = useRef<HTMLElement>(null)
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null)
  const [lastTap, setLastTap] = useState<TouchPoint | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [initialDistance, setInitialDistance] = useState<number | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // 计算两点间距离（用于缩放手势）
    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX
      const dy = touch1.clientY - touch2.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    // 触摸开始
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const now = Date.now()
      
      const touchPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: now
      }
      
      setTouchStart(touchPoint)

      // 双击检测
      if (lastTap && now - lastTap.timestamp < 300) {
        const distance = Math.sqrt(
          Math.pow(touchPoint.x - lastTap.x, 2) + 
          Math.pow(touchPoint.y - lastTap.y, 2)
        )
        if (distance < 50 && handlers.onDoubleTap) {
          handlers.onDoubleTap()
          setLastTap(null)
          return
        }
      }
      setLastTap(touchPoint)

      // 长按检测
      if (handlers.onLongPress) {
        const timer = setTimeout(() => {
          handlers.onLongPress!()
        }, 500)
        setLongPressTimer(timer)
      }

      // 缩放手势检测
      if (e.touches.length === 2 && handlers.onPinch) {
        const distance = getDistance(e.touches[0], e.touches[1])
        setInitialDistance(distance)
      }
    }

    // 触摸移动
    const handleTouchMove = (e: TouchEvent) => {
      // 清除长按定时器
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }

      // 缩放手势处理
      if (e.touches.length === 2 && initialDistance && handlers.onPinch) {
        const currentDistance = getDistance(e.touches[0], e.touches[1])
        const scale = currentDistance / initialDistance
        handlers.onPinch(scale)
      }
    }

    // 触摸结束
    const handleTouchEnd = (e: TouchEvent) => {
      // 清除长按定时器
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }

      if (!touchStart || e.touches.length > 0) return

      const touch = e.changedTouches[0]
      const touchEnd: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }

      const deltaX = touchEnd.x - touchStart.x
      const deltaY = touchEnd.y - touchStart.y
      const deltaTime = touchEnd.timestamp - touchStart.timestamp
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // 滑动手势检测（最小距离50px，最大时间300ms）
      if (distance > 50 && deltaTime < 300) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

        if (Math.abs(angle) < 45) {
          // 向右滑动
          handlers.onSwipeRight?.()
        } else if (Math.abs(angle) > 135) {
          // 向左滑动
          handlers.onSwipeLeft?.()
        } else if (angle > 45 && angle < 135) {
          // 向下滑动
          handlers.onSwipeDown?.()
        } else if (angle < -45 && angle > -135) {
          // 向上滑动
          handlers.onSwipeUp?.()
        }
      }

      setTouchStart(null)
      setInitialDistance(null)
    }

    // 添加事件监听器
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [handlers, touchStart, lastTap, longPressTimer, initialDistance])

  return elementRef
}

// 触觉反馈Hook
export function useHapticFeedback() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return {
    light: () => vibrate(10),
    medium: () => vibrate(50),
    heavy: () => vibrate([50, 50, 50]),
    success: () => vibrate([100, 50, 100]),
    error: () => vibrate([200, 100, 200, 100, 200])
  }
}

// 移动端性能监控Hook
export function useMobilePerformance() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memoryUsage: 0,
    loadTime: 0
  })

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setMetrics(prev => ({ ...prev, fps }))
        frameCount = 0
        lastTime = currentTime
      }
      
      animationId = requestAnimationFrame(measureFPS)
    }

    // 开始FPS监控
    animationId = requestAnimationFrame(measureFPS)

    // 内存使用监控
    if ('memory' in performance) {
      const memory = (performance as any).memory
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024)
      }))
    }

    // 页面加载时间
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    setMetrics(prev => ({ ...prev, loadTime }))

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return metrics
}
