'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Monitor, 
  TreePine, 
  MessageCircle, 
  Database, 
  Zap,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  ArrowRight,
  Target,
  Users,
  BookOpen,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'

interface ModuleStatus {
  id: string
  name: string
  icon: any
  color: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'needs-review'
  progress: number
  lastUpdated: string
}

export default function HomePage() {
  const [modules, setModules] = useState<ModuleStatus[]>([
    {
      id: '1',
      name: '主应用界面',
      icon: Monitor,
      color: 'blue',
      description: '用户界面和交互设计检测',
      status: 'pending',
      progress: 0,
      lastUpdated: '2024-01-01'
    },
    {
      id: '2',
      name: '意识进化树',
      icon: TreePine,
      color: 'green',
      description: '意识发展可视化系统检测',
      status: 'pending',
      progress: 0,
      lastUpdated: '2024-01-01'
    },
    {
      id: '3',
      name: 'Gaia AI对话',
      icon: MessageCircle,
      color: 'purple',
      description: 'AI智能对话系统检测',
      status: 'pending',
      progress: 0,
      lastUpdated: '2024-01-01'
    },
    {
      id: '4',
      name: '用户认证系统',
      icon: Shield,
      color: 'red',
      description: '登录注册和权限管理检测',
      status: 'pending',
      progress: 0,
      lastUpdated: '2024-01-01'
    },
    {
      id: '5',
      name: '数据库架构',
      icon: Database,
      color: 'yellow',
      description: '数据存储和管理系统检测',
      status: 'pending',
      progress: 0,
      lastUpdated: '2024-01-01'
    },
    {
      id: '6',
      name: '整体性能',
      icon: Zap,
      color: 'pink',
      description: '系统性能和优化检测',
      status: 'pending',
      progress: 0,
      lastUpdated: '2024-01-01'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'in-progress': return 'text-blue-400'
      case 'needs-review': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in-progress': return '进行中'
      case 'needs-review': return '待审核'
      default: return '待开始'
    }
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-400',
      green: 'from-green-500 to-green-400',
      purple: 'from-purple-500 to-purple-400',
      red: 'from-red-500 to-red-400',
      yellow: 'from-yellow-500 to-yellow-400',
      pink: 'from-pink-500 to-pink-400'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const completedModules = modules.filter(m => m.status === 'completed').length
  const totalProgress = modules.reduce((acc, m) => acc + m.progress, 0) / modules.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-blue-800/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-8">
              <Shield className="w-20 h-20 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
              项目质量检测中心
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              专业的项目质量评估平台，为六大核心模块提供全面的检测标准、详细的操作指导和智能化的质量评估服务
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/inspection"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                开始检测
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                查看指南
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{modules.length}</div>
                  <div className="text-gray-400 text-sm">检测模块</div>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-400">{completedModules}</div>
                  <div className="text-gray-400 text-sm">已完成</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-400">{Math.round(totalProgress)}%</div>
                  <div className="text-gray-400 text-sm">总体进度</div>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-400">A+</div>
                  <div className="text-gray-400 text-sm">质量等级</div>
                </div>
                <Shield className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">检测模块</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              六大核心模块的专业质量检测，每个模块都配备详细的检测标准、测试用例和评估指导
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => {
              const IconComponent = module.icon
              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-200 group"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <IconComponent className={`w-8 h-8 text-${module.color}-400`} />
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(module.status)} bg-white/10`}>
                        {getStatusText(module.status)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">{module.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{module.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>进度</span>
                        <span>{module.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getColorClasses(module.color)} transition-all duration-500`}
                          style={{ width: `${module.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/inspect/${module.id}`}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        详细检测
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30"
          >
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
              为什么选择我们的检测系统？
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-medium text-white mb-3">🎯 专业标准</h4>
                <p className="text-gray-300 text-sm">
                  基于行业最佳实践制定的检测标准，涵盖性能、安全、用户体验等多个维度
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-white mb-3">📋 详细指导</h4>
                <p className="text-gray-300 text-sm">
                  每个检测项目都提供详细的操作步骤、测试用例和预期结果，小白也能轻松上手
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-white mb-3">🤖 智能评估</h4>
                <p className="text-gray-300 text-sm">
                  特别为Gaia AI对话系统准备了专业的测试提示词和评估标准
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/inspection"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                立即开始检测
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}