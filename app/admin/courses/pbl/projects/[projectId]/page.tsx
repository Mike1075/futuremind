'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Users, UsersRound, FileText, Plus, Trash2 } from 'lucide-react'

interface PBLProject {
  id: string
  system_id: string
  sequence_number: number
  title: string
  subtitle: string
  original_text: string
  week_plan: WeekPlan[]
  prerequisites: Prerequisite[]
  estimated_duration: number
  is_published: boolean
}

interface WeekPlan {
  week: number
  theme: string
  goals: string[]
  activities: Activity[]
}

interface Activity {
  day: string
  title: string
  description: string
  deliverables: string[]
}

interface Prerequisite {
  type: string
  description: string
}

interface Student {
  id: string
  full_name: string | null
  email: string
  enrolled_at: string
}

interface ProjectGroup {
  id: string
  name: string
  description: string | null
  member_ids: string[]
  created_at: string
}

type TabType = 'details' | 'students' | 'groups'

const DIFFICULTY_LABELS = {
  option_a: { label: '选项A', color: 'from-green-500 to-emerald-500', icon: '🌱' },
  option_b: { label: '选项B', color: 'from-blue-500 to-cyan-500', icon: '🌿' },
  option_c: { label: '选项C', color: 'from-purple-500 to-pink-500', icon: '🌳' },
  option_d: { label: '选项D', color: 'from-orange-500 to-red-500', icon: '🌲' }
}

