"use client"

import React from 'react'
import {
  User,
  Mail,
  Calendar,
  Star,
  Target,
  Brain,
  Settings,
  Edit3,
  BookOpen
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

interface UserProfileProps {
  user: any
  isGuest: boolean
}

export function UserProfile({ user, isGuest }: UserProfileProps) {
  const toast = useToast()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <User className="w-12 h-12 text-cosmic-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">用户信息不可用</h3>
          <p className="text-cosmic-400">请重新登录</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6 bg-black">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">个人资料</h1>
          <button
            onClick={() => toast.info('编辑资料功能开发中...')}
            className="btn-cosmic-outline flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            编辑资料
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 基本信息 */}
          <div className="lg:col-span-1">
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700 text-center">
              <div className="w-24 h-24 bg-gradient-cosmic rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-xl font-semibold text-white mb-2">{user.name}</h2>
              <p className="text-cosmic-400 mb-4">{isGuest ? '游客模式' : user.email}</p>

              {user.consciousness_level !== undefined && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-cosmic-400 mb-2">
                    <span>意识等级</span>
                    <span>Lv.{user.consciousness_level}</span>
                  </div>
                  <div className="w-full bg-cosmic-800 rounded-full h-3">
                    <div
                      className="bg-gradient-cosmic h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(user.consciousness_level * 20, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-cosmic-500 mt-2">
                    通过参与项目提升意识等级
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-cosmic-400 text-sm">参与项目</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-cosmic-400 text-sm">完成项目</div>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>
              <div className="space-y-3">
                <button
                  onClick={() => toast.info('账户设置功能开发中...')}
                  className="w-full flex items-center px-4 py-3 bg-cosmic-700/50 hover:bg-cosmic-700 rounded-lg text-left text-cosmic-300 hover:text-white transition-colors"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  账户设置
                </button>
                <button
                  onClick={() => toast.info('我的收藏功能开发中...')}
                  className="w-full flex items-center px-4 py-3 bg-cosmic-700/50 hover:bg-cosmic-700 rounded-lg text-left text-cosmic-300 hover:text-white transition-colors"
                >
                  <Star className="w-5 h-5 mr-3" />
                  我的收藏
                </button>
                <button
                  onClick={() => toast.info('学习目标功能开发中...')}
                  className="w-full flex items-center px-4 py-3 bg-cosmic-700/50 hover:bg-cosmic-700 rounded-lg text-left text-cosmic-300 hover:text-white transition-colors"
                >
                  <Target className="w-5 h-5 mr-3" />
                  学习目标
                </button>
              </div>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息表单 */}
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
              <h3 className="text-lg font-semibold text-white mb-6">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-cosmic-300 mb-2">
                    探索者昵称
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    readOnly
                    className="input-cosmic w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-300 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="input-cosmic w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-cosmic-300 mb-2">
                    个人简介
                  </label>
                  <textarea
                    value={user.bio || '这位探索者还没有填写个人简介...'}
                    readOnly
                    rows={3}
                    className="input-cosmic w-full resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 兴趣标签 */}
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-primary-400" />
                兴趣领域
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map((interest: string, index: number) => (
                    <span key={index} className="px-3 py-2 bg-primary-600/20 text-primary-300 rounded-full border border-primary-500/30">
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-cosmic-400">还没有设置兴趣标签</p>
                )}
              </div>
            </div>

            {/* 技能标签 */}
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-resonance-400" />
                技能专长
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.skills && user.skills.length > 0 ? (
                  user.skills.map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-2 bg-resonance-600/20 text-resonance-300 rounded-full border border-resonance-500/30">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-cosmic-400">还没有设置技能标签</p>
                )}
              </div>
            </div>

            {/* 项目历史 */}
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
              <h3 className="text-lg font-semibold text-white mb-4">项目历史</h3>
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-cosmic-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">还没有参与项目</h4>
                <p className="text-cosmic-400 mb-4">开始探索有趣的项目，与志同道合的伙伴一起成长</p>
                <button
                  onClick={() => toast.info('探索项目功能已在探索页面')}
                  className="btn-cosmic"
                >
                  探索项目
                </button>
              </div>
            </div>

            {/* 成就徽章 */}
            <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-400" />
                成就徽章
              </h3>
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-cosmic-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">还没有获得徽章</h4>
                <p className="text-cosmic-400">通过参与项目和贡献社区来获得成就徽章</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
