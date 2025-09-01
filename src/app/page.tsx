'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Monitor, 
  TreePine, 
  MessageCircle, 
  Database, 
  Zap,
  ArrowRight,
  CheckCircle,
  Settings,
  BookOpen,
  BarChart3
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const modules = [
    { 
      id: 'ui', 
      name: '主应用界面', 
      icon: Monitor, 
      color: 'blue',
      description: '页面加载、响应式设计、动画效果检测',
      standards: ['加载时间<3秒', '响应式适配', '动画流畅度']
    },
    { 
      id: 'tree', 
      name: '意识进化树', 
      icon: TreePine, 
      color: 'green',
      description: '数据渲染、交互响应、进度计算检测',
      standards: ['数据准确性100%', '响应时间<100ms', '动画60FPS']
    },
    { 
      id: 'dialog', 
      name: '盖亚AI对话', 
      icon: MessageCircle, 
      color: 'purple',
      description: 'AI响应速度、对话质量、并发测试',
      standards: ['响应时间<2秒', '准确率>85%', '并发支持']
    },
    { 
      id: 'auth', 
      name: '用户认证系统', 
      icon: Shield, 
      color: 'red',
      description: '登录注册、权限控制、安全性检测',
      standards: ['登录成功率100%', '权限控制准确', '密码安全']
    },
    { 
      id: 'database', 
      name: '数据库架构', 
      icon: Database, 
      color: 'yellow',
      description: '数据完整性、查询性能、同步检测',
      standards: ['数据完整性100%', '查询速度<500ms', '同步准确']
    },
    { 
      id: 'performance', 
      name: '整体性能', 
      icon: Zap, 
      color: 'pink',
      description: '系统性能、内存使用、错误监控',
      standards: ['内存使用<500MB', 'CPU使用<80%', '错误率<1%']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-purple-400 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                未来心灵学院 - 项目质量检测中心
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/inspection')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                进入检测中心
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            欢迎使用项目质量检测系统
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            专为质量把关专员设计的六模块项目检测平台
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              onClick={() => router.push('/inspection')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg"
            >
              🚀 开始项目检测
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </motion.button>
            
            <motion.button
              onClick={() => router.push('/guide')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-purple-400 text-purple-300 font-semibold rounded-lg hover:bg-purple-400 hover:text-white transition-all duration-300"
            >
              📚 查看检测指南
              <BookOpen className="w-5 h-5 inline ml-2" />
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
            <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">6</div>
            <div className="text-gray-400 text-sm">检测模块</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">24</div>
            <div className="text-gray-400 text-sm">检测标准</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
            <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">100%</div>
            <div className="text-gray-400 text-sm">自动化检测</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
            <Settings className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">实时</div>
            <div className="text-gray-400 text-sm">检测报告</div>
          </div>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {modules.map((module, index) => {
            const IconComponent = module.icon
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div className="flex items-center mb-4">
                  <IconComponent className={`w-8 h-8 text-${module.color}-400 mr-3`} />
                  <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {module.description}
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 font-medium">检测标准：</div>
                  {module.standards.map((standard, idx) => (
                    <div key={idx} className="flex items-center text-xs text-gray-300">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                      <span>{standard}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/inspection?module=${module.id}`)}
                  className="w-full mt-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors group-hover:bg-purple-600"
                >
                  开始检测
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30"
        >
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">
            快速操作
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/inspection')}
              className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-center group"
            >
              <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium">全面检测</div>
              <div className="text-gray-400 text-sm">一键检测所有六个模块</div>
            </button>
            
            <button
              onClick={() => router.push('/inspection')}
              className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-center group"
            >
              <Settings className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium">自定义检测</div>
              <div className="text-gray-400 text-sm">选择特定模块进行检测</div>
            </button>
            
            <button
              onClick={() => router.push('/reports')}
              className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-center group"
            >
              <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium">查看报告</div>
              <div className="text-gray-400 text-sm">历史检测记录和分析</div>
            </button>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">📚 小白操作指南</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">🚀 快速开始：</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>点击"开始项目检测"进入检测中心</li>
                <li>选择要检测的模块或进行全面检测</li>
                <li>等待自动化检测完成（通常1-3分钟）</li>
                <li>查看详细的检测报告和改进建议</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">📊 评分标准：</h4>
              <ul className="space-y-1">
                <li>• <span className="text-green-400">90-100分</span>：优秀，完全符合标准</li>
                <li>• <span className="text-yellow-400">80-89分</span>：良好，基本符合要求</li>
                <li>• <span className="text-orange-400">60-79分</span>：及格，需要改进</li>
                <li>• <span className="text-red-400">60分以下</span>：不合格，需要重做</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center mb-2">
              <BookOpen className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-blue-300 font-medium">💡 小贴士</span>
            </div>
            <p className="text-gray-300 text-sm">
              作为质量把关专员，您的工作对项目成功至关重要。每次检测都会生成详细报告，
              帮助开发团队了解问题并持续改进。记住，检测不仅是找问题，更是确保项目能够
              真正帮助用户实现意识觉醒和内在成长的目标。
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}