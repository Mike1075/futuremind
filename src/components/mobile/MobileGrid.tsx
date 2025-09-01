'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'

interface MobileGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
  staggerDelay?: number
}

const MobileGrid = forwardRef<HTMLDivElement, MobileGridProps>(({
  children,
  cols = 2,
  gap = 'md',
  className = '',
  animated = false,
  staggerDelay = 0.1,
  ...props
}, ref) => {
  // 列数样式
  const colsStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  // 间距样式
  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  const gridClasses = `
    grid
    ${colsStyles[cols]}
    ${gapStyles[gap]}
    ${className}
  `.trim()

  if (animated) {
    return (
      <motion.div
        ref={ref}
        className={gridClasses}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay
            }
          }
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      ref={ref}
      className={gridClasses}
      {...props}
    >
      {children}
    </div>
  )
})

MobileGrid.displayName = 'MobileGrid'

export default MobileGrid

// 移动端网格项组件
interface MobileGridItemProps {
  children: React.ReactNode
  span?: 1 | 2 | 3 | 4
  className?: string
  animated?: boolean
}

export function MobileGridItem({
  children,
  span = 1,
  className = '',
  animated = false
}: MobileGridItemProps) {
  const spanStyles = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4'
  }

  const itemClasses = `
    ${spanStyles[span]}
    ${className}
  `.trim()

  if (animated) {
    return (
      <motion.div
        className={itemClasses}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={itemClasses}>
      {children}
    </div>
  )
}

// 移动端瀑布流布局
interface MobileMasonryProps {
  children: React.ReactNode
  cols?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MobileMasonry({
  children,
  cols = 2,
  gap = 'md',
  className = ''
}: MobileMasonryProps) {
  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div 
      className={`columns-${cols} ${gapStyles[gap]} ${className}`}
      style={{ columnFill: 'balance' }}
    >
      {children}
    </div>
  )
}

// 移动端瀑布流项
interface MobileMasonryItemProps {
  children: React.ReactNode
  className?: string
}

export function MobileMasonryItem({
  children,
  className = ''
}: MobileMasonryItemProps) {
  return (
    <div className={`break-inside-avoid mb-4 ${className}`}>
      {children}
    </div>
  )
}
