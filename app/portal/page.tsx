'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  TreePine,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  LogOut,
  Play,
  CheckCircle,
  Calendar,
  Lightbulb,
  Star,
  Leaf,
  BookOpen,
  Plus,
  Settings,
  Ear,
  Globe,
  Rocket
} from 'lucide-react'
import GaiaDialog from '@/components/GaiaDialog'
import { DatabaseConsciousnessRoots } from '@/components/ui/database-consciousness-roots'

interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
  }
}

interface UserProgress {
  id: string
  user_id: string
  season_id: string
  current_day: number
  completed_tasks: string[]
  consciousness_growth: number
  created_at: string
  updated_at: string
}

interface Course {
  id: string
  title: string
  description: string | null
  system_key: string
  is_active: boolean
}

interface EnrolledCourse {
  course_id: string
  course_title: string
  assigned_at: string
}

interface CourseContent {
  id: string
  system_id: string
  sequence_number: number
  title: string
  subtitle: string
  original_text: string | null
  deep_interpretation: string | null
  meditation_guide: string | null
  life_practice: string | null
  documentary_url: string | null
  pre_watch_guide: string | null
  knowledge_points: any
  socratic_questions: any
  post_reflection: string | null
  week_plan: any
  day_plan: any
  estimated_duration: number
  content_type: string
}

interface TodayTask {
  id: string
  title: string
  duration: string
  completed: boolean
  courseTitle?: string
  courseIcon?: any
}

