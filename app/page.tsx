// @ts-nocheck
'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, TreePine, Users, Shield, User, ChevronDown, LogOut, Key, Settings, Bell, Inbox, Calendar } from 'lucide-react'
import { useUnreadCount } from '@/lib/aip/useUnreadCount'
import { InteractionLog } from '@/components/aip/InteractionLog'

// 盖亚图标组件 - 炫彩旋转边框 + 对话气泡
function GaiaIcon() {
  return (
    <div className="gaia-icon">
      <div className="gaia-icon-glow" />
      <div className="gaia-icon-border" />
      <div className="gaia-icon-inner" />
      <div className="gaia-icon-chat">
        <MessageCircle strokeWidth={2.5} />
      </div>
    </div>
  )
}
import AuthModal from '@/components/AuthModal'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false)
  const { totalCount: unreadCount, loading: unreadLoading } = useUnreadCount()

  useEffect(() => {
    setIsMounted(true)
    checkAdminStatus()
  }, [])


  const checkAdminStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)
        setUserEmail(user.email || null)

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle()

        const userRole = profile?.role
        setUserName(profile?.full_name || null)

        if (userRole === 'principal' || userRole === 'teacher') {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } else {
        setIsLoggedIn(false)
        setIsAdmin(false)
        setUserName(null)
        setUserEmail(null)
      }
    } catch (error) {
      console.error('检查管理员状态失败:', error)
      setIsLoggedIn(false)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleGaiaClick = () => {
    // 触发全局盖亚打开事件（GlobalGaiaV3 会处理登录检查）
    window.dispatchEvent(new CustomEvent('openGaia'))
  }

  const handlePBLClick = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true)
    } else {
      window.location.href = '/explorer-alliance'
    }
  }

  // 能量粒子 - 更有灵性的运动
  const energyParticles = useMemo(() => {
    if (!isMounted) return []
    return [...Array(40)].map((_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      color: ['#FFD700', '#9D00FF', '#00FFFF'][Math.floor(Math.random() * 3)]
    }))
  }, [isMounted])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* 能量粒子层 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isMounted && energyParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
              boxShadow: `0 0 ${particle.size * 4}px ${particle.color}40`,
            }}
            animate={{
              x: [0, particle.x, 0],
              y: [0, particle.y, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* 左上角用户菜单 / 登录按钮 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute top-8 left-8 z-20"
      >
        {isLoggedIn ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
              className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors duration-300 group"
            >
              <div className="relative">
                <div className="user-avatar-icon">
                  <div className="user-avatar-icon-inner">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                {/* 未读消息红色小铃铛 */}
                {!unreadLoading && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Bell className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <span className="font-medium">{userName || '用户'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 下拉菜单 */}
            {isUserMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
                {/* 用户信息头部 */}
                <div className="px-4 py-3 border-b border-zinc-700">
                  <p className="text-sm font-medium text-white">{userName || '用户'}</p>
                  <p className="text-xs text-zinc-400 truncate">{userEmail}</p>
                </div>

                {/* 菜单项 */}
                <div className="py-2">
                  {/* 个人资料 */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      setShowProfileModal(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>个人资料</span>
                  </button>

                  {/* 修改密码 */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      window.location.href = '/reset-password'
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    <span>修改密码</span>
                  </button>

                  {/* 消息盒子 */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      setIsMessageBoxOpen(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Inbox className="w-4 h-4" />
                    <span>消息盒子</span>
                    {!unreadLoading && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* 管理后台 - 仅管理员可见 */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        window.location.href = '/admin'
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>管理后台</span>
                    </button>
                  )}

                  {/* 分隔线 */}
                  <div className="my-2 border-t border-zinc-700"></div>

                  {/* 退出登录 */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="btn-stardust"
          >
            登录
          </button>
        )}
      </motion.div>

      {/* 主内容区域 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-center z-10 max-w-5xl mx-auto px-6"
      >
        {/* 神圣标题 */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-10"
        >
          {/* 神圣图腾 - 呼吸发光效果 */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 via-purple-500/20 to-blue-500/20 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(255,215,0,0.4)] border border-yellow-500/30">
                <TreePine className="w-10 h-10 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* 主标题 - 神圣字体 + 金紫渐变 */}
          <h1 className="font-sacred text-6xl md:text-7xl lg:text-8xl font-semibold text-gradient-gold-purple text-glow-gold mb-4 tracking-wider">
            未来心灵学院
          </h1>
          <p className="text-xl md:text-2xl text-starlight-dim font-light tracking-widest">
            Future Mind Institute
          </p>
        </motion.div>

        {/* 宣言 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-lg md:text-xl text-starlight-muted mb-14 leading-relaxed max-w-3xl mx-auto"
        >
          一个面向后AGI时代的全球意识觉醒生态系统
          <br />
          <span className="text-amber-100/80 font-medium">
            宇宙正在低语，你，准备好聆听了吗？
          </span>
        </motion.p>

        {/* 季度公告卡片 - 极光边框效果 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="w-full max-w-2xl card-aurora mx-auto mb-14"
        >
          <div className="card-aurora-inner">
            <div className="flex items-center justify-center mb-4">
              <h2 className="font-sacred text-2xl md:text-3xl text-white tracking-wide">
                第一季：声音的交响
              </h2>
            </div>
            <p className="text-starlight-dim mb-6">
              一场关于声音、寂静与实相的旅程即将开启
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-starlight-muted">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gaia-gold animate-pulse shadow-[0_0_8px_#FFD700]" />
                全球同步探索
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-mystic-purple animate-pulse shadow-[0_0_8px_#9D00FF]" style={{ animationDelay: '0.5s' }} />
                意识觉醒之旅
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-ethereal-blue animate-pulse shadow-[0_0_8px_#00FFFF]" style={{ animationDelay: '1s' }} />
                与盖亚共创
              </span>
            </div>
          </div>
        </motion.div>

        {/* 行动按钮组 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center flex-wrap"
        >
          {/* 与盖亚对话 - 统一风格 */}
          <motion.button
            onClick={handleGaiaClick}
            className="btn-stardust group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              与盖亚对话
            </span>
          </motion.button>

          {/* 探索者联盟 */}
          <motion.button
            onClick={handlePBLClick}
            className="btn-stardust group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Users className="w-5 h-5" />
              探索者联盟
            </span>
          </motion.button>

          {/* 个人门户 */}
          <motion.button
            onClick={() => {
              if (!isLoggedIn) {
                setShowAuthModal(true)
              } else {
                window.location.href = '/portal'
              }
            }}
            className="btn-stardust group"
            style={{ borderColor: 'rgba(0, 255, 136, 0.4)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <TreePine className="w-5 h-5" />
              个人门户
            </span>
          </motion.button>

          {/* 赛斯365 */}
          <motion.button
            onClick={() => window.location.href = '/seth365'}
            className="btn-stardust group"
            style={{ borderColor: 'rgba(147, 51, 234, 0.5)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              赛斯365
            </span>
          </motion.button>

          {/* 管理员入口 */}
          {isAdmin && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => window.location.href = '/admin'}
              className="btn-stardust group"
              style={{ borderColor: 'rgba(255, 105, 180, 0.5)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                管理后台
              </span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>

      {/* 浮动盖亚按钮 - 炫彩旋转边框 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 2 }}
        onClick={handleGaiaClick}
        className="fixed bottom-8 right-8 z-50 cursor-pointer hover:scale-110 transition-transform duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <GaiaIcon />
      </motion.div>

      {/* 底部装饰线 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 1.5 }}
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gaia-gold/30 to-transparent"
      />

      {/* 登录弹窗 */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* 用户资料弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 消息盒子弹窗 */}
      {isMessageBoxOpen && (
        <InteractionLog
          onClose={() => setIsMessageBoxOpen(false)}
        />
      )}
    </div>
  )
}
