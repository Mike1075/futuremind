'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  icon: ReactNode
  iconBgClass: string
  children: ReactNode
  defaultExpanded?: boolean
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  iconBgClass,
  children,
  defaultExpanded = false
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="mb-8">
      {/* 可点击的标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${iconBgClass} flex items-center justify-center text-2xl shadow-lg`}>
            {icon}
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
        </motion.div>
      </button>

      {/* 可折叠内容区域 */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
