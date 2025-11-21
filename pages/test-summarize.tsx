'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'error' | 'warning'
  message: string
}

interface TestUser {
  id: string
  full_name: string
  email: string
  conversation_count: number
  submission_count: number
  project_count: number
}

export default function TestSummarizePage() {
  const [userId, setUserId] = useState('')
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['dialogue'])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testUsers, setTestUsers] = useState<TestUser[]>([])
  const supabase = createClientComponentClient()

  // 添加日志
  const addLog = (level: LogEntry['level'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
    setLogs(prev => [...prev, { timestamp, level, message }])
  }

  // 清空日志
  const clearLogs = () => {
    setLogs([])
    setResult(null)
  }

  // 加载可用的测试用户
  useEffect(() => {
    loadTestUsers()
  }, [])

  const loadTestUsers = async () => {
    addLog('info', '正在加载可用的测试用户...')

    try {
      const { data, error } = await supabase.rpc('get_test_users_with_data')

      if (error) {
        // 如果RPC不存在，使用备用查询
        addLog('warning', 'RPC函数不存在，使用备用查询方法')
        await loadTestUsersDirectly()
        return
      }

      if (data && data.length > 0) {
        setTestUsers(data)
        addLog('success', `成功加载 ${data.length} 个有数据的测试用户`)
      } else {
        addLog('warning', '未找到有数据的测试用户')
      }
    } catch (err) {
      addLog('error', `加载测试用户失败: ${err instanceof Error ? err.message : String(err)}`)
      await loadTestUsersDirectly()
    }
  }

  const loadTestUsersDirectly = async () => {
    try {
      // 方案1: 尝试查询数据库
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'student')
        .order('full_name', { ascending: true })
        .limit(20)

      if (profileError || !profiles || profiles.length === 0) {
        // 方案2: 如果查询失败或没有登录，使用硬编码的测试用户
        addLog('warning', '无法查询数据库，使用预设测试用户')
        const hardcodedUsers: TestUser[] = [
          {
            id: 'b9a9ab9d-2978-4918-80e0-d12422e24cb2',
            full_name: '陶子',
            email: 'sam79v9streat@hotmail.com',
            conversation_count: 0,
            submission_count: 0,
            project_count: 0
          },
          {
            id: '538ad263-bde1-4af2-9c18-eb865f9ec33b',
            full_name: '正方形',
            email: '546648974@qq.com',
            conversation_count: 0,
            submission_count: 0,
            project_count: 0
          },
          {
            id: 'e84ab896-2278-45d7-809f-0d3041e88239',
            full_name: 'law',
            email: '546648971@qq.com',
            conversation_count: 0,
            submission_count: 0,
            project_count: 0
          },
          {
            id: 'fa67a5d2-3ce8-4452-91ab-caa6b1a47d0e',
            full_name: '杜富陶',
            email: 'futaodu@gmail.com',
            conversation_count: 0,
            submission_count: 0,
            project_count: 0
          }
        ]
        setTestUsers(hardcodedUsers)
        addLog('success', `加载了 ${hardcodedUsers.length} 个预设测试用户`)
        return
      }

      // 将所有学生添加到列表
      const allStudents: TestUser[] = profiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || '未知',
        email: profile.email,
        conversation_count: 0,
        submission_count: 0,
        project_count: 0
      }))

      setTestUsers(allStudents)
      addLog('success', `成功加载 ${allStudents.length} 个学生用户`)
      addLog('info', '提示：数据量显示为0是正常的，Edge Function会获取实际数据')
    } catch (err) {
      addLog('error', `查询失败: ${err instanceof Error ? err.message : String(err)}`)
      // 降级方案：使用硬编码用户
      addLog('info', '使用备用测试用户...')
      const fallbackUsers: TestUser[] = [
        {
          id: 'b9a9ab9d-2978-4918-80e0-d12422e24cb2',
          full_name: '陶子',
          email: 'sam79v9streat@hotmail.com',
          conversation_count: 0,
          submission_count: 0,
          project_count: 0
        }
      ]
      setTestUsers(fallbackUsers)
      addLog('success', '已加载备用测试用户')
    }
  }

  // 测试Edge Function
  const testFunction = async () => {
    if (!userId) {
      addLog('error', '请先选择一个测试用户')
      return
    }

    if (selectedDimensions.length === 0) {
      addLog('error', '请至少选择一个维度')
      return
    }

    setIsLoading(true)
    clearLogs()
    setResult(null)

    addLog('info', '========== 开始测试 ==========')
    addLog('info', `用户ID: ${userId}`)
    addLog('info', `测试维度: ${selectedDimensions.join(', ')}`)

    const startTime = Date.now()

    try {
      addLog('info', '正在调用 Edge Function...')

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/summarize-user-activity`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            userId,
            dimensions: selectedDimensions
          })
        }
      )

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      addLog('info', `Edge Function 响应时间: ${duration}秒`)

      if (!response.ok) {
        const errorData = await response.json()
        addLog('error', `HTTP ${response.status}: ${errorData.error || '未知错误'}`)
        return
      }

      const data = await response.json()
      addLog('success', 'Edge Function 调用成功！')

      // 解析结果
      if (data.success) {
        addLog('success', `✅ 总结生成成功！`)

        // 对话维度
        if (data.results.dialogue) {
          addLog('info', '📝 对话维度总结生成成功')
          addLog('info', `  - 对话数: ${data.results.dialogue.conversation_count}`)
          addLog('info', `  - 消息数: ${data.results.dialogue.message_count}`)
          addLog('info', `  - 总结长度: ${data.results.dialogue.summary?.length || 0} 字`)
        }

        // 作业维度
        if (data.results.coursework) {
          addLog('info', '📚 作业维度总结生成成功')
          addLog('info', `  - 作业数: ${data.results.coursework.submission_count}`)
          addLog('info', `  - 互动数: ${data.results.coursework.interaction_count}`)
          addLog('info', `  - 总结长度: ${data.results.coursework.summary?.length || 0} 字`)
        }

        // 项目维度
        if (data.results.projects) {
          addLog('info', '🎯 项目维度总结生成成功')
          addLog('info', `  - 活跃项目: ${data.results.projects.active_project_count}`)
          addLog('info', `  - 总项目数: ${data.results.projects.total_project_count}`)
          addLog('info', `  - 总结长度: ${data.results.projects.summary?.length || 0} 字`)
        }

        setResult(data.results)
        addLog('success', '========== 测试完成 ==========')

        // 验证数据库存储
        await verifyDatabaseStorage()
      } else {
        addLog('error', '总结生成失败')
      }

    } catch (err) {
      addLog('error', `网络错误: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 验证数据库存储
  const verifyDatabaseStorage = async () => {
    addLog('info', '正在验证数据库存储...')

    try {
      const { data, error } = await supabase
        .from('student_summaries')
        .select('course_summaries, generated_at, valid_until')
        .eq('user_id', userId)
        .single()

      if (error) {
        addLog('error', `数据库查询失败: ${error.message}`)
        return
      }

      if (data) {
        addLog('success', '✅ 数据已成功存储到数据库')
        addLog('info', `  - 生成时间: ${new Date(data.generated_at).toLocaleString('zh-CN')}`)
        addLog('info', `  - 有效期至: ${new Date(data.valid_until).toLocaleString('zh-CN')}`)
      }
    } catch (err) {
      addLog('warning', `数据库验证失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const toggleDimension = (dimension: string) => {
    if (selectedDimensions.includes(dimension)) {
      setSelectedDimensions(selectedDimensions.filter(d => d !== dimension))
    } else {
      setSelectedDimensions([...selectedDimensions, dimension])
    }
  }

  const selectUser = (user: TestUser) => {
    setUserId(user.id)
    addLog('info', `已选择用户: ${user.full_name} (${user.email})`)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-green-400">🧪 用户总结功能测试</h1>
        <p className="text-gray-400 mb-8">Edge Function: summarize-user-activity | AI模型: GPT-5 Mini</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：配置面板 */}
          <div className="space-y-6">
            {/* 测试用户列表 */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-400">📋 可用测试用户</h2>

              {testUsers.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  <div className="animate-pulse">正在加载用户...</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {testUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className={`p-4 rounded cursor-pointer transition-all ${
                        userId === user.id
                          ? 'bg-green-600 border-green-400'
                          : 'bg-gray-800 hover:bg-gray-700 border-gray-600'
                      } border`}
                    >
                      <div className="font-semibold">{user.full_name}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-blue-400">💬 {user.conversation_count}个对话</span>
                        <span className="text-yellow-400">📚 {user.submission_count}个作业</span>
                        <span className="text-purple-400">🎯 {user.project_count}个项目</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {userId && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-600 rounded">
                  <div className="text-sm text-green-400">✅ 已选择用户ID:</div>
                  <div className="font-mono text-xs mt-1 break-all">{userId}</div>
                </div>
              )}
            </div>

            {/* 维度选择 */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-400">🎯 选择测试维度</h2>

              <div className="space-y-3">
                {[
                  { id: 'dialogue', label: '💬 对话维度 (Dialogue)', desc: '分析盖亚对话和聊天历史' },
                  { id: 'coursework', label: '📚 作业维度 (Coursework)', desc: '分析作业提交和内容互动' },
                  { id: 'projects', label: '🎯 项目维度 (Projects)', desc: '分析PBL项目参与情况' }
                ].map(dim => (
                  <label
                    key={dim.id}
                    className={`flex items-start gap-3 p-4 rounded cursor-pointer transition-all border ${
                      selectedDimensions.includes(dim.id)
                        ? 'bg-green-900/30 border-green-600'
                        : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDimensions.includes(dim.id)}
                      onChange={() => toggleDimension(dim.id)}
                      className="mt-1 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{dim.label}</div>
                      <div className="text-sm text-gray-400">{dim.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={testFunction}
                disabled={isLoading || !userId}
                className={`flex-1 py-4 rounded-lg font-semibold text-lg transition-all ${
                  isLoading || !userId
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLoading ? '⏳ 测试中...' : '🚀 开始测试'}
              </button>

              <button
                onClick={clearLogs}
                className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
              >
                🗑️ 清空日志
              </button>
            </div>
          </div>

          {/* 右侧：日志和结果 */}
          <div className="space-y-6">
            {/* 日志面板 */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-400">📝 执行日志</h2>

              <div className="bg-black rounded p-4 font-mono text-sm h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">等待测试...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'success' ? 'text-green-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}>
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 结果展示 */}
            {result && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-green-400">✨ AI 生成的总结</h2>

                <div className="space-y-4">
                  {result.dialogue && (
                    <div className="bg-blue-900/20 border border-blue-600 rounded p-4">
                      <div className="font-semibold text-blue-400 mb-2">💬 对话维度总结</div>
                      <div className="text-sm leading-relaxed">{result.dialogue.summary}</div>
                      <div className="mt-2 text-xs text-gray-400">
                        对话数: {result.dialogue.conversation_count} | 消息数: {result.dialogue.message_count}
                      </div>
                    </div>
                  )}

                  {result.coursework && (
                    <div className="bg-yellow-900/20 border border-yellow-600 rounded p-4">
                      <div className="font-semibold text-yellow-400 mb-2">📚 作业维度总结</div>
                      <div className="text-sm leading-relaxed">{result.coursework.summary}</div>
                      <div className="mt-2 text-xs text-gray-400">
                        作业数: {result.coursework.submission_count} | 互动数: {result.coursework.interaction_count}
                      </div>
                    </div>
                  )}

                  {result.projects && (
                    <div className="bg-purple-900/20 border border-purple-600 rounded p-4">
                      <div className="font-semibold text-purple-400 mb-2">🎯 项目维度总结</div>
                      <div className="text-sm leading-relaxed">{result.projects.summary}</div>
                      <div className="mt-2 text-xs text-gray-400">
                        活跃项目: {result.projects.active_project_count} | 总项目数: {result.projects.total_project_count}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
