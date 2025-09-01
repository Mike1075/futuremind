'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useMobileGestures'

interface MobileButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  hapticFeedback?: 'light' | 'medium' | 'heavy'
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  hapticFeedback = 'light',
  onClick,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const haptic = useHapticFeedback()

  const handleClick = () => {
    if (disabled || loading) return
    
    // 触觉反馈
    switch (hapticFeedback) {
      case 'light':
        haptic.light()
        break
      case 'medium':
        haptic.medium()
        break
      case 'heavy':
        haptic.heavy()
        break
    }
    
    onClick?.()
  }

  // 变体样式
  const variantStyles = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25',
    secondary: 'bg-white/10 text-white border border-white/20 backdrop-blur-sm',
    ghost: 'text-white hover:bg-white/10',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/25'
  }

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  }

  // 禁用状态样式
  const disabledStyles = disabled || loading 
    ? 'opacity-50 cursor-not-allowed' 
    : 'hover:scale-105 active:scale-95'

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-xl font-semibold transition-all duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabledStyles}
        ${className}
      `}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
          />
        </div>
      )}
      
      {/* 按钮内容 */}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      
      {/* 点击波纹效果 */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-xl"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.1 }}
      />
    </motion.button>
  )
})

MobileButton.displayName = 'MobileButton'

export default MobileButton

// 浮动操作按钮组件
interface MobileFABProps {
  icon: React.ReactNode
  onClick: () => void
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'lg'
  className?: string
}

export function MobileFAB({
  icon,
  onClick,
  position = 'bottom-right',
  variant = 'primary',
  size = 'md',
  className = ''
}: MobileFABProps) {
  const haptic = useHapticFeedback()

  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  }

  const variantStyles = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/25',
    secondary: 'bg-white/10 backdrop-blur-sm border border-white/20'
  }

  const sizeStyles = {
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  }

  const handleClick = () => {
    haptic.medium()
    onClick()
  }

  return (
    <motion.button
      onClick={handleClick}
      className={`
        fixed z-40 rounded-full flex items-center justify-center text-white
        ${positionStyles[position]}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {icon}
      
      {/* 脉冲效果 */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.button>
  )
}

// 移动端卡片组件
interface MobileCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hapticFeedback?: boolean
}

export function MobileCard({ 
  children, 
  className = '', 
  onClick, 
  hapticFeedback = true 
}: MobileCardProps) {
  const haptic = useHapticFeedback()

  const handleClick = () => {
    if (hapticFeedback) {
      haptic.light()
    }
    onClick?.()
  }

  return (
    <motion.div
      onClick={handleClick}
      className={`
        bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  )
}
