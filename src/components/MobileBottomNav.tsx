'use client'

import { motion } from 'framer-motion'
import { Home, TreePine, Target, Users, MessageCircle } from 'lucide-react'
// import { useRouter } from 'next/navigation'

interface MobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onGaiaClick: () => void
}

export default function MobileBottomNav({ activeTab, onTabChange, onGaiaClick }: MobileBottomNavProps) {
  // const router = useRouter()
  
  const tabs = [
    { id: 'home', icon: Home, label: '首页' },
    { id: 'tasks', icon: Target, label: '任务' },
    { id: 'tree', icon: TreePine, label: '进化树' },
    { id: 'project', icon: Users, label: '项目' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 z-40">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center py-2 px-3 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-purple-500/20 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon 
                className={`w-5 h-5 mb-1 transition-colors relative z-10 ${
                  isActive ? 'text-purple-400' : 'text-gray-400'
                }`} 
              />
              <span 
                className={`text-xs transition-colors relative z-10 ${
                  isActive ? 'text-purple-400' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
        
        {/* Gaia Button */}
        <button
          onClick={onGaiaClick}
          className="flex flex-col items-center py-2 px-3"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-1">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs text-purple-400">盖亚</span>
        </button>
      </div>
    </div>
  )
}