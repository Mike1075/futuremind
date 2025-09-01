'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'

interface MobileContainerProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  center?: boolean
  animated?: boolean
  safeArea?: boolean
}

const MobileContainer = forwardRef<HTMLDivElement, MobileContainerProps>(({
  children,
  className = '',
  padding = 'md',
  maxWidth = 'lg',
  center = false,
  animated = false,
  safeArea = true,
  ...props
}, ref) => {
  // 内边距样式
  const paddingStyles = {
    none: '',
    sm: 'px-3 py-2',
    md: 'px-4 py-4',
    lg: 'px-6 py-6'
  }

  // 最大宽度样式
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  }

  // 安全区域样式
  const safeAreaStyles = safeArea 
    ? 'pb-safe-area-inset-bottom pt-safe-area-inset-top' 
    : ''

  const containerClasses = `
    w-full
    ${paddingStyles[padding]}
    ${maxWidthStyles[maxWidth]}
    ${center ? 'mx-auto' : ''}
    ${safeAreaStyles}
    ${className}
  `.trim()

  if (animated) {
    return (
      <motion.div
        ref={ref}
        className={containerClasses}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      ref={ref}
      className={containerClasses}
      {...props}
    >
      {children}
    </div>
  )
})

MobileContainer.displayName = 'MobileContainer'

export default MobileContainer

// 移动端安全区域组件
interface MobileSafeAreaProps {
  children: React.ReactNode
  top?: boolean
  bottom?: boolean
  className?: string
}

export function MobileSafeArea({ 
  children, 
  top = true, 
  bottom = true, 
  className = '' 
}: MobileSafeAreaProps) {
  const safeAreaClasses = `
    ${top ? 'pt-safe-area-inset-top' : ''}
    ${bottom ? 'pb-safe-area-inset-bottom' : ''}
    ${className}
  `.trim()

  return (
    <div className={safeAreaClasses}>
      {children}
    </div>
  )
}

// 移动端页面包装器
interface MobilePageWrapperProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  className?: string
}

export function MobilePageWrapper({
  children,
  title,
  showBackButton = false,
  onBack,
  className = ''
}: MobilePageWrapperProps) {
  return (
    <MobileSafeArea className={`min-h-screen ${className}`}>
      {/* 页面头部 */}
      {(title || showBackButton) && (
        <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 text-white/80 hover:text-white transition-colors"
              >
                ←
              </button>
            )}
            {title && (
              <h1 className="text-white font-semibold text-lg flex-1 text-center">
                {title}
              </h1>
            )}
            {showBackButton && <div className="w-10" />} {/* 占位符保持居中 */}
          </div>
        </div>
      )}

      {/* 页面内容 */}
      <div className="flex-1">
        {children}
      </div>
    </MobileSafeArea>
  )
}
