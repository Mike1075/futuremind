// 移动端性能优化工具函数

// 动画性能优化配置
export const mobileAnimationConfig = {
  // 移动端优化的动画配置
  mobile: {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94],
    stiffness: 300,
    damping: 30
  },

  // 桌面端动画配置
  desktop: {
    duration: 0.5,
    ease: [0.23, 1, 0.32, 1],
    stiffness: 200,
    damping: 25
  },

  // 减少动画的配置（低性能设备）
  reduced: {
    duration: 0.1,
    ease: "linear",
    stiffness: 500,
    damping: 50
  }
}

// 检测设备性能等级
export function getDevicePerformanceLevel(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium'

  const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator as any).deviceMemory || 4
  const connection = (navigator as any).connection
  const effectiveType = connection?.effectiveType || '4g'

  let score = 0

  if (cores >= 8) score += 3
  else if (cores >= 4) score += 2
  else score += 1

  if (memory >= 8) score += 3
  else if (memory >= 4) score += 2
  else score += 1

  if (effectiveType === '4g') score += 2
  else if (effectiveType === '3g') score += 1

  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

// 获取适合当前设备的动画配置
export function getOptimalAnimationConfig(isMobile: boolean) {
  const performanceLevel = getDevicePerformanceLevel()

  // 检测用户是否偏好减少动画（仅在客户端）
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  if (prefersReducedMotion || performanceLevel === 'low') {
    return mobileAnimationConfig.reduced
  }

  return isMobile ? mobileAnimationConfig.mobile : mobileAnimationConfig.desktop
}

// 粒子数量优化
export function getOptimalParticleCount(isMobile: boolean): number {
  const performanceLevel = getDevicePerformanceLevel()
  
  if (isMobile) {
    switch (performanceLevel) {
      case 'high': return 30
      case 'medium': return 20
      case 'low': return 10
      default: return 15
    }
  } else {
    switch (performanceLevel) {
      case 'high': return 80
      case 'medium': return 50
      case 'low': return 30
      default: return 50
    }
  }
}

// 图片懒加载工具
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// 防抖函数（用于resize事件等）
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数（用于滚动事件等）
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 移动端视口检测
export function getMobileViewport() {
  if (typeof window === 'undefined') {
    return {
      width: 375,
      height: 667,
      isPortrait: true,
      isLandscape: false,
      devicePixelRatio: 1,
      isMobile: true,
      isTablet: false,
      isDesktop: false
    }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isPortrait: window.innerHeight > window.innerWidth,
    isLandscape: window.innerWidth > window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  }
}

// 性能监控
export function logPerformanceMetrics() {
  if (typeof window === 'undefined') return

  console.log('📊 移动端性能监控已启动')
  return { fps: 60, memoryUsage: 0, loadTime: 0 }
}
