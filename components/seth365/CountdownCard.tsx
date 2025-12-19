'use client'

import { motion } from 'framer-motion'
import { Calendar, Sparkles, Clock } from 'lucide-react'
import { getDaysUntilLaunch, LAUNCH_DATE } from '@/lib/seth365/wallpaper'

export function CountdownCard() {
  const daysLeft = getDaysUntilLaunch()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-8 md:p-12 text-center relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* 图标 */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 mb-6"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full flex items-center justify-center border border-purple-400/30">
            <Calendar className="w-10 h-10 text-purple-300" />
          </div>
        </motion.div>

        {/* 标题 */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 text-3xl md:text-4xl font-bold text-white mb-4"
        >
          赛斯365
        </motion.h2>

        {/* 倒计时数字 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="relative z-10 mb-6"
        >
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-2xl px-8 py-4 border border-purple-400/30">
            <Clock className="w-6 h-6 text-purple-300 mr-3" />
            <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              {daysLeft}
            </span>
            <span className="text-2xl text-purple-200 ml-3">天</span>
          </div>
        </motion.div>

        {/* 幽默提示语 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 text-lg text-gray-300 mb-6 leading-relaxed"
        >
          宇宙正在为你酝酿每日灵感...
          <br />
          <span className="text-purple-300">
            在那之前，不如先把期待装进口袋？
          </span>
        </motion.p>

        {/* 启动日期 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 flex items-center justify-center text-gray-400"
        >
          <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
          <span>
            启程日：{LAUNCH_DATE.getFullYear()}年{LAUNCH_DATE.getMonth() + 1}月
            {LAUNCH_DATE.getDate()}日
          </span>
          <Sparkles className="w-4 h-4 ml-2 text-yellow-400" />
        </motion.div>

        {/* 下载预告 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 mt-8 pt-6 border-t border-white/10"
        >
          <p className="text-sm text-gray-400 mb-4">
            提前下载客户端，启程当天自动开启
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/seth365/downloads/Seth365.apk"
              download
              className="btn-stardust px-6 py-2 text-sm"
            >
              Android 版
            </a>
            <a
              href="/seth365/downloads/Seth365_Setup.exe"
              download
              className="btn-stardust px-6 py-2 text-sm"
            >
              Windows 版
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
