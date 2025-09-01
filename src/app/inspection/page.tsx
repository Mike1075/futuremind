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
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning'
  score?: number
  message?: string
  details?: string[]
  duration?: number
}

interface ModuleTest {
  id: string
  name: string
  icon: any
  color: string
  description: string
  tests: TestResult[]
  overallScore?: number
  status: 'idle' | 'running' | 'completed'
}

export default function InspectionDashboard() {
  const router = useRouter()
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [isRunningAll, setIsRunningAll] = useState(false)
  const [modules, setModules] = useState<ModuleTest[]>([
    {
      id: 'ui',
      name: '主应用界面',
      icon: Monitor,
      color: 'blue',
      description: '页面加载、响应式设计、动画效果检测',
      status: 'idle',
      tests: [
        { id: 'load-speed', name: '页面加载速度', status: 'pending' },
        { id: 'responsive', name: '响应式设计', status: 'pending' },
        { id: 'animation', name: '动画流畅度', status: 'pending' },
        { id: 'compatibility', name: '浏览器兼容性', status: 'pending' }
      ]
    },
    {
      id: 'consciousness_tree',
      name: '意识进化树',
      icon: TreePine,
      color: 'green',
      description: '数据渲染、交互响应、进度计算检测',
      status: 'idle',
      tests: [
        { id: 'data-accuracy', name: '数据渲染准确性', status: 'pending' },
        { id: 'interaction', name: '交互响应速度', status: 'pending' },
        { id: 'animation-fps', name: '动画帧率', status: 'pending' },
        { id: 'progress-calc', name: '进度计算验证', status: 'pending' }
      ]
    },
    {
      id: 'ai_dialogue',
      name: '盖亚AI对话',
      icon: MessageCircle,
      color: 'purple',
      description: 'AI响应速度、对话质量、并发测试',
      status: 'idle',
      tests: [
        { id: 'ai-response', name: 'AI响应速度', status: 'pending' },
        { id: 'dialogue-quality', name: '对话质量评估', status: 'pending' },
        { id: 'concurrent-users', name: '并发用户测试', status: 'pending' },
        { id: 'history-save', name: '对话历史保存', status: 'pending' }
      ]
    },
    {
      id: 'auth',
      name: '用户认证系统',
      icon: Shield,
      color: 'red',
      description: '登录注册、权限控制、安全性检测',
      status: 'idle',
      tests: [
        { id: 'login-flow', name: '登录注册流程', status: 'pending' },
        { id: 'password-security', name: '密码安全性', status: 'pending' },
        { id: 'permission-control', name: '权限控制', status: 'pending' },
        { id: 'session-management', name: '会话管理', status: 'pending' }
      ]
    },
    {
      id: 'database',
      name: '数据库架构',
      icon: Database,
      color: 'yellow',
      description: '数据完整性、查询性能、同步检测',
      status: 'idle',
      tests: [
        { id: 'data-integrity', name: '数据完整性', status: 'pending' },
        { id: 'query-performance', name: '查询性能', status: 'pending' },
        { id: 'backup-recovery', name: '备份恢复', status: 'pending' },
        { id: 'data-sync', name: '数据同步', status: 'pending' }
      ]
    },
    {
      id: 'performance',
      name: '整体性能',
      icon: Zap,
      color: 'pink',
      description: '系统性能、内存使用、错误监控',
      status: 'idle',
      tests: [
        { id: 'memory-usage', name: '内存使用', status: 'pending' },
        { id: 'cpu-usage', name: 'CPU使用率', status: 'pending' },
        { id: 'error-monitoring', name: '错误监控', status: 'pending' },
        { id: 'api-response', name: 'API响应时间', status: 'pending' }
      ]
    }
  ])

  const runModuleTest = async (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, status: 'running' }
        : module
    ))

    // 模拟测试过程
    const module = modules.find(m => m.id === moduleId)
    if (module) {
      for (let i = 0; i < module.tests.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setModules(prev => prev.map(m => 
          m.id === moduleId 
            ? {
                ...m,
                tests: m.tests.map((test, index) => 
                  index === i 
                    ? { 
                        ...test, 
                        status: Math.random() > 0.3 ? 'passed' : 'failed',
                        score: Math.floor(Math.random() * 40) + 60,
                        duration: Math.floor(Math.random() * 2000) + 500
                      }
                    : test
                )
              }
            : m
        ))
      }

      setModules(prev => prev.map(m => 
        m.id === moduleId 
          ? { 
              ...m, 
              status: 'completed',
              overallScore: Math.floor(Math.random() * 30) + 70
            }
          : m
      ))
    }
  }

  const runAllTests = async () => {
    setIsRunningAll(true)
    for (const module of modules) {
      await runModuleTest(module.id)
    }
    setIsRunningAll(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
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
  const passedTests = modules.reduce((acc, m) => acc + m.tests.filter(t => t.status === 'passed').length, 0)
  const failedTests = modules.reduce((acc, m) => acc + m.tests.filter(t => t.status === 'failed').length, 0)
  const averageScore = modules.filter(m => m.overallScore).reduce((acc, m) => acc + (m.overallScore || 0), 0) / Math.max(1, modules.filter(m => m.overallScore).length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <Shield className="w-8 h-8 text-purple-400 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                项目质量检测中心
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/modules" 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                模块配置
              </Link>
              <button
                onClick={runAllTests}
                disabled={isRunningAll}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isRunningAll ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isRunningAll ? '检测中...' : '全面检测'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 总览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{completedModules}/6</div>
                <div className="text-gray-400 text-sm">已完成模块</div>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">{passedTests}</div>
                <div className="text-gray-400 text-sm">通过测试</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
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
                <div className="text-2xl font-bold text-red-400">{failedTests}</div>
                <div className="text-gray-400 text-sm">失败测试</div>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
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
                <div className="text-2xl font-bold text-blue-400">{Math.round(averageScore) || 0}</div>
                <div className="text-gray-400 text-sm">平均分数</div>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>
        </div>

        {/* 模块检测卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((module, index) => {
            const IconComponent = module.icon
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
              >
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <IconComponent className={`w-8 h-8 text-${module.color}-400 mr-3`} />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                        <p className="text-gray-400 text-sm">{module.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      进度: {module.tests.filter(t => t.status === 'passed').length}/{module.tests.length} 测试通过
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/inspect/${module.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        详细检测
                      </Link>
                      <button 
                        onClick={() => runModuleTest(module.id)}
                        disabled={module.status === 'running'}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        快速检测
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${getColorClasses(module.color)} transition-all duration-500`}
                        style={{ 
                          width: `${(module.tests.filter(t => t.status === 'passed').length / module.tests.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    {module.tests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center">
                          {getStatusIcon(test.status)}
                          <div className="ml-3">
                            <div className="text-white text-sm font-medium">{test.name}</div>
                            {test.duration && (
                              <div className="text-gray-400 text-xs">{test.duration}ms</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {test.score && (
                            <span className={`text-sm font-medium ${
                              test.score >= 80 ? 'text-green-400' : 
                              test.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {test.score}分
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 检测指南 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30"
        >
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <FileText className="w-6 h-6 mr-3" />
            检测标准说明
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium text-white mb-4">📊 评分标准</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-green-400">90-100分：</span>
                  <span className="text-gray-300 ml-2">优秀，完全符合标准</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                  <span className="text-yellow-400">80-89分：</span>
                  <span className="text-gray-300 ml-2">良好，基本符合要求</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-400 rounded-full mr-3"></div>
                  <span className="text-orange-400">60-79分：</span>
                  <span className="text-gray-300 ml-2">及格，需要改进</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                  <span className="text-red-400">60分以下：</span>
                  <span className="text-gray-300 ml-2">不合格，需要重做</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-4">🔍 检测重点</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• <strong>性能指标：</strong>页面加载时间、API响应速度</li>
                <li>• <strong>用户体验：</strong>界面流畅度、交互响应</li>
                <li>• <strong>功能完整性：</strong>核心功能是否正常工作</li>
                <li>• <strong>安全性：</strong>用户数据保护、权限控制</li>
                <li>• <strong>兼容性：</strong>不同设备和浏览器支持</li>
                <li>• <strong>稳定性：</strong>错误处理、异常恢复</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-yellow-300 font-medium mb-1">💡 检测建议</div>
                <p className="text-gray-300 text-sm">
                  建议先运行单个模块测试，了解具体问题后再进行全面检测。
                  每次检测都会生成详细报告，帮助开发团队快速定位和解决问题。
                  记住，质量检测的目标是确保项目能够真正帮助用户实现意识觉醒和内在成长。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}