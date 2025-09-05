'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Users, Lock, Tag, X } from 'lucide-react';
import { insightsAPI, CreateInsightData } from '@/lib/api/insights';
import { useAuth } from '@/lib/auth';

export default function NewInsightPage() {
  const { user, isAuthenticated, loading: authLoading, refreshAuth } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<CreateInsightData>({
    title: '',
    content: '',
    summary: '',
    tags: [],
    visibility: 'private',
    status: 'draft'
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log('认证状态检查:', { isAuthenticated, user: user?.id, authLoading });
    
    if (!isAuthenticated && !authLoading) {
      console.log('用户未认证，尝试刷新认证状态...');
      // 先尝试刷新认证状态
      refreshAuth().then(() => {
        // 延迟检查，给认证状态更新一些时间
        setTimeout(() => {
          // 重新获取认证状态
          refreshAuth().then(() => {
            if (!isAuthenticated) {
              console.log('刷新后仍然未认证，重定向到登录页面');
              router.push('/login?redirect=/insights/new');
            }
          });
        }, 1500);
      });
      return;
    }
    
    if (isAuthenticated && user) {
      console.log('用户已认证，加载草稿');
      // 从 localStorage 加载草稿
      const draft = localStorage.getItem('insight_draft');
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
        } catch (error) {
          console.error('加载草稿失败:', error);
        }
      }
    }
  }, [isAuthenticated, user, authLoading, router, refreshAuth]);

  // 自动保存草稿
  useEffect(() => {
    if (isAuthenticated && (formData.title || formData.content)) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('insight_draft', JSON.stringify(formData));
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isAuthenticated]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '内容不能为空';
    }
    
    if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符';
    }
    
    if (formData.content.length > 10000) {
      newErrors.content = '内容不能超过10000个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateInsightData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && formData.tags && !formData.tags.includes(tag) && formData.tags.length < 10) {
      handleInputChange('tags', [...(formData.tags || []), tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', (formData.tags || []).filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setErrors({}); // 清除之前的错误
      
      // 准备创建洞见的数据
      const insightData: CreateInsightData = {
        ...formData,
        status,
        user_id: user?.id || ''
      };
      
      console.log('准备创建洞见:', insightData);
      
      // 调用 API 创建洞见
      const newInsight = await insightsAPI.createInsight(insightData);
      console.log('洞见创建成功:', newInsight);
      
      // 清除草稿
      localStorage.removeItem('insight_draft');
      
      // 显示成功消息
      alert('洞见创建成功！');
      
      // 跳转到洞见列表页
      router.push('/insights');
    } catch (error: unknown) {
      console.error('创建洞见失败:', error);
      
      // 更详细的错误处理
      let errorMessage = '创建洞见失败，请重试';
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('Could not find the table')) {
          errorMessage = '数据库表未创建，请联系管理员';
        } else if (error.message.includes('permission denied')) {
          errorMessage = '权限不足，请检查登录状态';
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    handleSubmit('draft');
  };

  const handlePublish = () => {
    handleSubmit('published');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4">检查认证状态...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('渲染时用户未认证，显示加载状态');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4">等待认证状态更新...</p>
          <button 
            onClick={() => refreshAuth()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            手动刷新认证状态
          </button>
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
                onClick={() => router.push('/insights')}
                className="text-white hover:text-purple-300 transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回洞见</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-white hover:text-purple-300 transition-colors"
              >
                返回主页
              </button>
            </div>
                         <h1 className="text-xl font-semibold text-white">发布洞见</h1>
             <div className="text-sm text-gray-300">
               {isAuthenticated ? `已登录: ${user?.email}` : '未登录'}
             </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          {/* 表单 */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                标题 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="输入洞见标题..."
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.title ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {formData.title.length}/100 字符
              </p>
            </div>

            {/* 内容 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                内容 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="分享你的洞见..."
                rows={12}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                  errors.content ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-400">{errors.content}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {formData.content.length}/10000 字符
              </p>
            </div>

            {/* 摘要 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                摘要 <span className="text-gray-400">(可选)</span>
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="简要描述你的洞见..."
                rows={3}
                maxLength={300}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                {formData.summary?.length || 0}/300 字符
              </p>
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                标签 <span className="text-gray-400">(最多10个)</span>
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="输入标签..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || (formData.tags?.length || 0) >= 10}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 可见性 */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                可见性
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'private', icon: Lock, label: '仅自己', desc: '只有你能看到' },
                  { value: 'guild', icon: Users, label: '联盟内', desc: '同联盟成员可见' },
                  { value: 'public', icon: Eye, label: '公开', desc: '所有人可见' }
                ].map(({ value, icon: Icon, label, desc }) => (
                  <label
                    key={value}
                    className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      formData.visibility === value
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      checked={formData.visibility === value}
                      onChange={(e) => handleInputChange('visibility', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        formData.visibility === value ? 'text-purple-400' : 'text-gray-400'
                      }`} />
                      <div className={`font-medium ${
                        formData.visibility === value ? 'text-white' : 'text-gray-300'
                      }`}>
                        {label}
                      </div>
                      <div className={`text-xs ${
                        formData.visibility === value ? 'text-purple-300' : 'text-gray-500'
                      }`}>
                        {desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 错误提示 */}
            {errors.submit && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                             <button
                 type="button"
                 onClick={handleSaveDraft}
                 disabled={submitting}
                 className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
               >
                 <Save className="w-5 h-5" />
                 <span>保存草稿</span>
               </button>
               <button
                 type="button"
                 onClick={handlePublish}
                 disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                 className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none"
               >
                 {submitting ? '发布中...' : '发布洞见'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