export default function PortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showGaiaDialog, setShowGaiaDialog] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [consciousnessGrowth, setConsciousnessGrowth] = useState(0)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Course enrollment state
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [courseContents, setCourseContents] = useState<CourseContent[]>([])

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user as User)

        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserRole(profile.role)
        }

        // Load user progress
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (progress && !progressError) {
          setCurrentDay((progress as UserProgress).current_day || 1)
          setCompletedTasks((progress as UserProgress).completed_tasks || [])
          setConsciousnessGrowth((progress as UserProgress).consciousness_growth || 0)
        }

        // Load courses
        await loadCourses(user.id)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const loadCourses = async (userId: string) => {
    try {
      // Load all active courses
      const { data: coursesData, error: coursesError } = await (supabase
        .from('course_systems') as any)
        .select('id, title, description, system_key, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (coursesError) throw coursesError
      setAllCourses(coursesData || [])

      // Load enrolled courses
      const { data: enrolledData, error: enrolledError } = await (supabase
        .from('student_course_assignments') as any)
        .select(`
          assigned_at,
          course_systems (id, title)
        `)
        .eq('student_id', userId)
        .eq('status', 'active')

      if (enrolledError) throw enrolledError

      const enrolled: EnrolledCourse[] = enrolledData?.map((item: any) => ({
        course_id: item.course_systems.id,
        course_title: item.course_systems.title,
        assigned_at: item.assigned_at
      })) || []

      setEnrolledCourses(enrolled)

      // Load course contents for enrolled courses
      if (enrolled.length > 0) {
        const enrolledCourseIds = enrolled.map(c => c.course_id)
        const { data: contentsData, error: contentsError } = await (supabase
          .from('course_contents') as any)
          .select('*')
          .in('system_id', enrolledCourseIds)
          .order('sequence_number', { ascending: true })

        if (contentsError) {
          console.error('加载课程内容失败:', contentsError)
        } else {
          setCourseContents(contentsData || [])
        }
      }
    } catch (error) {
      console.error('加载课程失败:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleTaskComplete = async (taskId: string) => {
    let newCompletedTasks: string[]
    let newGrowth: number

    if (completedTasks.includes(taskId)) {
      // 如果任务已完成，则取消完成
      newCompletedTasks = completedTasks.filter(id => id !== taskId)
      newGrowth = consciousnessGrowth - 10
    } else {
      // 如果任务未完成，则标记为完成
      newCompletedTasks = [...completedTasks, taskId]
      newGrowth = consciousnessGrowth + 10
    }

    setCompletedTasks(newCompletedTasks)
    setConsciousnessGrowth(newGrowth)

    // Update in database
    try {
      const updateData = {
        user_id: user?.id,
        season_id: 'season-1-sound-symphony',
        completed_tasks: newCompletedTasks,
        consciousness_growth: newGrowth,
        current_day: currentDay
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('user_progress')
        .upsert(updateData)
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleEnrollCourse = async (courseId: string) => {
    if (!user) return

    // Check if already enrolled
    if (enrolledCourses.some(c => c.course_id === courseId)) {
      alert('您已经选修了这门课程')
      return
    }

    const confirmed = confirm('确认要选修这门课程吗？')
    if (!confirmed) return

    setEnrolling(true)
    try {
      const { error } = await (supabase
        .from('student_course_assignments') as any)
        .insert({
          student_id: user.id,
          course_system_id: courseId,
          assigned_by: user.id, // Self-enrollment
          status: 'active'
        })

      if (error) throw error

      alert('✅ 选课成功！')
      await loadCourses(user.id)
    } catch (error) {
      console.error('选课失败:', error)
      alert('❌ 选课失败，请重试')
    } finally {
      setEnrolling(false)
    }
  }

  // Helper function to get course icon
  const getCourseIcon = (systemKey: string) => {
    switch (systemKey) {
      case 'listening':
        return Ear
      case 'earth':
        return Globe
      case 'icarus':
      case 'pbl':
        return Rocket
      default:
        return BookOpen
    }
  }

  // Generate today's tasks dynamically based on enrolled courses
  const generateTodayTasks = (): TodayTask[] => {
    const tasks: TodayTask[] = []

    // For each enrolled course, find the content unit for current day
    enrolledCourses.forEach(enrolledCourse => {
      const course = allCourses.find(c => c.id === enrolledCourse.course_id)
      if (!course) return

      // Get contents for this course
      const contents = courseContents.filter(c => c.system_id === enrolledCourse.course_id)

      // For listening courses (14-day structure), use currentDay directly
      // For modular courses, use sequence_number
      let relevantContent: CourseContent | undefined

      if (course.system_key === 'listening') {
        // Day-based progression
        relevantContent = contents.find(c => c.sequence_number === currentDay)
      } else {
        // Use first uncompleted unit (simplified logic)
        relevantContent = contents[0]
      }

      if (relevantContent) {
        const Icon = getCourseIcon(course.system_key)

        // Generate tasks from content
        if (relevantContent.meditation_guide) {
          tasks.push({
            id: `meditation-${relevantContent.id}`,
            title: `冥想：${relevantContent.title}`,
            duration: `${relevantContent.estimated_duration || 20}分钟`,
            completed: completedTasks.includes(`meditation-${relevantContent.id}`),
            courseTitle: course.title,
            courseIcon: Icon
          })
        }

        if (relevantContent.documentary_url) {
          tasks.push({
            id: `documentary-${relevantContent.id}`,
            title: `观看纪录片：${relevantContent.subtitle || relevantContent.title}`,
            duration: '30分钟',
            completed: completedTasks.includes(`documentary-${relevantContent.id}`),
            courseTitle: course.title,
            courseIcon: Icon
          })
        }

        if (relevantContent.life_practice) {
          tasks.push({
            id: `practice-${relevantContent.id}`,
            title: `生活实践：${relevantContent.title}`,
            duration: `${relevantContent.estimated_duration || 25}分钟`,
            completed: completedTasks.includes(`practice-${relevantContent.id}`),
            courseTitle: course.title,
            courseIcon: Icon
          })
        }

        if (relevantContent.post_reflection) {
          tasks.push({
            id: `reflection-${relevantContent.id}`,
            title: `反思记录：${relevantContent.title}`,
            duration: '15分钟',
            completed: completedTasks.includes(`reflection-${relevantContent.id}`),
            courseTitle: course.title,
            courseIcon: Icon
          })
        }
      }
    })

    return tasks
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Current season data
  const currentSeason = {
    title: "第一季：声音的交响",
    subtitle: "探索声音、寂静与实相的奥秘",
    week: Math.floor(currentDay / 7) + 1,
    day: currentDay % 7 || 7
  }

  // Generate today's tasks dynamically
  const todayTasks = generateTodayTasks()

  // Today's main quest
  const todayQuest = {
    title: todayTasks.length > 0
      ? `第${currentDay}天：${enrolledCourses[0]?.course_title || '探索之旅'}`
      : '今日探索',
    description: todayTasks.length > 0
      ? `基于您选修的 ${enrolledCourses.length} 门课程生成的学习任务`
      : '您还没有选修任何课程，请先选择课程开始您的探索之旅',
    tasks: todayTasks
  }

  // Today's meditation
  const todayMeditation = {
    title: "克氏冥想：觉察的艺术",
    description: "不带任何目的地觉察，让意识如镜子般清澈地反映一切。",
    duration: "20分钟",
    guide: "今天我们将练习纯粹的觉察，不试图改变任何东西，只是观察..."
  }

  // PBL Project status
  const pblProject = {
    title: "伊卡洛斯行动：无形的纽带",
    description: "与全球探索者一起研究意识与物质的互动",
    nextAction: "设计声音频率对植物生长影响的实验",
    progress: 35,
    teamMembers: 4
  }

  // Gaia's whisper
  const gaiaWhisper = {
    message: "今天的声音探索让我想起了一个深刻的问题：如果宇宙本身就是一首交响乐，那么寂静是什么？是乐章间的停顿，还是所有声音的源头？",
    relatedLink: "量子场论中的真空涨落",
    type: "深度思考"
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      {/* 顶部导航栏（与仪表盘一致风格） */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 bg-white/5 backdrop-blur-md border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：返回主页 */}
            <button
              onClick={() => (window.location.href = '/')}
              className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
            >
              <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="font-medium">返回主页</span>
            </button>

            {/* 中间：标题与季信息 */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">个人探索基地</h2>
              </div>
              <div className="text-sm text-purple-200 hidden sm:block">{currentSeason.title}</div>
            </div>

            {/* 右侧：快捷入口与登出 */}
            <div className="flex items-center space-x-4">
              {/* 我的课程 */}
              <button
                onClick={() => router.push('/portal/courses')}
                className="flex items-center space-x-2 text-cyan-300 hover:text-cyan-200 transition-colors duration-300 group"
              >
                <span className="font-medium flex items-center gap-2">
                  我的课程
                  {enrolledCourses.length > 0 && (
                    <span className="px-2 py-0.5 bg-cyan-600 rounded-full text-xs">
                      {enrolledCourses.length}
                    </span>
                  )}
                </span>
                <div className="w-8 h-8 bg-cyan-600/20 rounded-full flex items-center justify-center group-hover:bg-cyan-600/40 transition-colors duration-300">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
              </button>

              <button
                onClick={() => (window.location.href = '/alliance')}
                className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
              >
                <span className="font-medium">探索者联盟</span>
                <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors duration-300">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
              </button>

              {/* 管理后台入口 - 仅管理员可见 */}
              {userRole && ['admin', 'principal', 'teacher'].includes(userRole) && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 text-blue-300 hover:text-blue-200 transition-colors duration-300 group"
                >
                  <span className="font-medium">管理后台</span>
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center group-hover:bg-blue-600/40 transition-colors duration-300">
                    <Settings className="w-5 h-5 text-blue-400" />
                  </div>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-300 hover:text-red-200 transition-colors duration-300 group"
              >
                <span className="font-medium">登出</span>
                <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center group-hover:bg-red-600/40 transition-colors duration-300">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Season Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-white/10 p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-2">{currentSeason.title}</h2>
                <p className="text-gray-300 mb-4">{currentSeason.subtitle}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>第 {currentSeason.week} 周</span>
                  <span>•</span>
                  <span>第 {currentDay} 天</span>
                  <span>•</span>
                  <span>Level {Math.floor(currentDay / 7) + 1}</span>
                </div>
              </div>
            </motion.div>

            {/* Explorer Alliance - Three Modules */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/20"
            >
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-purple-400 mr-3" />
                <div>
                  <h3 className="text-2xl font-bold text-white">探索者联盟</h3>
                  <p className="text-sm text-gray-300">选择你的探索方向，开启意识觉醒之旅</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Module 1: Listening - 聆听之道 */}
                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all group">
                  <div className="w-12 h-12 bg-purple-600/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Ear className="w-6 h-6 text-purple-300" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">聆听之道</h4>
                  <p className="text-sm text-gray-300 mb-4">通过声音探索意识的深层奥秘</p>

                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-200 transition-colors">
                      🌱 基础：觉察的艺术
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-200 transition-colors">
                      🌿 进阶：寂静中的声音
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-200 transition-colors">
                      🌳 深化：超越二元对立
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-200 transition-colors">
                      🌲 实相：声音的本质
                    </button>
                  </div>
                </div>

                {/* Module 2: Earth - 地球密码 */}
                <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl p-6 border border-cyan-400/30 hover:border-cyan-400/50 transition-all group">
                  <div className="w-12 h-12 bg-cyan-600/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6 text-cyan-300" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">地球密码</h4>
                  <p className="text-sm text-gray-300 mb-4">解读自然与生命的深层联结</p>

                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-cyan-200 transition-colors">
                      🌍 初探：地球的语言
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-cyan-200 transition-colors">
                      🌏 觉知：生命的韵律
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-cyan-200 transition-colors">
                      🌎 融合：人与自然一体
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-cyan-200 transition-colors">
                      🌐 超越：意识场的共振
                    </button>
                  </div>
                </div>

                {/* Module 3: PBL - 伊卡洛斯行动 */}
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-400/30 hover:border-orange-400/50 transition-all group">
                  <div className="w-12 h-12 bg-orange-600/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Rocket className="w-6 h-6 text-orange-300" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">伊卡洛斯行动</h4>
                  <p className="text-sm text-gray-300 mb-4">项目式学习，探索未知领域</p>

                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-orange-200 transition-colors">
                      🚀 启航：团队协作基础
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-orange-200 transition-colors">
                      🛸 探索：科学实验设计
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-orange-200 transition-colors">
                      ✨ 创造：意识实验项目
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-orange-200 transition-colors">
                      🌟 突破：跨维度思维
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/portal/courses')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                >
                  查看全部课程 →
                </button>
              </div>
            </motion.div>

            {/* Main Quest */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-yellow-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">今日主线任务</h3>
              </div>
              <h4 className="text-lg font-medium text-purple-300 mb-2">{todayQuest.title}</h4>
              <p className="text-gray-300 mb-6">{todayQuest.description}</p>

              {todayQuest.tasks.length > 0 ? (
                <div className="space-y-3">
                  {todayQuest.tasks.map((task, index) => {
                    const TaskIcon = task.courseIcon || BookOpen
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          task.completed
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        } transition-colors cursor-pointer`}
                        onClick={() => handleTaskComplete(task.id)}
                      >
                        <div className="flex items-center flex-1">
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <TaskIcon className="w-4 h-4 text-purple-400" />
                              <span className="text-xs text-gray-400">{task.courseTitle}</span>
                            </div>
                            <p className={`font-medium ${task.completed ? 'text-green-300' : 'text-white'}`}>
                              {task.title}
                            </p>
                            <p className="text-sm text-gray-400">{task.duration}</p>
                          </div>
                        </div>
                        {!task.completed && (
                          <Play className="w-4 h-4 text-purple-400 flex-shrink-0 ml-2" />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">还没有今日任务</p>
                  <p className="text-sm text-gray-500 mb-4">选择您感兴趣的课程开始探索</p>
                  <button
                    onClick={() => router.push('/portal/courses')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    浏览课程
                  </button>
                </div>
              )}
            </motion.div>

            {/* Today's Meditation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">今日冥想</h3>
              </div>
              <h4 className="text-lg font-medium text-blue-300 mb-2">{todayMeditation.title}</h4>
              <p className="text-gray-300 mb-4">{todayMeditation.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{todayMeditation.duration}</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  开始冥想
                </button>
              </div>
            </motion.div>

            {/* PBL Project */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-orange-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">伊卡洛斯行动</h3>
              </div>
              <h4 className="text-lg font-medium text-orange-300 mb-2">{pblProject.title}</h4>
              <p className="text-gray-300 mb-4">{pblProject.description}</p>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">项目进度</span>
                  <span className="text-sm text-orange-400">{pblProject.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pblProject.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">下一步行动：</p>
                <p className="text-white font-medium">{pblProject.nextAction}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{pblProject.teamMembers} 位探索者</span>
                </div>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  继续探索
                </button>
              </div>
            </motion.div>

            {/* Gaia's Whisper */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30"
            >
              <div className="flex items-center mb-4">
                <Lightbulb className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">盖亚的低语</h3>
              </div>

              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full mb-3">
                  {gaiaWhisper.type}
                </span>
                <p className="text-gray-200 leading-relaxed italic">
                  &ldquo;{gaiaWhisper.message}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button className="text-purple-400 hover:text-purple-300 text-sm underline">
                  {gaiaWhisper.relatedLink}
                </button>
                <button
                  onClick={() => setShowGaiaDialog(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  深入对话
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Consciousness Tree */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <TreePine className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">意识进化树</h3>
              </div>
              <div className="relative h-80 w-full flex items-center justify-center bg-gradient-to-b from-white/5 to-white/10 rounded-lg">
                <img
                  src="/images/consciousness-tree-preview.png"
                  alt="意识进化树预览"
                  className="max-h-full max-w-full object-contain opacity-80"
                />
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/simple-tree')}
                  className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 hover:from-green-600/30 hover:to-blue-600/30 rounded-lg border border-green-500/30 transition-all duration-300 group"
                >
                  <TreePine className="w-5 h-5 text-green-400 mr-2 group-hover:text-green-300 transition-colors" />
                  <span className="text-green-300 group-hover:text-green-200 transition-colors font-medium">
                    查看完整意识树
                  </span>
                  <div className="w-4 h-4 ml-2 text-green-400 group-hover:text-green-300 transition-colors">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Growth Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-yellow-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">成长统计</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">连续探索</span>
                  <span className="text-white font-semibold">{currentDay} 天</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">完成任务</span>
                  <span className="text-white font-semibold">{completedTasks.length} 个</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">意识成长</span>
                  <span className="text-white font-semibold">{consciousnessGrowth} 点</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">当前等级</span>
                  <span className="text-white font-semibold">Level {Math.floor(currentDay / 7) + 1}</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4">快速行动</h3>

              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/progress')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-400 mr-3 group-hover:text-blue-300 transition-colors" />
                    <span className="text-white group-hover:text-blue-200 transition-colors">查看学习历程</span>
                  </div>
                  <div className="w-5 h-5 text-gray-400 group-hover:text-blue-300 transition-colors">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/alliance')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-green-400 mr-3 group-hover:text-green-300 transition-colors" />
                    <span className="text-white group-hover:text-green-200 transition-colors">探索者联盟</span>
                  </div>
                  <div className="w-5 h-5 text-gray-400 group-hover:text-green-300 transition-colors">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/insights')}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <Leaf className="w-5 h-5 text-purple-400 mr-3 group-hover:text-purple-300 transition-colors" />
                    <span className="text-white group-hover:text-purple-200 transition-colors">分享洞见</span>
                  </div>
                  <div className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Gaia Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        onClick={() => setShowGaiaDialog(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 z-50"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </motion.button>

      {/* Gaia Dialog */}
      <GaiaDialog isOpen={showGaiaDialog} onClose={() => setShowGaiaDialog(false)} />
    </div>
  )
}
