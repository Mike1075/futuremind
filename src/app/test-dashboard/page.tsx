'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TestTube, 
  ExternalLink, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  FileText,
  Link
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Module {
  id: string
  name: string
  description: string
  preview_url: string
  status: string
}

interface TestCase {
  id: string
  title: string
  description: string
  test_type: string
  priority: string
  expected_result: string
}

interface TestRecord {
  id: string
  status: string
  actual_result: string
  notes: string
  test_date: string
  tester_name: string
}

interface PreviewLink {
  id: string
  title: string
  url: string
  environment: string
  is_active: boolean
}

export default function TestDashboard() {
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [testRecords, setTestRecords] = useState<TestRecord[]>([])
  const [previewLinks, setPreviewLinks] = useState<PreviewLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModules()
  }, [])

  useEffect(() => {
    if (selectedModule) {
      loadTestCases(selectedModule.id)
      loadPreviewLinks(selectedModule.id)
    }
  }, [selectedModule])

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('project_modules')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setModules(data || [])
      if (data && data.length > 0) {
        setSelectedModule(data[0])
      }
    } catch (error) {
      console.error('Error loading modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTestCases = async (moduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('module_id', moduleId)
        .order('priority', { ascending: false })

      if (error) throw error
      setTestCases(data || [])
    } catch (error) {
      console.error('Error loading test cases:', error)
    }
  }

  const loadPreviewLinks = async (moduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('preview_links')
        .select('*')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPreviewLinks(data || [])
    } catch (error) {
      console.error('Error loading preview links:', error)
    }
  }

  const addPreviewLink = async (moduleId: string, title: string, url: string, environment: string = 'development') => {
    try {
      const { error } = await supabase
        .from('preview_links')
        .insert([{
          module_id: moduleId,
          title,
          url,
          environment
        }])

      if (error) throw error
      loadPreviewLinks(moduleId)
    } catch (error) {
      console.error('Error adding preview link:', error)
    }
  }

  const recordTestResult = async (testCaseId: string, status: string, actualResult: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('test_records')
        .insert([{
          test_case_id: testCaseId,
          status,
          actual_result: actualResult,
          notes,
          tester_name: 'System Tester'
        }])

      if (error) throw error
      // 重新加载测试记录
      loadTestRecords(testCaseId)
    } catch (error) {
      console.error('Error recording test result:', error)
    }
  }

  const runAutoTest = async (testType: string, url: string, moduleId: string) => {
    try {
      const response = await fetch('/api/run-auto-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testType,
          url,
          moduleId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`自动化测试完成: ${result.testResult.message}`)
        // 刷新数据
        if (selectedModule) {
          loadTestCases(selectedModule.id)
        }
      } else {
        alert(`自动化测试失败: ${result.error}`)
      }
    } catch (error) {
      console.error('Error running auto test:', error)
      alert('自动化测试执行失败')
    }
  }

  const loadTestRecords = async (testCaseId: string) => {
    try {
      const { data, error } = await supabase
        .from('test_records')
        .select('*')
        .eq('test_case_id', testCaseId)
        .order('test_date', { ascending: false })
        .limit(5)

      if (error) throw error
      setTestRecords(data || [])
    } catch (error) {
      console.error('Error loading test records:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      case 'blocked': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">加载测试数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <TestTube className="w-8 h-8 mr-3 text-purple-400" />
            测试管理仪表板
          </h1>
          <p className="text-gray-400">管理项目模块的测试用例、预览链接和测试记录</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 模块列表 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">项目模块</h2>
              <div className="space-y-3">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedModule?.id === module.id
                        ? 'bg-purple-600/30 border border-purple-500/50'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{module.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{module.status}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 主要内容区域 */}
          <div className="lg:col-span-3 space-y-6">
            {selectedModule && (
              <>
                {/* 模块信息和预览链接 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedModule.name}</h2>
                      <p className="text-gray-400 mt-1">{selectedModule.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedModule.status === 'development' ? 'bg-blue-500/20 text-blue-300' :
                      selectedModule.status === 'testing' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {selectedModule.status}
                    </span>
                  </div>

                  {/* 预览链接 */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Link className="w-5 h-5 mr-2" />
                        预览链接
                      </h3>
                      <button
                        onClick={() => {
                          const title = prompt('链接标题:')
                          const url = prompt('链接URL:')
                          if (title && url) {
                            addPreviewLink(selectedModule.id, title, url)
                          }
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        添加链接
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {previewLinks.map((link) => (
                        <div key={link.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white text-sm">{link.title}</div>
                              <div className="text-xs text-gray-400">{link.environment}</div>
                            </div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* 测试用例 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
                >
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    测试用例
                  </h3>
                  <div className="space-y-4">
                    {testCases.map((testCase) => (
                      <div key={testCase.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(testCase.priority)} mr-2`}></div>
                              <h4 className="font-medium text-white">{testCase.title}</h4>
                              <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                {testCase.test_type}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{testCase.description}</p>
                            <p className="text-gray-300 text-sm">
                              <strong>预期结果:</strong> {testCase.expected_result}
                            </p>
                          </div>
                        </div>
                        
                        {/* 快速测试按钮 */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={() => recordTestResult(testCase.id, 'passed', '测试通过', '手动测试记录')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            通过
                          </button>
                          <button
                            onClick={() => recordTestResult(testCase.id, 'failed', '测试失败', '需要进一步检查')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            失败
                          </button>
                          <button
                            onClick={() => loadTestRecords(testCase.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <BarChart3 className="w-4 h-4 mr-1" />
                            查看记录
                          </button>
                          
                          {/* 自动化测试按钮 */}
                          {previewLinks.length > 0 && (
                            <>
                              <button
                                onClick={() => runAutoTest('page_load', previewLinks[0].url, testCase.id)}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors flex items-center"
                              >
                                <TestTube className="w-4 h-4 mr-1" />
                                页面测试
                              </button>
                              <button
                                onClick={() => runAutoTest('performance', previewLinks[0].url, testCase.id)}
                                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors flex items-center"
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                性能测试
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}