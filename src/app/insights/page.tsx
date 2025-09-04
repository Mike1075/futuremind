'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Eye, EyeOff, Users, Lock, Calendar, Tag } from 'lucide-react';
import { insightsAPI, Insight } from '@/lib/api/insights';
import { useAuth } from '@/lib/auth';

export default function InsightsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'my' && user) {
        // 获取用户自己的洞见
        const userInsights = await insightsAPI.getUserInsights(user.id);
        setInsights(userInsights);
      } else {
        // 获取公开洞见
        const publicInsights = await insightsAPI.getPublicInsights();
        setInsights(publicInsights);
      }
    } catch (error) {
      console.error('加载洞见失败:', error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInsights();
    }
  }, [isAuthenticated, activeTab, loadInsights]);

  const handleCreateInsight = () => {
    router.push('/insights/new');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadInsights();
      return;
    }

    try {
      setLoading(true);
      const data = await insightsAPI.searchInsights(searchQuery, activeTab === 'public' ? 'public' : 'guild');
      setInsights(data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Eye className="w-4 h-4 text-green-500" />;
      case 'guild':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'private':
        return <Lock className="w-4 h-4 text-gray-500" />;
      default:
        return <EyeOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* 粒子背景 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">分享洞见</h1>
            <p className="text-xl text-gray-300 mb-8">登录后查看和分享你的洞见</p>
            <button
              onClick={() => router.push('/login?redirect=/insights')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              立即登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 粒子背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* 顶部导航 */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => router.push('/')}
                className="text-white hover:text-purple-300 transition-colors"
              >
                返回主页
              </button>
              <button
                onClick={() => router.push('/portal')}
                className="text-white hover:text-purple-300 transition-colors"
              >
                个人门户
              </button>
              <button
                onClick={() => router.push('/alliance')}
                className="text-white hover:text-purple-300 transition-colors"
              >
                探索者联盟
              </button>
            </div>
            <h1 className="text-xl font-semibold text-white">分享洞见</h1>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">洞见分享</h2>
            <button
              onClick={handleCreateInsight}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>发布洞见</span>
            </button>
          </div>

          {/* 搜索栏 */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="搜索洞见..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              搜索
            </button>
          </div>

          {/* 标签页 */}
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'my'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              我的洞见
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'public'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              公开洞见
            </button>
          </div>
        </div>

        {/* 洞见列表 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">加载中...</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {activeTab === 'my' ? '还没有洞见' : '暂无公开洞见'}
              </h3>
              <p className="text-gray-400 mb-6">
                {activeTab === 'my' 
                  ? '开始分享你的第一个洞见吧！' 
                  : '等待其他探索者分享洞见...'
                }
              </p>
              {activeTab === 'my' && (
                <button
                  onClick={handleCreateInsight}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  发布第一个洞见
                </button>
              )}
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{insight.title}</h3>
                      {getVisibilityIcon(insight.visibility)}
                      {insight.status === 'draft' && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          草稿
                        </span>
                      )}
                    </div>
                    {insight.summary && (
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{insight.summary}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(insight.created_at)}</span>
                      </div>
                      {insight.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          <span>{insight.tags.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="text-center">
                      <div className="text-white font-semibold">{insight.likes_count}</div>
                      <div>点赞</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{insight.comments_count}</div>
                      <div>评论</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {insight.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {activeTab === 'my' && (
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm rounded hover:bg-blue-600/30 transition-colors">
                        编辑
                      </button>
                      <button className="px-3 py-1 bg-red-600/20 text-red-300 text-sm rounded hover:bg-red-600/30 transition-colors">
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
