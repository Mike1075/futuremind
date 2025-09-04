'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Plus, Star, Target, Zap, Globe, Heart } from 'lucide-react';
import AllianceAPI from '@/lib/api/alliance';
import type { ExplorerGuild, RecommendedGuild } from '@/types/alliance';
import { GuildStatus } from '@/types/alliance';
import CreateGuildModal from '@/components/alliance/CreateGuildModal';
import { createClient } from '@/lib/supabase/client';

export default function AlliancePage() {
  const [guilds, setGuilds] = useState<ExplorerGuild[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedGuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const supabase = createClient();

  const checkAuthStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setIsAuthenticated(false);
    }
  }, [supabase]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isAuthenticated) {
        // 已登录用户：加载真实数据
        const [guildsResponse, recommendationsResponse] = await Promise.all([
          AllianceAPI.getGuilds(),
          AllianceAPI.getRecommendedGuilds()
        ]);

        if (guildsResponse.success) {
          setGuilds(guildsResponse.data || []);
        }

        if (recommendationsResponse.success) {
          setRecommendations(recommendationsResponse.data || []);
        }
      } else {
        // 未登录用户：显示示例数据
        setGuilds([
          {
            id: 'demo-1',
            name: '声音探索者联盟',
            theme: '声音与意识',
            description: '专注于声音疗愈和意识觉醒的探索者社区',
            current_members: 12,
            max_members: 20,
            status: GuildStatus.FORMING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'demo-user'
          },
          {
            id: 'demo-2',
            name: '量子意识研究组',
            theme: '量子意识',
            description: '探索量子物理与意识关系的先锋团队',
            current_members: 8,
            max_members: 15,
            status: GuildStatus.FORMING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'demo-user'
          }
        ]);
        
        setRecommendations([
          {
            guild_id: 'demo-1',
            guild_name: '声音探索者联盟',
            guild_theme: '声音与意识',
            match_score: 0.95,
            reason: '基于你的兴趣匹配'
          }
        ]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (isAuthenticated !== undefined) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const filteredGuilds = guilds.filter(guild =>
    guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guild.theme.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSuccess = () => {
    loadData(); // 重新加载数据
  };

  const handleViewDetails = (guildId: string) => {
    // 跳转到联盟详情页面
    window.location.href = `/alliance/${guildId}`;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4 text-lg">正在连接探索者网络...</p>
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
            {/* 左侧：返回主页 */}
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
            >
              <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="font-medium">返回主页</span>
            </button>

            {/* 中间：页面标题 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">探索者联盟</h2>
            </div>

            {/* 右侧：个人门户 */}
            <button
              onClick={() => window.location.href = '/portal'}
              className="flex items-center space-x-2 text-green-300 hover:text-green-200 transition-colors duration-300 group"
            >
              <span className="font-medium">个人门户</span>
              <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center group-hover:bg-green-600/40 transition-colors duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* 头部区域 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-wide"
            >
              探索者联盟
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-purple-300/90 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              基于意识共振的深度协作空间，让志同道合的探索者汇聚一堂，
              共同揭开宇宙最深的秘密
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-5 justify-center items-center"
            >
              {isAuthenticated ? (
                <>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="group relative px-7 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-102 shadow-lg hover:shadow-purple-500/20"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    创建联盟
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </button>
                  <button className="group px-7 py-3.5 border border-purple-400 rounded-full text-purple-300 font-medium text-lg hover:scale-102">
                    <Users className="w-5 h-5 inline mr-2" />
                    发现联盟
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-purple-300/80 mb-4">登录后可以创建和加入联盟</p>
                  <button 
                    onClick={() => window.location.href = '/login?redirect=/alliance'}
                    className="group relative px-7 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-102 shadow-lg hover:shadow-purple-500/20"
                  >
                    立即登录
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 特色功能展示 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="container mx-auto px-6 py-12 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="w-14 h-14 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-600/40 transition-colors duration-300">
              <Zap className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI智能匹配</h3>
            <p className="text-purple-200 text-sm">基于意识共振算法，精准匹配志同道合的探索者</p>
          </div>
          
          <div className="text-center group">
            <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600/40 transition-colors duration-300">
              <Target className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">神秘邀请</h3>
            <p className="text-blue-200 text-sm">个性化的召唤方式，让每个邀请都充满神秘色彩</p>
          </div>
          
          <div className="text-center group">
            <div className="w-14 h-14 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600/40 transition-colors duration-300">
              <Globe className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">协作空间</h3>
            <p className="text-green-200 text-sm">专属的探索空间，支持实时协作和项目管理</p>
          </div>
          
          <div className="text-center group">
            <div className="w-14 h-14 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-600/40 transition-colors duration-300">
              <Heart className="w-7 h-7 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">成就系统</h3>
            <p className="text-pink-200 text-sm">记录探索历程，激励持续创新和突破</p>
          </div>
        </div>
      </motion.div>

      {/* 推荐联盟 */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="container mx-auto px-6 py-12 relative z-10"
        >
          <div className="max-w-7xl mx-auto bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] px-4 md:px-6 py-10 md:py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                🌟 为你推荐
              </h2>
              <p className="text-purple-200 text-lg">
                基于你的兴趣和探索轨迹，我们为你精选了这些联盟
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.guild_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all duration-300 group hover:bg-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 font-semibold">
                        {Math.round(rec.match_score * 100)}% 匹配
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {rec.guild_name}
                  </h3>
                  
                  <p className="text-purple-200 text-sm mb-4 line-clamp-3">
                    {rec.guild_theme}
                  </p>
                  
                  <div className="text-xs text-purple-300 mb-4">
                    {rec.reason}
                  </div>
                  
                  <button 
                    onClick={() => handleViewDetails(rec.guild_id)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-102"
                  >
                    查看详情
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 所有联盟 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="container mx-auto px-6 py-12 relative z-10"
      >
        <div className="max-w-7xl mx-auto bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] px-4 md:px-6 py-10 md:py-12">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              🚀 探索者联盟
            </h2>
            <p className="text-purple-200 text-base md:text-lg mb-6 md:mb-8">
              发现正在形成的探索者联盟，加入志同道合的探索之旅
            </p>
            
            {/* 搜索框 */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索联盟主题或名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300"
              />
            </div>
          </div>
          
          {filteredGuilds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuilds.map((guild, index) => (
                <motion.div
                  key={guild.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all duration-300 group hover:bg-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      guild.status === 'forming' ? 'bg-yellow-500/20 text-yellow-400' :
                      guild.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {guild.status === 'forming' ? '正在组建' :
                       guild.status === 'active' ? '活跃中' : '已完成'}
                    </span>
                    <div className="flex items-center space-x-1 text-purple-300">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{guild.current_members}/{guild.max_members}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {guild.name}
                  </h3>
                  
                  <p className="text-purple-200 text-sm mb-4 line-clamp-3">
                    {guild.theme}
                  </p>
                  
                  {guild.description && (
                    <p className="text-purple-300 text-xs mb-4 line-clamp-2">
                      {guild.description}
                    </p>
                  )}
                  
                                     <div className="flex items-center justify-between mb-4">
                     <span className="text-xs text-purple-400">
                       {new Date(guild.created_at).toLocaleDateString('zh-CN')}
                     </span>
                   </div>
                   
                   {/* 查看详情按钮 */}
                   <button 
                     onClick={() => handleViewDetails(guild.id)}
                     className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-102"
                   >
                     查看详情
                   </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">未找到匹配的联盟</h3>
              <p className="text-purple-200 mb-6">
                {searchQuery ? '尝试调整搜索关键词，或者创建一个新的联盟' : '目前还没有探索者联盟，成为第一个创建者吧！'}
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-102"
                >
                  创建第一个联盟
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* 创建联盟模态框 */}
      <CreateGuildModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
