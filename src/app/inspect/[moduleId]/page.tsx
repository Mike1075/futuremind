'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Monitor, 
  TreePine, 
  MessageCircle, 
  Database, 
  Zap,
  Shield,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  FileText,
  Play,
  Eye,
  Settings,
  Users,
  Clock,
  Target,
  Lightbulb,
  BookOpen
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface InspectionCriteria {
  id: string
  title: string
  description: string
  steps: string[]
  testCases: string[]
  expectedResults: string[]
  tools: string[]
  tips: string[]
}

interface ModuleInspection {
  id: string
  name: string
  description: string
  icon: any
  color: string
  previewUrl?: string
  criteria: InspectionCriteria[]
  overview: string
  importance: string
  commonIssues: string[]
}

export default function DetailedInspectionPage() {
  const router = useRouter()
  const params = useParams()
  const moduleId = params.moduleId as string
  
  const [module, setModule] = useState<ModuleInspection | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const moduleData: Record<string, ModuleInspection> = {
    '1': {
      id: '1',
      name: '主应用界面',
      description: '用户界面和交互设计检测',
      icon: Monitor,
      color: 'blue',
      overview: '主应用界面是用户与系统交互的第一接触点，需要确保界面美观、易用、响应式，并符合现代UI/UX设计标准。',
      importance: '界面质量直接影响用户体验和产品印象，是项目成功的关键因素之一。',
      commonIssues: [
        '响应式设计不完善，在不同设备上显示异常',
        '颜色搭配不协调，缺乏视觉层次',
        '交互反馈不明确，用户操作后无明显响应',
        '加载状态处理不当，用户体验差',
        '无障碍性设计缺失'
      ],
      criteria: [
        {
          id: 'ui-visual',
          title: '视觉设计检测',
          description: '检查界面的视觉效果、颜色搭配、字体选择等',
          steps: [
            '打开预览链接，观察整体视觉效果',
            '检查颜色搭配是否协调统一',
            '验证字体大小和层次是否清晰',
            '确认图标和按钮设计是否一致',
            '检查间距和布局是否合理'
          ],
          testCases: [
            '在不同浏览器中打开页面',
            '调整浏览器窗口大小测试响应式',
            '检查深色/浅色主题切换（如有）',
            '测试高对比度显示效果'
          ],
          expectedResults: [
            '界面美观，符合现代设计趋势',
            '颜色搭配协调，有明确的视觉层次',
            '字体清晰易读，大小适中',
            '图标风格统一，含义明确',
            '布局合理，信息组织有序'
          ],
          tools: ['浏览器开发者工具', '颜色对比度检测工具', '屏幕截图工具'],
          tips: [
            '注意检查品牌色彩的一致性',
            '确认重要信息是否突出显示',
            '验证按钮和链接的视觉状态'
          ]
        },
        {
          id: 'ui-responsive',
          title: '响应式设计检测',
          description: '测试界面在不同设备和屏幕尺寸下的表现',
          steps: [
            '使用浏览器开发者工具切换设备模式',
            '测试手机端（375px宽度）显示效果',
            '测试平板端（768px宽度）显示效果',
            '测试桌面端（1200px+宽度）显示效果',
            '检查横屏和竖屏模式'
          ],
          testCases: [
            'iPhone SE (375x667)',
            'iPad (768x1024)', 
            'Desktop (1920x1080)',
            '超宽屏 (2560x1440)'
          ],
          expectedResults: [
            '所有设备上内容都能正常显示',
            '文字大小在移动端仍然清晰可读',
            '按钮和链接在触屏设备上易于点击',
            '图片和媒体内容自适应屏幕',
            '导航菜单在小屏幕上有合适的处理'
          ],
          tools: ['Chrome DevTools', 'Firefox响应式设计模式', 'BrowserStack'],
          tips: [
            '特别注意断点处的布局变化',
            '检查触摸目标是否足够大（至少44px）',
            '确认滚动行为是否正常'
          ]
        },
        {
          id: 'ui-interaction',
          title: '交互体验检测',
          description: '测试用户交互的流畅性和反馈机制',
          steps: [
            '点击所有可交互元素（按钮、链接等）',
            '测试表单输入和验证',
            '检查加载状态和错误提示',
            '验证动画和过渡效果',
            '测试键盘导航功能'
          ],
          testCases: [
            '点击主要操作按钮',
            '填写并提交表单',
            '触发错误状态',
            '测试搜索功能',
            '使用Tab键导航'
          ],
          expectedResults: [
            '所有交互都有明确的视觉反馈',
            '加载状态有适当的指示器',
            '错误信息清晰且有帮助',
            '动画流畅不卡顿',
            '键盘导航完整可用'
          ],
          tools: ['浏览器开发者工具', '性能监控工具', '无障碍检测工具'],
          tips: [
            '注意微交互的细节处理',
            '确认异步操作的用户反馈',
            '检查防重复提交机制'
          ]
        }
      ]
    },
    '2': {
      id: '2',
      name: '意识进化树',
      description: '意识发展可视化系统检测',
      icon: TreePine,
      color: 'green',
      overview: '意识进化树是展示用户成长历程的核心可视化组件，需要确保数据准确、交互流畅、视觉效果佳。',
      importance: '作为项目的核心概念展示，直接体现了产品的价值主张和用户成长体验。',
      commonIssues: [
        '数据可视化不够直观',
        '交互操作复杂难懂',
        '性能问题导致卡顿',
        '数据更新不及时',
        '移动端体验差'
      ],
      criteria: [
        {
          id: 'tree-visualization',
          title: '可视化效果检测',
          description: '检查意识进化树的视觉呈现和数据展示',
          steps: [
            '观察树形结构的整体布局',
            '检查节点和连线的视觉效果',
            '验证数据标签的清晰度',
            '测试缩放和平移功能',
            '检查颜色编码的含义'
          ],
          testCases: [
            '查看完整的进化树结构',
            '点击不同的节点查看详情',
            '使用缩放功能查看细节',
            '测试搜索和筛选功能'
          ],
          expectedResults: [
            '树形结构清晰易懂',
            '节点信息完整准确',
            '视觉层次分明',
            '交互响应及时',
            '数据更新实时'
          ],
          tools: ['浏览器开发者工具', '性能分析工具', '数据验证工具'],
          tips: [
            '注意检查大数据量时的性能',
            '验证数据的准确性和完整性',
            '确认视觉编码的一致性'
          ]
        },
        {
          id: 'tree-interaction',
          title: '交互功能检测',
          description: '测试用户与进化树的交互操作',
          steps: [
            '测试节点点击和悬停效果',
            '验证拖拽和缩放操作',
            '检查筛选和搜索功能',
            '测试数据导出功能',
            '验证个性化设置'
          ],
          testCases: [
            '点击叶子节点查看详情',
            '拖拽移动视图区域',
            '使用滚轮缩放',
            '搜索特定的进化路径',
            '导出进化数据'
          ],
          expectedResults: [
            '所有交互操作流畅',
            '节点详情信息完整',
            '缩放范围合理',
            '搜索结果准确',
            '导出数据格式正确'
          ],
          tools: ['交互测试工具', '数据验证工具', '性能监控'],
          tips: [
            '测试边界情况的处理',
            '验证数据一致性',
            '检查错误处理机制'
          ]
        }
      ]
    },
    '3': {
      id: '3',
      name: 'Gaia AI对话',
      description: 'AI智能对话系统检测',
      icon: MessageCircle,
      color: 'purple',
      overview: 'Gaia AI对话系统是用户与AI交互的核心功能，需要确保对话质量、响应速度和用户体验。',
      importance: 'AI对话质量直接影响用户对产品智能化水平的认知，是核心竞争力之一。',
      commonIssues: [
        'AI回复质量不稳定',
        '响应时间过长',
        '对话上下文理解错误',
        '界面交互不够友好',
        '错误处理不完善'
      ],
      criteria: [
        {
          id: 'ai-intelligence',
          title: 'AI智能水平检测',
          description: '测试AI的理解能力和回复质量',
          steps: [
            '发送简单问候语测试基础交互',
            '提出复杂问题测试理解能力',
            '进行多轮对话测试上下文记忆',
            '测试专业领域问题的回答',
            '验证错误输入的处理'
          ],
          testCases: [
            '你好，请介绍一下自己',
            '我想了解意识进化的概念，能详细解释吗？',
            '刚才你提到的第二点能再详细说明吗？',
            '请帮我制定一个30天的学习计划',
            '发送无意义字符串测试'
          ],
          expectedResults: [
            '基础交互自然流畅',
            '复杂问题理解准确',
            '上下文记忆完整',
            '专业回答有深度',
            '错误处理得当'
          ],
          tools: ['对话测试脚本', '响应时间监控', '内容质量评估'],
          tips: [
            '准备多样化的测试问题',
            '注意测试边界情况',
            '记录异常回复进行分析'
          ]
        },
        {
          id: 'ai-performance',
          title: '性能和稳定性检测',
          description: '测试AI系统的响应速度和稳定性',
          steps: [
            '测试正常负载下的响应时间',
            '进行连续对话测试系统稳定性',
            '测试并发用户场景',
            '验证长时间会话的表现',
            '检查错误恢复机制'
          ],
          testCases: [
            '发送10条连续消息',
            '进行30分钟持续对话',
            '模拟网络中断情况',
            '测试超长文本输入',
            '同时开启多个对话窗口'
          ],
          expectedResults: [
            '响应时间在3秒内',
            '长时间对话稳定',
            '并发处理正常',
            '错误恢复及时',
            '资源使用合理'
          ],
          tools: ['性能监控工具', '压力测试工具', '网络模拟器'],
          tips: [
            '记录详细的性能数据',
            '注意观察内存使用情况',
            '测试不同网络条件下的表现'
          ]
        }
      ]
    },
    '4': {
      id: '4',
      name: '用户认证系统',
      description: '登录注册和权限管理检测',
      icon: Shield,
      color: 'red',
      overview: '用户认证系统负责用户身份验证和权限管理，需要确保安全性、易用性和功能完整性。',
      importance: '认证系统是应用安全的第一道防线，直接关系到用户数据安全和系统稳定性。',
      commonIssues: [
        '密码安全策略不完善',
        '登录流程复杂',
        '权限控制不准确',
        '会话管理有漏洞',
        '错误提示不明确'
      ],
      criteria: [
        {
          id: 'auth-security',
          title: '安全性检测',
          description: '测试认证系统的安全机制',
          steps: [
            '测试密码强度要求',
            '验证登录失败处理',
            '检查会话超时机制',
            '测试权限边界',
            '验证数据传输加密'
          ],
          testCases: [
            '使用弱密码尝试注册',
            '连续输入错误密码',
            '长时间不操作测试会话',
            '尝试访问无权限页面',
            '检查HTTPS加密'
          ],
          expectedResults: [
            '密码策略严格执行',
            '登录失败有限制',
            '会话管理安全',
            '权限控制准确',
            '数据传输加密'
          ],
          tools: ['安全扫描工具', '网络抓包工具', '渗透测试工具'],
          tips: [
            '重点关注常见安全漏洞',
            '测试各种攻击场景',
            '验证敏感信息保护'
          ]
        },
        {
          id: 'auth-usability',
          title: '易用性检测',
          description: '测试认证流程的用户体验',
          steps: [
            '测试注册流程的便捷性',
            '验证登录过程的流畅性',
            '检查密码重置功能',
            '测试第三方登录集成',
            '验证用户信息管理'
          ],
          testCases: [
            '完整的用户注册流程',
            '使用邮箱和用户名登录',
            '忘记密码重置流程',
            '使用Google/GitHub登录',
            '修改个人信息'
          ],
          expectedResults: [
            '注册流程简单明了',
            '登录快速便捷',
            '密码重置安全可靠',
            '第三方登录正常',
            '信息管理完善'
          ],
          tools: ['用户体验测试工具', '表单验证工具', '邮件测试工具'],
          tips: [
            '从用户角度评估流程',
            '注意错误提示的友好性',
            '验证邮件通知功能'
          ]
        }
      ]
    },
    '5': {
      id: '5',
      name: '数据库架构',
      description: '数据存储和管理系统检测',
      icon: Database,
      color: 'yellow',
      overview: '数据库架构是应用的数据基础，需要确保数据完整性、查询性能和扩展性。',
      importance: '数据库设计质量直接影响应用性能、数据安全和未来扩展能力。',
      commonIssues: [
        '数据模型设计不合理',
        '查询性能差',
        '数据一致性问题',
        '备份恢复机制缺失',
        '安全策略不完善'
      ],
      criteria: [
        {
          id: 'db-design',
          title: '数据模型检测',
          description: '检查数据库设计的合理性',
          steps: [
            '审查数据表结构设计',
            '检查字段类型和约束',
            '验证表关系和外键',
            '检查索引设计',
            '评估数据冗余情况'
          ],
          testCases: [
            '查看所有数据表结构',
            '检查主键和外键关系',
            '验证数据类型选择',
            '测试约束条件',
            '分析查询执行计划'
          ],
          expectedResults: [
            '表结构设计合理',
            '字段类型恰当',
            '关系定义正确',
            '索引配置优化',
            '数据冗余最小'
          ],
          tools: ['数据库管理工具', 'ER图工具', '性能分析工具'],
          tips: [
            '关注数据规范化程度',
            '检查业务逻辑的数据支持',
            '评估未来扩展的灵活性'
          ]
        },
        {
          id: 'db-performance',
          title: '性能和安全检测',
          description: '测试数据库的性能和安全性',
          steps: [
            '测试常用查询的性能',
            '检查数据访问权限',
            '验证备份恢复机制',
            '测试并发访问处理',
            '检查数据加密情况'
          ],
          testCases: [
            '执行复杂查询测试',
            '模拟高并发访问',
            '测试数据备份功能',
            '验证权限控制',
            '检查敏感数据加密'
          ],
          expectedResults: [
            '查询响应快速',
            '并发处理稳定',
            '备份机制完善',
            '权限控制严格',
            '敏感数据加密'
          ],
          tools: ['数据库性能监控', '压力测试工具', '安全审计工具'],
          tips: [
            '重点测试核心业务查询',
            '关注数据安全合规性',
            '验证灾难恢复能力'
          ]
        }
      ]
    },
    '6': {
      id: '6',
      name: '整体性能',
      description: '系统性能和优化检测',
      icon: Zap,
      color: 'pink',
      overview: '整体性能检测涵盖前端加载速度、后端响应时间、资源使用效率等全方位性能指标。',
      importance: '性能直接影响用户体验和系统可用性，是产品成功的关键技术指标。',
      commonIssues: [
        '页面加载速度慢',
        '资源文件过大',
        '内存泄漏问题',
        '网络请求过多',
        '缓存策略不当'
      ],
      criteria: [
        {
          id: 'perf-frontend',
          title: '前端性能检测',
          description: '测试前端加载速度和运行性能',
          steps: [
            '测试首屏加载时间',
            '检查资源文件大小',
            '验证缓存策略',
            '测试交互响应速度',
            '检查内存使用情况'
          ],
          testCases: [
            '清除缓存后首次访问',
            '刷新页面测试缓存',
            '长时间使用测试内存',
            '网络限速测试',
            '移动设备性能测试'
          ],
          expectedResults: [
            '首屏加载<3秒',
            '资源文件合理压缩',
            '缓存策略有效',
            '交互响应<100ms',
            '内存使用稳定'
          ],
          tools: ['Chrome DevTools', 'Lighthouse', 'WebPageTest'],
          tips: [
            '关注Core Web Vitals指标',
            '测试不同网络条件',
            '监控长期运行稳定性'
          ]
        },
        {
          id: 'perf-backend',
          title: '后端性能检测',
          description: '测试API响应时间和服务器性能',
          steps: [
            '测试API响应时间',
            '检查数据库查询性能',
            '验证并发处理能力',
            '测试错误处理性能',
            '检查资源使用效率'
          ],
          testCases: [
            '单个API请求测试',
            '批量数据处理测试',
            '高并发压力测试',
            '异常情况处理测试',
            '长时间运行稳定性测试'
          ],
          expectedResults: [
            'API响应<500ms',
            '数据库查询优化',
            '并发处理稳定',
            '错误处理及时',
            '资源使用合理'
          ],
          tools: ['性能监控工具', '压力测试工具', '数据库分析工具'],
          tips: [
            '重点关注核心业务API',
            '测试极限负载情况',
            '监控系统资源使用'
          ]
        }
      ]
    }
  }

  useEffect(() => {
    const moduleData = getModuleData(moduleId)
    setModule(moduleData)
  }, [moduleId])

  const getModuleData = (id: string): ModuleInspection | null => {
    return moduleData[id] || null
  }

  const toggleCheck = (itemId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId)
    } else {
      newChecked.add(itemId)
    }
    setCheckedItems(newChecked)
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">模块未找到</div>
      </div>
    )
  }

  const IconComponent = module.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/inspection')}
                className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <IconComponent className={`w-8 h-8 text-${module.color}-400 mr-3`} />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {module.name} - 详细检测
                </h1>
                <p className="text-gray-400 text-sm">{module.description}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签导航 */}
        <div className="flex space-x-1 mb-8 bg-white/5 p-1 rounded-lg">
          {[
            { id: 'overview', label: '概览', icon: Eye },
            { id: 'criteria', label: '检测标准', icon: Target },
            { id: 'guide', label: '操作指南', icon: BookOpen }
          ].map((tab) => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <TabIcon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 概览标签 */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 模块重要性 */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
                为什么要检测这个模块？
              </h2>
              <p className="text-gray-300 leading-relaxed">{module.importance}</p>
            </div>

            {/* 检测概述 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">📋 检测概述</h2>
              <p className="text-gray-300 leading-relaxed mb-6">{module.overview}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">🎯 检测重点</h3>
                  <ul className="space-y-2 text-gray-300">
                    {module.criteria.map((criteria, index) => (
                      <li key={criteria.id} className="flex items-start">
                        <span className="text-purple-400 mr-2">{index + 1}.</span>
                        <span>{criteria.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">⚠️ 常见问题</h3>
                  <ul className="space-y-2 text-gray-300">
                    {module.commonIssues.slice(0, 3).map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 预览链接状态 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">🔗 预览链接状态</h2>
              {module.previewUrl ? (
                <div className="flex items-center justify-between p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <div>
                      <p className="text-green-300 font-medium">预览链接已配置</p>
                      <p className="text-gray-400 text-sm">{module.previewUrl}</p>
                    </div>
                  </div>
                  <a
                    href={module.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    打开预览
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
                    <p className="text-yellow-300 font-medium">预览链接未配置</p>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    虽然没有预览链接，但你仍然可以学习检测标准和操作方法。配置预览链接后，就可以进行实际检测了。
                  </p>
                  <button
                    onClick={() => router.push('/modules')}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    去配置预览链接
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 检测标准标签 */}
        {activeTab === 'criteria' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {module.criteria.map((criteria, index) => (
              <div key={criteria.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    {criteria.title}
                  </h3>
                  <button
                    onClick={() => toggleCheck(criteria.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      checkedItems.has(criteria.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-gray-300 mb-6">{criteria.description}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 检测步骤 */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                      <Play className="w-5 h-5 mr-2 text-blue-400" />
                      检测步骤
                    </h4>
                    <ol className="space-y-2">
                      {criteria.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start text-gray-300">
                          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                            {stepIndex + 1}
                          </span>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* 测试用例 */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-green-400" />
                      测试用例
                    </h4>
                    <ul className="space-y-2">
                      {criteria.testCases.map((testCase, testIndex) => (
                        <li key={testIndex} className="flex items-start text-gray-300">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                          <span className="text-sm">{testCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 预期结果 */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-purple-400" />
                      预期结果
                    </h4>
                    <ul className="space-y-2">
                      {criteria.expectedResults.map((result, resultIndex) => (
                        <li key={resultIndex} className="flex items-start text-gray-300">
                          <CheckCircle className="w-4 h-4 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 工具和提示 */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-yellow-400" />
                      推荐工具
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">工具：</p>
                        <div className="flex flex-wrap gap-2">
                          {criteria.tools.map((tool, toolIndex) => (
                            <span key={toolIndex} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-2">提示：</p>
                        <ul className="space-y-1">
                          {criteria.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-xs text-gray-300 flex items-start">
                              <span className="text-yellow-400 mr-2">💡</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* 操作指南标签 */}
        {activeTab === 'guide' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 检测流程 */}
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-green-400" />
                完整检测流程
              </h2>
              
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: '准备阶段',
                    description: '配置预览链接，准备检测工具',
                    actions: ['在模块配置页面输入预览链接', '准备浏览器开发者工具', '清理浏览器缓存']
                  },
                  {
                    step: 2,
                    title: '执行检测',
                    description: '按照检测标准逐项进行测试',
                    actions: ['打开预览链接', '按照检测步骤操作', '记录发现的问题']
                  },
                  {
                    step: 3,
                    title: '结果评估',
                    description: '对比预期结果，给出评估结论',
                    actions: ['对比实际结果与预期', '评估问题严重程度', '提出改进建议']
                  },
                  {
                    step: 4,
                    title: '报告输出',
                    description: '整理检测结果，形成检测报告',
                    actions: ['汇总所有检测项目', '分类整理问题清单', '提供具体改进方案']
                  }
                ].map((phase) => (
                  <div key={phase.step} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {phase.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white mb-2">{phase.title}</h3>
                      <p className="text-gray-300 text-sm mb-3">{phase.description}</p>
                      <ul className="space-y-1">
                        {phase.actions.map((action, actionIndex) => (
                          <li key={actionIndex} className="text-sm text-gray-400 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 检测技巧 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
                检测技巧和注意事项
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">✅ 最佳实践</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• 使用多种浏览器进行测试</li>
                    <li>• 模拟不同的网络条件</li>
                    <li>• 记录详细的测试步骤和结果</li>
                    <li>• 关注用户体验的细节</li>
                    <li>• 测试边界情况和异常场景</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">⚠️ 常见误区</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• 只在理想环境下测试</li>
                    <li>• 忽略移动端体验</li>
                    <li>• 不记录具体的问题细节</li>
                    <li>• 只关注功能忽略性能</li>
                    <li>• 缺乏系统性的测试方法</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 问题分类和处理 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">🔍 问题分类和处理建议</h2>
              
              <div className="space-y-4">
                {[
                  {
                    level: '严重',
                    color: 'red',
                    description: '影响核心功能或用户无法正常使用',
                    examples: ['页面无法加载', '核心功能失效', '数据丢失'],
                    action: '立即修复，阻止发布'
                  },
                  {
                    level: '重要',
                    color: 'yellow',
                    description: '影响用户体验但不阻止基本使用',
                    examples: ['响应速度慢', '界面显示异常', '部分功能缺失'],
                    action: '优先修复，建议发布前解决'
                  },
                  {
                    level: '一般',
                    color: 'blue',
                    description: '小的改进点，不影响主要功能',
                    examples: ['文字错误', '样式细节', '交互优化'],
                    action: '后续版本修复'
                  }
                ].map((category) => (
                  <div key={category.level} className={`p-4 border rounded-lg bg-${category.color}-500/10 border-${category.color}-500/30`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-medium text-${category.color}-300`}>{category.level}问题</h3>
                      <span className={`px-2 py-1 bg-${category.color}-500/20 text-${category.color}-300 rounded text-xs`}>
                        {category.action}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{category.description}</p>
                    <p className="text-gray-400 text-xs">
                      示例：{category.examples.join('、')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 底部操作栏 */}
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            检测进度：{checkedItems.size} / {module.criteria.length} 项已完成
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/modules')}
              className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
            >
              配置预览链接
            </button>
            
            <button
              onClick={() => {
                // 这里可以添加保存检测结果的逻辑
                alert('检测结果已保存！')
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              保存检测结果
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}