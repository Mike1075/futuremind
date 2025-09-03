'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Target, Clock, TrendingUp, Calendar, BookOpen, Users, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface ProgressData {
  totalProjects: number;
  completedProjects: number;
  totalInsights: number;
  guildMemberships: number;
  currentStreak: number;
  totalHours: number;
  achievements: Achievement[];
  recentActivities: Activity[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'learning' | 'collaboration' | 'insight' | 'guild';
}

interface Activity {
  id: string;
  type: 'project_completed' | 'insight_published' | 'guild_joined' | 'milestone_reached';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export default function ProgressPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadProgressData();
    }
  }, [isAuthenticated]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      // 模拟数据加载 - 实际项目中应该从 API 获取
      const mockData: ProgressData = {
        totalProjects: 12,
        completedProjects: 8,
        totalInsights: 15,
        guildMemberships: 3,
        currentStreak: 7,
        totalHours: 156,
        achievements: [
          {
            id: '1',
            name: '初出茅庐',
            description: '完成第一个项目',
            icon: '🎯',
            unlockedAt: '2024-01-15',
            category: 'learning'
          },
          {
            id: '2',
            name: '洞见分享者',
            description: '发布第一个洞见',
            icon: '💡',
            unlockedAt: '2024-01-20',
            category: 'insight'
          },
          {
            id: '3',
            name: '联盟探索者',
            description: '加入第一个探索者联盟',
            icon: '🤝',
            unlockedAt: '2024-02-01',
            category: 'guild'
          },
          {
            id: '4',
            name: '坚持不懈',
            description: '连续学习7天',
            icon: '🔥',
            unlockedAt: '2024-02-10',
            category: 'learning'
          }
        ],
        recentActivities: [
          {
            id: '1',
            type: 'project_completed',
            title: '完成"意识升维"项目',
            description: '成功完成了关于意识进化的深度探索项目',
            timestamp: '2024-02-15T10:30:00Z',
            metadata: { projectName: '意识升维', score: 95 }
          },
          {
            id: '2',
            type: 'insight_published',
            title: '发布洞见"现实的多重性"',
            description: '分享了关于现实本质的深刻洞见',
            timestamp: '2024-02-14T15:20:00Z',
            metadata: { insightTitle: '现实的多重性', visibility: 'public' }
          },
          {
            id: '3',
            type: 'guild_joined',
            title: '加入"量子意识联盟"',
            description: '成为量子意识探索者联盟的新成员',
            timestamp: '2024-02-13T09:15:00Z',
            metadata: { guildName: '量子意识联盟' }
          },
          {
            id: '4',
            type: 'milestone_reached',
            title: '达到100小时学习里程碑',
            description: '累计学习时间突破100小时',
            timestamp: '2024-02-12T18:45:00Z',
            metadata: { milestone: '100小时', reward: '专注力徽章' }
          }
        ]
      };
      
      setProgressData(mockData);
    } catch (error) {
      console.error('加载学习历程失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_completed':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'insight_published':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'guild_joined':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'milestone_reached':
        return <Star className="w-5 h-5 text-purple-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
            <h1 className="text-4xl font-bold text-white mb-4">学习历程</h1>
            <p className="text-xl text-gray-300 mb-8">登录后查看你的学习进度</p>
            <button
              onClick={() => router.push('/login?redirect=/progress')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              立即登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !progressData) {
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">加载学习历程中...</p>
          </div>
        </div>
      </div>
    );
  }

  const completionRate = Math.round((progressData.completedProjects / progressData.totalProjects) * 100);

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
            <h1 className="text-xl font-semibold text-white">学习历程</h1>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">学习历程</h2>
          <p className="text-gray-300">记录你的成长轨迹，见证意识的进化</p>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{completionRate}%</h3>
            <p className="text-gray-400 text-sm">项目完成率</p>
            <p className="text-gray-500 text-xs mt-1">
              {progressData.completedProjects}/{progressData.totalProjects} 个项目
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{progressData.totalInsights}</h3>
            <p className="text-gray-400 text-sm">洞见分享</p>
            <p className="text-gray-500 text-xs mt-1">智慧的火花</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{progressData.guildMemberships}</h3>
            <p className="text-gray-400 text-sm">联盟成员</p>
            <p className="text-gray-500 text-xs mt-1">协作的力量</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{progressData.totalHours}</h3>
            <p className="text-gray-400 text-sm">学习时长</p>
            <p className="text-gray-500 text-xs mt-1">专注的时光</p>
          </div>
        </div>

        {/* 成就和活动 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 成就展示 */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">成就徽章</h3>
              <span className="text-sm text-gray-400">{progressData.achievements.length} 个成就</span>
            </div>
            <div className="space-y-4">
              {progressData.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{achievement.name}</h4>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      获得于 {formatDate(achievement.unlockedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 最近活动 */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">最近活动</h3>
              <span className="text-sm text-gray-400">时间轴</span>
            </div>
            <div className="space-y-4">
              {progressData.recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 relative"
                >
                  {/* 时间线连接线 */}
                  {index < progressData.recentActivities.length - 1 && (
                    <div className="absolute left-6 top-8 w-0.5 h-8 bg-white/20"></div>
                  )}
                  
                  {/* 活动图标 */}
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  {/* 活动内容 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white mb-1">{activity.title}</h4>
                    <p className="text-sm text-gray-400 mb-2">{activity.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 连续学习天数 */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">{progressData.currentStreak}</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">连续学习天数</h3>
            <p className="text-gray-400">保持学习的热情，让意识持续进化</p>
            <div className="mt-4 flex justify-center space-x-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < progressData.currentStreak
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : 'bg-white/20'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
