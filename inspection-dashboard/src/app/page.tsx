'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  BarChart3, 
  Settings,
  Eye,
  Play,
  FileText,
  Database,
  Smartphone,
  Brain,
  TreePine
} from 'lucide-react'

// 六大功能分支配置
const FEATURE_BRANCHES = [
  {
    id: 'gaia-ai-integration',
    name: 'Gaia AI集成',
    description: '集成真实AI API，实现智能对话和推荐',
    icon: Brain,
    color: 'purple' as const,
    priority: 'high' as const,
    estimatedTime: '2-3周',
    status: 'not_started' as const,
    keyFeatures: ['AI对话接口', '智能推荐算法', '个性化响应', '对话历史管理'],
    testPoints: [
      'AI API响应时间 < 2秒',
      '对话准确率 > 85%',
      '个性化推荐相关性 > 80%',
      '并发用户支持 > 100'
    ]
  },
  {
    id: 'consciousness-tree-enhancement',
    name: '意识进化树增强',
    description: '增强意识进化树的交互性和可视化效果',
    icon: TreePine,
    color: 'green' as const,
    priority: 'high' as const,
    estimatedTime: '1-2周',
    status: 'in_progress' as const,
    keyFeatures: ['3D可视化', '动态动画', '成就系统', '进度追踪'],
    testPoints: [
      '动画流畅度 60FPS',
      '交互响应时间 < 100ms',
      '成就触发准确性 100%',
      '数据同步实时性'
    ]
  },
  {
    id: 'pbl-collaboration-system',
    name: 'PBL协作系统',
    description: '完善项目制学习协作功能',
    icon: Users,
    color: 'blue' as const,
    priority: 'medium' as const,
    estimatedTime: '2-3周',
    status: 'in_progress' as const,
    keyFeatures: ['实时协作', '项目管理', '任务分配', '进度跟踪'],
    testPoints: [
      '实时同步延迟 < 500ms',
      '文件上传成功率 > 99%',
      '协作冲突处理机制',
      '权限控制准确性'
    ]
  },
  {
    id: 'content-management',
    name: '内容管理系统',
    description: '开发内容管理和动态推送系统',
    icon: FileText,
    color: 'orange' as const,
    priority: 'medium' as const,
    estimatedTime: '2周',
    status: 'in_progress' as const,
    keyFeatures: ['内容编辑器', '版本控制', '发布流程', '内容推荐'],
    testPoints: [
      '内容发布成功率 100%',
      '版本回滚功能正常',
      '内容搜索准确性 > 90%',
      '推送到达率 > 95%'
    ]
  },
  {
    id: 'mobile-optimization',
    name: '移动端优化',
    description: '移动端适配和专属功能开发',
    icon: Smartphone,
    color: 'pink' as const,
    priority: 'low' as const,
    estimatedTime: '1-2周',
    status: 'not_started' as const,
    keyFeatures: ['响应式设计', '触摸优化', '离线功能', '推送通知'],
    testPoints: [
      '移动端加载时间 < 3秒',
      '触摸响应准确性 100%',
      '离线功能可用性',
      '推送通知到达率 > 90%'
    ]
  },
  {
    id: 'analytics-dashboard',
    name: '数据分析仪表板',
    description: '用户行为分析和学习效果统计',
    icon: BarChart3,
    color: 'indigo' as const,
    priority: 'low' as const,
    estimatedTime: '2-3周',
    status: 'completed' as const,
    keyFeatures: ['数据可视化', '实时统计', '报表生成', '预警系统'],
    testPoints: [
      '数据准确性 100%',
      '图表渲染性能',
      '报表导出功能',
      '实时数据更新 < 5秒'
    ]
  }
]

