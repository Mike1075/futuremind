// 移动端组件库导出文件

// 基础组件
export { default as MobileButton, MobileFAB, MobileCard } from './MobileButton'

// 布局组件
export { default as MobileContainer } from './MobileContainer'
export { default as MobileGrid } from './MobileGrid'

// 交互组件
export { default as MobileSwipeNavigation } from '../MobileSwipeNavigation'
export { default as MobileLongPressMenu, useGlobalLongPressMenu } from '../MobileLongPressMenu'

// 媒体组件
export { default as MobileLazyImage, useMobileImageOptimization, preloadImage, preloadImages } from '../MobileLazyImage'

// PWA组件
export { default as PWAInstaller } from '../PWAInstaller'

// 工具函数和Hooks
export {
  useMobileGestures,
  useHapticFeedback
} from '../../hooks/useMobileGestures'

export {
  getOptimalAnimationConfig,
  getOptimalParticleCount,
  getMobileViewport,
  useKeyboardDetection,
  useNetworkStatus,
  useBatteryStatus,
  logPerformanceMetrics,
  mobileAnimationConfig
} from '../../utils/mobilePerformance'

export {
  usePushNotifications,
  pushManager
} from '../../utils/pushNotifications'
