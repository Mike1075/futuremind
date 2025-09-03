'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Calendar, MessageSquare, FileText, ArrowLeft, Star, Target, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ExplorerGuild, GuildMember, GuildActivity } from '@/types/alliance';

export default function GuildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.id as string;
  
  const [guild, setGuild] = useState<ExplorerGuild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [activities, setActivities] = useState<GuildActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMember, setIsMember] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    checkAuthStatus();
    loadGuildData();
  }, [guildId]);

  const checkAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setIsAuthenticated(false);
    }
  };

  const loadGuildData = async () => {
    try {
      setLoading(true);
      
      // 模拟加载联盟数据
      const mockGuild: ExplorerGuild = {
        id: guildId,
        name: '声音探索者联盟',
        theme: '声音与意识',
        description: '专注于声音疗愈和意识觉醒的探索者社区。我们探索声音的频率、振动和意识之间的关系，通过集体的智慧和实践，揭开声音疗愈的神秘面纱。',
        current_members: 12,
        max_members: 20,
        status: 'forming',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'demo-user'
      };

      const mockMembers: GuildMember[] = [
        {
          id: '1',
          guild_id: guildId,
          user_id: 'user1',
          role: 'founder',
          joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          invitation_response: 'accepted',
          is_active: true
        },
        {
          id: '2',
          guild_id: guildId,
          user_id: 'user2',
          role: 'coordinator',
          joined_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          invitation_response: 'accepted',
          is_active: true
        }
      ];

      const mockActivities: GuildActivity[] = [
        {
          id: '1',
          guild_id: guildId,
          user_id: 'user1',
          activity_type: 'milestone',
          content: '完成了声音频率分析的基础研究',
          metadata: { milestone_type: 'research' },
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          guild_id: guildId,
          user_id: 'user2',
          activity_type: 'message',
          content: '分享了最新的声音疗愈案例',
          metadata: { message_type: 'case_study' },
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setGuild(mockGuild);
      setMembers(mockMembers);
      setActivities(mockActivities);
      
      // 检查当前用户是否是成员
      if (isAuthenticated) {
        const currentUser = await supabase.auth.getUser();
        if (currentUser.data.user) {
          const isUserMember = mockMembers.some(member => member.user_id === currentUser.data.user?.id);
          setIsMember(isUserMember);
        }
      }
    } catch (error) {
      console.error('加载联盟数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGuild = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/alliance');
      return;
    }

    try {
      // 这里应该调用 API 加入联盟
      alert('成功加入联盟！');
      setIsMember(true);
      setGuild(prev => prev ? { ...prev, current_members: prev.current_members + 1 } : null);
    } catch (error) {
      console.error('加入联盟失败:', error);
      alert('加入联盟失败，请重试');
    }
  };

  const handleLeaveGuild = async () => {
    if (!confirm('确定要退出联盟吗？')) return;

    try {
      // 这里应该调用 API 退出联盟
      alert('已退出联盟');
      setIsMember(false);
      setGuild(prev => prev ? { ...prev, current_members: Math.max(0, prev.current_members - 1) } : null);
    } catch (error) {
      console.error('退出联盟失败:', error);
      alert('退出联盟失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4 text-lg">正在加载联盟信息...</p>
        </div>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">联盟不存在</h2>
          <button 
            onClick={() => router.push('/alliance')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white"
          >
            返回联盟列表
          </button>
        </div>
      </div>
    );
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

      {/* 导航栏 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 bg-white/5 backdrop-blur-md border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：返回联盟列表 */}
            <button
              onClick={() => router.push('/alliance')}
              className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回联盟列表</span>
            </button>

            {/* 中间：页面标题 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{guild.name}</h2>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center space-x-3">
              {isAuthenticated && (
                isMember ? (
                  <button
                    onClick={handleLeaveGuild}
                    className="px-4 py-2 border border-red-400 text-red-300 rounded-lg hover:bg-red-400/20 transition-colors"
                  >
                    退出联盟
                  </button>
                ) : (
                  <button
                    onClick={handleJoinGuild}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                  >
                    加入联盟
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* 主要内容 */}
      <div className="relative z-10 flex-1 container mx-auto px-6 py-8">
        {/* 联盟基本信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">{guild.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm">
                  {guild.theme}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  guild.status === 'forming' ? 'bg-yellow-500/20 text-yellow-400' :
                  guild.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {guild.status === 'forming' ? '正在组建' :
                   guild.status === 'active' ? '活跃中' : '已完成'}
                </span>
              </div>
              <p className="text-purple-200 text-lg leading-relaxed max-w-3xl">
                {guild.description}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-2">
                {guild.current_members}/{guild.max_members}
              </div>
              <div className="text-purple-300 text-sm">当前成员</div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{members.length}</div>
              <div className="text-purple-300 text-sm">活跃成员</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{activities.length}</div>
              <div className="text-blue-300 text-sm">活动记录</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {Math.floor((Date.now() - new Date(guild.created_at).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-green-300 text-sm">成立天数</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 成员列表 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-400" />
              联盟成员
            </h3>
            
            <div className="space-y-3">
              {members.map((member, index) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-300 font-semibold">
                        {member.role === 'founder' ? '👑' : member.role === 'coordinator' ? '⭐' : '👤'}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {member.role === 'founder' ? '创始人' : 
                         member.role === 'coordinator' ? '协调者' : '探索者'}
                      </div>
                      <div className="text-purple-300 text-sm">
                        加入于 {new Date(member.joined_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    member.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {member.is_active ? '活跃' : '离线'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 活动记录 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-400" />
              最新活动
            </h3>
            
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={activity.id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.activity_type === 'milestone' ? <Target className="w-4 h-4 text-blue-400" /> :
                       activity.activity_type === 'message' ? <MessageSquare className="w-4 h-4 text-green-400" /> :
                       <FileText className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm mb-1">
                        {activity.activity_type === 'milestone' ? '里程碑' :
                         activity.activity_type === 'message' ? '消息' : '活动'}
                      </div>
                      <div className="text-purple-200 text-sm">{activity.content}</div>
                      <div className="text-purple-400 text-xs mt-1">
                        {new Date(activity.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