export default function InspectionDashboard() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  const getStatusStats = () => {
    const total = FEATURE_BRANCHES.length
    const completed = FEATURE_BRANCHES.filter(b => b.status === 'completed').length
    const inProgress = FEATURE_BRANCHES.filter(b => b.status === 'in_progress').length
    const notStarted = FEATURE_BRANCHES.filter(b => b.status === 'not_started').length
    
    return { total, completed, inProgress, notStarted }
  }

  const stats = getStatusStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">未来心灵学院</h1>
                <p className="text-purple-300 text-sm">项目检验管理系统</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">检验员：陶子</p>
                <p className="text-purple-300 text-sm">质量把关专员</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">总分支数</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">已完成</p>
                <p className="text-3xl font-bold text-white">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm">进行中</p>
                <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">待开始</p>
                <p className="text-3xl font-bold text-white">{stats.notStarted}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Branches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {FEATURE_BRANCHES.map((branch, index) => {
            const IconComponent = branch.icon
            
            const colorClasses: Record<string, string> = {
              purple: 'from-purple-500 to-purple-600 border-purple-500/30',
              green: 'from-green-500 to-green-600 border-green-500/30',
              blue: 'from-blue-500 to-blue-600 border-blue-500/30',
              orange: 'from-orange-500 to-orange-600 border-orange-500/30',
              pink: 'from-pink-500 to-pink-600 border-pink-500/30',
              indigo: 'from-indigo-500 to-indigo-600 border-indigo-500/30'
            }

            const statusColors: Record<string, string> = {
              'not_started': 'bg-red-500/20 text-red-300',
              'in_progress': 'bg-yellow-500/20 text-yellow-300',
              'completed': 'bg-green-500/20 text-green-300',
              'failed': 'bg-red-500/20 text-red-300'
            }

            const statusText: Record<string, string> = {
              'not_started': '待开始',
              'in_progress': '进行中',
              'completed': '已完成',
              'failed': '失败'
            }

            return (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300"
              >
                {/* Branch Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[branch.color]} rounded-lg flex items-center justify-center border`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{branch.name}</h3>
                      <p className="text-gray-300 text-sm">{branch.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      branch.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                      branch.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {branch.priority === 'high' ? '高优先级' : 
                       branch.priority === 'medium' ? '中优先级' : '低优先级'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[branch.status]}`}>
                      {statusText[branch.status]}
                    </span>
                  </div>
                </div>

                {/* Key Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-purple-300 mb-2">核心功能</h4>
                  <div className="flex flex-wrap gap-2">
                    {branch.keyFeatures.map((feature, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white/10 rounded-md text-xs text-gray-300">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Test Points */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-purple-300 mb-2">检验要点</h4>
                  <ul className="space-y-1">
                    {branch.testPoints.slice(0, 2).map((point, idx) => (
                      <li key={idx} className="text-xs text-gray-400 flex items-center">
                        <div className="w-1 h-1 bg-purple-400 rounded-full mr-2"></div>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    预计时间: {branch.estimatedTime}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-md text-sm hover:bg-blue-500/30 transition-colors flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>预览</span>
                    </button>
                    <button 
                      onClick={() => window.location.href = `/inspection/${branch.id}`}
                      className="px-3 py-1 bg-green-500/20 text-green-300 rounded-md text-sm hover:bg-green-500/30 transition-colors flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>检验</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/setup'}
              className="p-4 bg-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors text-left"
            >
              <Database className="w-6 h-6 mb-2" />
              <div className="font-medium">初始化数据库</div>
              <div className="text-sm opacity-75">设置Supabase数据表</div>
            </button>
            <button className="p-4 bg-blue-500/20 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-left">
              <FileText className="w-6 h-6 mb-2" />
              <div className="font-medium">生成检验报告</div>
              <div className="text-sm opacity-75">导出详细检验结果</div>
            </button>
            <button className="p-4 bg-green-500/20 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors text-left">
              <BarChart3 className="w-6 h-6 mb-2" />
              <div className="font-medium">查看统计数据</div>
              <div className="text-sm opacity-75">分析项目整体质量</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}