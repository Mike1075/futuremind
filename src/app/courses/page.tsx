'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Play, CheckCircle, Clock, Users } from 'lucide-react'

const seasonOneData = {
  title: '第一季：声音的交响',
  subtitle: 'The Symphony of Existence',
  description: '以"聆听"为起点，瓦解我们对声音、寂静和交流的旧有认知，并由此窥见宇宙的真相。',
  totalWeeks: 4,
  currentWeek: 1,
  progress: 25,
  participants: 1247
}

const weeklyContent = [
  {
    week: 1,
    title: '聆听的艺术',
    subtitle: 'The Art of True Listening',
    description: '学习克里希那穆提的核心法门——"不带选择的觉察"，从最基础的"听"开始，打开内在空间。',
    status: 'current',
    days: [
      {
        day: 1,
        title: '自在聆听：敞开宇宙的大门',
        description: '放下感官的偏见，对所有层次的实相敞开',
        meditation: '广阔空间里的聆听',
        practice: '声音的暂停',
        completed: true,
        duration: '45分钟'
      },
      {
        day: 2,
        title: '欲望的屏障：聆听你自己的独白',
        description: '听见那个正在扭曲真相的自己',
        meditation: '看见聆听的屏障',
        practice: '反应觉察',
        completed: true,
        duration: '50分钟'
      },
      {
        day: 3,
        title: '超越语言：聆听话中的诗意',
        description: '真正的沟通发生在超越语言的能量共振中',
        meditation: '聆听言语的间隙',
        practice: '感受话语的能量',
        completed: false,
        duration: '55分钟'
      }
    ]
  }
]

export default function CoursesPage() {
  const [selectedDay, setSelectedDay] = useState<any>(null)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* 头部 */}
      <div className="relative z-10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{seasonOneData.title}</h1>
              <p className="text-purple-200 text-lg">{seasonOneData.subtitle}</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-gray-300 mb-4">{seasonOneData.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-white">第 {seasonOneData.currentWeek} 周 / 共 {seasonOneData.totalWeeks} 周</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-white">{seasonOneData.participants.toLocaleString()} 位探索者</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 课程内容 */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="space-y-8">
          {weeklyContent.map((week, weekIndex) => (
            <motion.div
              key={week.week}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: weekIndex * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl border border-purple-500/50 bg-purple-900/20"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">第{week.week}周：{week.title}</h2>
                    <p className="text-purple-200">{week.subtitle}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                    进行中
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6">{week.description}</p>
                
                <div className="space-y-3">
                  {week.days.map((day, dayIndex) => (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: weekIndex * 0.1 + dayIndex * 0.05 }}
                      onClick={() => setSelectedDay(day)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        day.completed
                          ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                          : 'bg-white/5 border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          day.completed ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
                        }`}>
                          {day.completed ? <CheckCircle className="w-4 h-4" /> : day.day}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{day.title}</h4>
                          <p className="text-sm text-gray-300">{day.description}</p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{day.duration}</div>
                          <Play className="w-4 h-4 text-purple-400 mt-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 课程详情弹窗 */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDay(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-2xl w-full border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">第{selectedDay.day}天</h2>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">{selectedDay.title}</h3>
            <p className="text-gray-300 mb-6">{selectedDay.description}</p>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">🧘 今日冥想</h4>
                <p className="text-gray-300">{selectedDay.meditation}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">🌱 生活修行</h4>
                <p className="text-gray-300">{selectedDay.practice}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedDay(null)}
                className="flex-1 py-2 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                稍后学习
              </button>
              <button
                className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                开始今日修行
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
