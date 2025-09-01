'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Calendar,
  BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TestStats {
  totalTests: number
  passedTests: number
  failedTests: number
  passRate: number
  lastTestDate: string
}

interface ModuleStats {
  moduleName: string
  stats: TestStats
}

export default function TestStatus() {
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([])
  const [overallStats, setOverallStats] = useState<TestStats>({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    passRate: 0,
    lastTestDate: ''
  })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    loadTestStats()
  }, [])

  const loadTestStats = async () => {
    setLoading(true)
    try {
      // 直接使用备用查询方法，因为RPC函数可能不存在
      await loadTestStatsBackup()
      return

      if (overall) {
        overall.passRate = overall.totalTests > 0 ? (overall.passedTests / overall.totalTests) * 100 : 0
        setOverallStats(overall)
      }

    } catch (error) {
      console.error('Error loading test stats:', error)
      await loadTestStatsBackup()
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  const loadTestStatsBackup = async () => {
    try {
      // 备用查询方法
      const { data: modules } = await supabase
        .from('project_modules')
        .select(`
          id,
          name,
          test_cases (
            id,
            test_records (
              id,
              status,
              test_date
            )
          )
        `)

      const moduleStatsData: ModuleStats[] = []
      let totalOverall = 0
      let passedOverall = 0
      let failedOverall = 0
      let latestDate = ''

      modules?.forEach((module: any) => {
        let totalTests = 0
        let passedTests = 0
        let failedTests = 0
        let lastTestDate = ''

        module.test_cases?.forEach((testCase: any) => {
          if (testCase.test_records && testCase.test_records.length > 0) {
            // 获取最新的测试记录
            const latestRecord = testCase.test_records
              .sort((a: any, b: any) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())[0]
            
            totalTests++
            if (latestRecord.status === 'passed') passedTests++
            else if (latestRecord.status === 'failed') failedTests++
            
            if (latestRecord.test_date > lastTestDate) {
              lastTestDate = latestRecord.test_date
            }
          }
        })

        const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

        moduleStatsData.push({
          moduleName: module.name,
          stats: {
            totalTests,
            passedTests,
            failedTests,
            passRate,
            lastTestDate
          }
        })

        totalOverall += totalTests
        passedOverall += passedTests
        failedOverall += failedTests
        if (lastTestDate > latestDate) latestDate = lastTestDate
      })

      setModuleStats(moduleStatsData)
      setOverallStats({
        totalTests: totalOverall,
        passedTests: passedOverall,
        failedTests: failedOverall,
        passRate: totalOverall > 0 ? (passedOverall / totalOverall) * 100 : 0,
        lastTestDate: latestDate
      })

    } catch (error) {
      console.error('Backup query failed:', error)
    }
  }

  const getStatusColor = (passRate: number) => {
    if (passRate >= 90) return 'text-green-400'
    if (passRate >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusIcon = (passRate: number) => {
    if (passRate >= 90) return <CheckCircle className="w-5 h-5 text-green-400" />
    if (passRate >= 70) return <Clock className="w-5 h-5 text-yellow-400" />
    return <XCircle className="w-5 h-5 text-red-400" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">加载测试状态中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Activity className="w-8 h-8 mr-3 text-green-400" />
                测试状态监控
              </h1>
              <p className="text-gray-400">实时监控项目测试执行状态和通过率</p>
            </div>
            <button
              onClick={loadTestStats}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新数据
            </button>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            最后更新: {lastRefresh.toLocaleString()}
          </div>
        </motion.div>

        {/* 总体统计卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            总体测试状态
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{overallStats.totalTests}</div>
              <div className="text-gray-400 text-sm">总测试数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{overallStats.passedTests}</div>
              <div className="text-gray-400 text-sm">通过测试</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">{overallStats.failedTests}</div>
              <div className="text-gray-400 text-sm">失败测试</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${getStatusColor(overallStats.passRate)}`}>
                {overallStats.passRate.toFixed(1)}%
              </div>
              <div className="text-gray-400 text-sm">通过率</div>
            </div>
          </div>

          {overallStats.lastTestDate && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center text-gray-400 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                最后测试时间: {new Date(overallStats.lastTestDate).toLocaleString()}
              </div>
            </div>
          )}
        </motion.div>

        {/* 模块测试状态 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {moduleStats.map((module: ModuleStats, index: number) => (
            <motion.div
              key={module.moduleName}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">{module.moduleName}</h3>
                {getStatusIcon(module.stats.passRate)}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">总测试</span>
                  <span className="text-white font-medium">{module.stats.totalTests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">通过</span>
                  <span className="text-green-400 font-medium">{module.stats.passedTests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">失败</span>
                  <span className="text-red-400 font-medium">{module.stats.failedTests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">通过率</span>
                  <span className={`font-medium ${getStatusColor(module.stats.passRate)}`}>
                    {module.stats.passRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 进度条 */}
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      module.stats.passRate >= 90 ? 'bg-green-500' :
                      module.stats.passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${module.stats.passRate}%` }}
                  ></div>
                </div>
              </div>

              {module.stats.lastTestDate && (
                <div className="mt-3 text-xs text-gray-500">
                  最后测试: {new Date(module.stats.lastTestDate).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* 快速操作 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href="/test-dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              打开测试仪表板
            </a>
            <button
              onClick={() => window.open('http://localhost:3000', '_blank')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              访问主应用
            </button>
            <button
              onClick={() => {
                fetch('/api/init-database', { method: 'POST' })
                  .then(() => alert('数据库重新初始化完成'))
                  .catch(() => alert('初始化失败'))
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              重新初始化数据库
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}