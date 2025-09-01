'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Clock,
  Users,
  Shield,
  Zap
} from 'lucide-react'

export default function GuidePage() {
  const router = useRouter()

  const guideSteps = [
    {
      step: 1,
      title: "了解检测目标",
      description: "明确每个模块的检测标准和期望结果",
      icon: Target,
      details: [
        "主应用界面：页面加载<3秒，响应式适配，动画流畅",
        "意识进化树：数据准确性100%，响应时间<100ms",
        "盖亚AI对话：响应时间<2秒，准确率>85%",
        "用户认证：登录成功率100%，权限控制准确",
        "数据库架构：数据完整性100%，查询速度<500ms",
        "整体性能：内存使用<500MB，CPU使用<80%"
      ]
    },
    {
      step: 2,
      title: "选择检测方式",
      description: "根据需要选择单模块检测或全面检测",
      icon: CheckCircle,
      details: [
        "单模块检测：针对特定功能进行深度测试",
        "全面检测：一次性检测所有六个模块",
        "自定义检测：选择多个模块组合检测",
        "快速检测：仅检测核心功能指标"
      ]
    },
    {
      step: 3,
      title: "执行检测流程",
      description: "按照标准流程执行自动化检测",
      icon: Clock,
      details: [
        "点击'开始检测'按钮启动测试",
        "等待自动化测试完成（通常1-3分钟）",
        "观察实时测试进度和状态更新",
        "检测完成后查看详细结果报告"
      ]
    },
    {
      step: 4,
      title: "分析检测结果",
      description: "理解检测报告并制定改进计划",
      icon: BookOpen,
      details: [
        "查看每个测试项的具体分数和状态",
        "重点关注失败和警告项目",
        "阅读系统提供的改进建议",
        "记录需要开发团队修复的问题"
      ]
    }
  ]

  const qualityStandards = [
    {
      category: "性能标准",
      icon: Zap,
      color: "yellow",
      standards: [
        "页面首次加载时间 ≤ 3秒",
        "API响应时间 ≤ 500ms",
        "动画帧率 ≥ 60FPS",
        "内存使用 ≤ 500MB"
      ]
    },
    {
      category: "功能标准",
      icon: CheckCircle,
      color: "green",
      standards: [
        "核心功能正常率 = 100%",
        "用户操作成功率 ≥ 99%",
        "数据准确性 = 100%",
        "错误恢复能力 ≥ 95%"
      ]
    },
    {
      category: "安全标准",
      icon: Shield,
      color: "red",
      standards: [
        "用户数据加密传输",
        "权限控制准确性 = 100%",
        "密码安全策略合规",
        "会话管理安全可靠"
      ]
    },
    {
      category: "体验标准",
      icon: Users,
      color: "blue",
      standards: [
        "界面响应时间 ≤ 100ms",
        "操作流程直观易懂",
        "错误提示清晰明确",
        "多设备兼容性良好"
      ]
    }
  ]

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
              <BookOpen className="w-8 h-8 text-purple-400 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                项目检测指南
              </h1>
            </div>
            <button
              onClick={() => router.push('/inspection')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              开始检测
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 介绍部分 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            项目质量检测完整指南
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            专为质量把关专员设计的详细操作手册
          </p>
        </motion.div>

        {/* 检测流程步骤 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-semibold text-white mb-8 text-center">
            🚀 检测流程四步骤
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guideSteps.map((step, index) => {
              const IconComponent = step.icon
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {step.step}
                    </div>
                    <IconComponent className="w-6 h-6 text-purple-400 mr-3" />
                    <h4 className="text-lg font-semibold text-white">{step.title}</h4>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  
                  <ul className="space-y-2">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* 质量标准 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-semibold text-white mb-8 text-center">
            📊 质量标准详解
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {qualityStandards.map((category, index) => {
              const IconComponent = category.icon
              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center mb-4">
                    <IconComponent className={`w-6 h-6 text-${category.color}-400 mr-3`} />
                    <h4 className="text-lg font-semibold text-white">{category.category}</h4>
                  </div>
                  
                  <ul className="space-y-3">
                    {category.standards.map((standard, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <div className={`w-2 h-2 bg-${category.color}-400 rounded-full mr-3 flex-shrink-0`}></div>
                        <span className="text-gray-300">{standard}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* 常见问题和解决方案 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-semibold text-white mb-8 text-center">
            ❓ 常见问题与解决方案
          </h3>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
                  常见问题
                </h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>• <strong>检测失败：</strong>网络连接问题或服务器响应超时</li>
                  <li>• <strong>分数偏低：</strong>性能优化不足或功能实现不完整</li>
                  <li>• <strong>测试卡住：</strong>某个模块存在死循环或阻塞问题</li>
                  <li>• <strong>结果不准确：</strong>测试环境与生产环境差异较大</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 text-yellow-400 mr-2" />
                  解决建议
                </h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>• <strong>重新检测：</strong>等待网络稳定后重新运行测试</li>
                  <li>• <strong>分模块检测：</strong>先检测单个模块定位具体问题</li>
                  <li>• <strong>查看日志：</strong>检查浏览器控制台的错误信息</li>
                  <li>• <strong>联系开发：</strong>将检测报告发送给开发团队</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 操作提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30"
        >
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">
            💡 专业提示
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h4 className="text-white font-medium mb-2">最佳检测时间</h4>
              <p className="text-gray-300 text-sm">
                建议在系统负载较低的时间段进行检测，
                通常是上午10点前或下午6点后
              </p>
            </div>
            
            <div className="p-4">
              <Users className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h4 className="text-white font-medium mb-2">团队协作</h4>
              <p className="text-gray-300 text-sm">
                检测结果应及时分享给开发团队，
                建议建立检测报告的标准化流程
              </p>
            </div>
            
            <div className="p-4">
              <Target className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h4 className="text-white font-medium mb-2">持续改进</h4>
              <p className="text-gray-300 text-sm">
                定期检测并跟踪改进进度，
                确保项目质量持续提升
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/inspection')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg"
            >
              🚀 开始项目检测
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}