export default function PBLProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [project, setProject] = useState<PBLProject | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<ProjectGroup[]>([])
  const [saving, setSaving] = useState(false)

  // 编辑模式
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    original_text: string
    estimated_duration: number
    week_plan: WeekPlan[]
  }>({
    title: '',
    original_text: '',
    estimated_duration: 0,
    week_plan: []
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [projectId])

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        original_text: project.original_text || '',
        estimated_duration: project.estimated_duration || 0,
        week_plan: project.week_plan || []
      })
    }
  }, [project])

  useEffect(() => {
    if (activeTab === 'students' && students.length === 0) {
      loadStudents()
    } else if (activeTab === 'groups' && groups.length === 0) {
      loadGroups()
    }
  }, [activeTab])

  const checkAuthAndLoadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      await loadProject()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadProject = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await (supabase
        .from('course_contents') as any)
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('加载项目失败:', error)
      alert('加载项目失败')
    }
  }

  const loadStudents = async () => {
    try {
      const supabase = createClient()

      // 查询选了这个项目的学员
      const { data: enrollments, error: enrollError } = await (supabase
        .from('pbl_project_enrollments') as any)
        .select('student_id, enrolled_at')
        .eq('project_id', projectId)
        .eq('status', 'active')

      if (enrollError) throw enrollError

      if (!enrollments || enrollments.length === 0) {
        setStudents([])
        return
      }

      const studentIds = enrollments.map((e: any) => e.student_id)

      // 获取学员详细信息
      const { data: profiles, error: profileError } = await (supabase
        .from('profiles') as any)
        .select('id, full_name, email')
        .in('id', studentIds)

      if (profileError) throw profileError

      // 合并注册时间
      const studentsWithEnrollment = profiles.map((profile: any) => {
        const enrollment = enrollments.find((e: any) => e.student_id === profile.id)
        return {
          ...profile,
          enrolled_at: enrollment?.enrolled_at
        }
      })

      setStudents(studentsWithEnrollment || [])
    } catch (error) {
      console.error('加载学员列表失败:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await (supabase
        .from('student_groups') as any)
        .select('*')
        .eq('course_id', projectId)
        .eq('group_type', 'pbl_project')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('加载分组列表失败:', error)
    }
  }

  const handleSave = async () => {
    if (!project) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await (supabase
        .from('course_contents') as any)
        .update({
          title: formData.title,
          original_text: formData.original_text,
          estimated_duration: formData.estimated_duration,
          week_plan: formData.week_plan,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (error) throw error

      alert('保存成功！')
      setEditMode(false)
      await loadProject()
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAddStudent = async () => {
    const email = prompt('请输入学员邮箱:')
    if (!email) return

    try {
      const supabase = createClient()

      // 查找用户
      const { data: user, error: userError } = await (supabase
        .from('profiles') as any)
        .select('id, email, full_name')
        .eq('email', email.trim())
        .single()

      if (userError || !user) {
        alert('未找到该邮箱的用户')
        return
      }

      // 添加到项目注册
      const { error: enrollError } = await (supabase
        .from('pbl_project_enrollments') as any)
        .insert({
          student_id: user.id,
          project_id: projectId,
          status: 'active'
        })

      if (enrollError) {
        if (enrollError.code === '23505') {
          alert('该学员已经选择了此项目')
        } else {
          throw enrollError
        }
        return
      }

      alert('添加学员成功！')
      await loadStudents()
    } catch (error) {
      console.error('添加学员失败:', error)
      alert('添加学员失败')
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('确定要将该学员从项目中移除吗？')) return

    try {
      const supabase = createClient()
      const { error } = await (supabase
        .from('pbl_project_enrollments') as any)
        .delete()
        .eq('student_id', studentId)
        .eq('project_id', projectId)

      if (error) throw error

      alert('移除成功！')
      await loadStudents()
    } catch (error) {
      console.error('移除学员失败:', error)
      alert('移除失败')
    }
  }

  // 周计划管理函数
  const handleAddWeek = () => {
    const newWeek: WeekPlan = {
      week: formData.week_plan.length + 1,
      theme: '',
      goals: [],
      activities: []
    }
    setFormData({
      ...formData,
      week_plan: [...formData.week_plan, newWeek]
    })
  }

  const handleDeleteWeek = (weekIndex: number) => {
    setFormData({
      ...formData,
      week_plan: formData.week_plan.filter((_, i) => i !== weekIndex)
    })
  }

  const handleUpdateWeek = (weekIndex: number, field: 'theme', value: string) => {
    const updated = [...formData.week_plan]
    updated[weekIndex][field] = value
    setFormData({ ...formData, week_plan: updated })
  }

  const handleAddGoal = (weekIndex: number) => {
    const updated = [...formData.week_plan]
    updated[weekIndex].goals = [...updated[weekIndex].goals, '']
    setFormData({ ...formData, week_plan: updated })
  }

  const handleUpdateGoal = (weekIndex: number, goalIndex: number, value: string) => {
    const updated = [...formData.week_plan]
    updated[weekIndex].goals[goalIndex] = value
    setFormData({ ...formData, week_plan: updated })
  }

  const handleDeleteGoal = (weekIndex: number, goalIndex: number) => {
    const updated = [...formData.week_plan]
    updated[weekIndex].goals = updated[weekIndex].goals.filter((_, i) => i !== goalIndex)
    setFormData({ ...formData, week_plan: updated })
  }

  const handleAddActivity = (weekIndex: number) => {
    const newActivity: Activity = {
      day: '',
      title: '',
      description: '',
      deliverables: []
    }
    const updated = [...formData.week_plan]
    updated[weekIndex].activities = [...updated[weekIndex].activities, newActivity]
    setFormData({ ...formData, week_plan: updated })
  }

  const handleUpdateActivity = (weekIndex: number, activityIndex: number, field: keyof Activity, value: string) => {
    const updated = [...formData.week_plan]
    if (field === 'deliverables') {
      return // Handle separately
    }
    updated[weekIndex].activities[activityIndex][field] = value as never
    setFormData({ ...formData, week_plan: updated })
  }

  const handleDeleteActivity = (weekIndex: number, activityIndex: number) => {
    const updated = [...formData.week_plan]
    updated[weekIndex].activities = updated[weekIndex].activities.filter((_, i) => i !== activityIndex)
    setFormData({ ...formData, week_plan: updated })
  }

  const handleAddDeliverable = (weekIndex: number, activityIndex: number) => {
    const updated = [...formData.week_plan]
    updated[weekIndex].activities[activityIndex].deliverables = [
      ...updated[weekIndex].activities[activityIndex].deliverables,
      ''
    ]
    setFormData({ ...formData, week_plan: updated })
  }

  const handleUpdateDeliverable = (weekIndex: number, activityIndex: number, deliverableIndex: number, value: string) => {
    const updated = [...formData.week_plan]
    updated[weekIndex].activities[activityIndex].deliverables[deliverableIndex] = value
    setFormData({ ...formData, week_plan: updated })
  }

  const handleDeleteDeliverable = (weekIndex: number, activityIndex: number, deliverableIndex: number) => {
    const updated = [...formData.week_plan]
    updated[weekIndex].activities[activityIndex].deliverables =
      updated[weekIndex].activities[activityIndex].deliverables.filter((_, i) => i !== deliverableIndex)
    setFormData({ ...formData, week_plan: updated })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">项目不存在</div>
      </div>
    )
  }

  const diffConfig = DIFFICULTY_LABELS[project.subtitle as keyof typeof DIFFICULTY_LABELS] || DIFFICULTY_LABELS.option_a

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/courses/pbl')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{diffConfig.icon}</span>
                <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              </div>
              <p className="text-gray-400 text-sm mt-1">{diffConfig.label} · 预计 {project.estimated_duration} 天</p>
            </div>
          </div>

          {activeTab === 'details' && (
            <button
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : editMode ? '保存' : '编辑'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-88px)]">
        {/* 左侧导航栏 */}
        <div className="w-80 bg-white/5 backdrop-blur-md border-r border-white/10 overflow-y-auto">
          <div className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 text-left ${
                activeTab === 'details'
                  ? 'bg-purple-600/30 border border-purple-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <FileText className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white font-medium">项目详情</p>
                <p className="text-gray-400 text-xs">查看和编辑项目内容</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 text-left ${
                activeTab === 'students'
                  ? 'bg-orange-600/30 border border-orange-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-white font-medium">项目学员</p>
                <p className="text-gray-400 text-xs">管理选择此项目的学员</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 text-left ${
                activeTab === 'groups'
                  ? 'bg-pink-600/30 border border-pink-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <UsersRound className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-white font-medium">项目分组</p>
                <p className="text-gray-400 text-xs">管理项目学员分组</p>
              </div>
            </button>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 overflow-y-auto">
          {/* 项目详情 Tab */}
          {activeTab === 'details' && (
            <div className="max-w-4xl mx-auto p-8">
              <div className="space-y-6">
                {/* 标题 */}
                <div>
                  <label className="block text-white font-medium mb-2">项目标题</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  ) : (
                    <p className="text-gray-300 text-lg">{project.title}</p>
                  )}
                </div>

                {/* 核心问题 */}
                <div>
                  <label className="block text-white font-medium mb-2">核心问题</label>
                  {editMode ? (
                    <textarea
                      value={formData.original_text}
                      onChange={(e) => setFormData({ ...formData, original_text: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  ) : (
                    <p className="text-gray-300 whitespace-pre-wrap">{project.original_text}</p>
                  )}
                </div>

                {/* 预计时长 */}
                <div>
                  <label className="block text-white font-medium mb-2">预计时长（天）</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  ) : (
                    <p className="text-gray-300">{project.estimated_duration} 天</p>
                  )}
                </div>

                {/* 周计划 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium text-lg">📅 周计划</h3>
                    {editMode && (
                      <button
                        onClick={handleAddWeek}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        添加周
                      </button>
                    )}
                  </div>

                  {formData.week_plan.length === 0 && editMode ? (
                    <p className="text-gray-400 text-sm">点击"添加周"按钮创建周计划</p>
                  ) : (
                    <div className="space-y-4">
                      {(editMode ? formData.week_plan : project.week_plan || []).map((week, weekIdx) => (
                        <div key={weekIdx} className="bg-white/5 rounded-lg p-6 border border-white/10">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-white font-bold text-lg">第 {week.week} 周</h4>
                            {editMode && (
                              <button
                                onClick={() => handleDeleteWeek(weekIdx)}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-all"
                                title="删除此周"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* 周主题 */}
                          <div className="mb-4">
                            <label className="block text-purple-300 font-medium mb-2">🎯 周主题</label>
                            {editMode ? (
                              <input
                                type="text"
                                value={week.theme}
                                onChange={(e) => handleUpdateWeek(weekIdx, 'theme', e.target.value)}
                                placeholder="例如：理解基本概念"
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                              />
                            ) : (
                              <p className="text-white">{week.theme}</p>
                            )}
                          </div>

                          {/* 周目标 */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-purple-300 font-medium">📝 周目标</label>
                              {editMode && (
                                <button
                                  onClick={() => handleAddGoal(weekIdx)}
                                  className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded text-xs flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  添加目标
                                </button>
                              )}
                            </div>
                            {week.goals && week.goals.length > 0 ? (
                              <ul className="space-y-2">
                                {week.goals.map((goal, goalIdx) => (
                                  <li key={goalIdx} className="flex items-start gap-2">
                                    {editMode ? (
                                      <>
                                        <input
                                          type="text"
                                          value={goal}
                                          onChange={(e) => handleUpdateGoal(weekIdx, goalIdx, e.target.value)}
                                          placeholder="输入目标..."
                                          className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500"
                                        />
                                        <button
                                          onClick={() => handleDeleteGoal(weekIdx, goalIdx)}
                                          className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-gray-300 text-sm">• {goal}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-sm">暂无目标</p>
                            )}
                          </div>

                          {/* 活动安排 */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-cyan-300 font-medium">🗓️ 活动安排</label>
                              {editMode && (
                                <button
                                  onClick={() => handleAddActivity(weekIdx)}
                                  className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 rounded text-xs flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  添加活动
                                </button>
                              )}
                            </div>
                            {week.activities && week.activities.length > 0 ? (
                              <div className="space-y-3">
                                {week.activities.map((activity, actIdx) => (
                                  <div key={actIdx} className="bg-black/30 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1 space-y-2">
                                        {editMode ? (
                                          <>
                                            <input
                                              type="text"
                                              value={activity.day}
                                              onChange={(e) => handleUpdateActivity(weekIdx, actIdx, 'day', e.target.value)}
                                              placeholder="例如：第1天"
                                              className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-500"
                                            />
                                            <input
                                              type="text"
                                              value={activity.title}
                                              onChange={(e) => handleUpdateActivity(weekIdx, actIdx, 'title', e.target.value)}
                                              placeholder="活动标题"
                                              className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm font-medium focus:outline-none focus:border-cyan-500"
                                            />
                                            <textarea
                                              value={activity.description}
                                              onChange={(e) => handleUpdateActivity(weekIdx, actIdx, 'description', e.target.value)}
                                              placeholder="活动描述"
                                              rows={2}
                                              className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-500"
                                            />
                                          </>
                                        ) : (
                                          <>
                                            <p className="text-white font-medium">
                                              {activity.day} - {activity.title}
                                            </p>
                                            <p className="text-gray-400 text-sm">{activity.description}</p>
                                          </>
                                        )}

                                        {/* 可交付成果 */}
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <p className="text-green-300 text-xs">✅ 可交付成果</p>
                                            {editMode && (
                                              <button
                                                onClick={() => handleAddDeliverable(weekIdx, actIdx)}
                                                className="px-1.5 py-0.5 bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded text-xs"
                                              >
                                                <Plus className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                          {activity.deliverables && activity.deliverables.length > 0 ? (
                                            <ul className="space-y-1">
                                              {activity.deliverables.map((deliverable, delIdx) => (
                                                <li key={delIdx} className="flex items-start gap-2">
                                                  {editMode ? (
                                                    <>
                                                      <input
                                                        type="text"
                                                        value={deliverable}
                                                        onChange={(e) => handleUpdateDeliverable(weekIdx, actIdx, delIdx, e.target.value)}
                                                        placeholder="可交付成果"
                                                        className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-xs focus:outline-none focus:border-green-500"
                                                      />
                                                      <button
                                                        onClick={() => handleDeleteDeliverable(weekIdx, actIdx, delIdx)}
                                                        className="p-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded"
                                                      >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <span className="text-gray-400 text-xs">• {deliverable}</span>
                                                  )}
                                                </li>
                                              ))}
                                            </ul>
                                          ) : (
                                            <p className="text-gray-500 text-xs">暂无可交付成果</p>
                                          )}
                                        </div>
                                      </div>
                                      {editMode && (
                                        <button
                                          onClick={() => handleDeleteActivity(weekIdx, actIdx)}
                                          className="ml-2 p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">暂无活动</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 项目学员 Tab */}
          {activeTab === 'students' && (
            <div className="max-w-6xl mx-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">项目学员列表 ({students.length}人)</h2>
                <button
                  onClick={handleAddStudent}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加学员
                </button>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">暂无学员选择此项目</p>
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">姓名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">邮箱</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">注册时间</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-white">
                            {student.full_name || '未设置'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">{student.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('zh-CN') : '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRemoveStudent(student.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              移除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 项目分组 Tab */}
          {activeTab === 'groups' && (
            <div className="max-w-6xl mx-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">项目分组 ({groups.length}个)</h2>
                <button
                  onClick={() => router.push(`/admin/groups?course=${projectId}&type=pbl_project`)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  创建分组
                </button>
              </div>

              {groups.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                  <UsersRound className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">暂无项目分组</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => router.push(`/admin/groups/${group.id}`)}
                      className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer"
                    >
                      <h3 className="text-white font-bold text-lg mb-2">{group.name}</h3>
                      {group.description && (
                        <p className="text-gray-400 text-sm mb-3">{group.description}</p>
                      )}
                      <div className="flex items-center text-gray-400 text-sm">
                        <Users className="w-4 h-4 mr-2" />
                        {group.member_ids?.length || 0} 名成员
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
