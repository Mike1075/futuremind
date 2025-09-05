'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Sparkles, Target, FileText } from 'lucide-react';
import AllianceAPI from '@/lib/api/alliance';
import type { CreateGuildRequest } from '@/types/alliance';

interface CreateGuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGuildModal({ isOpen, onClose, onSuccess }: CreateGuildModalProps) {
  const [formData, setFormData] = useState<CreateGuildRequest>({
    name: '',
    theme: '',
    description: '',
    max_members: 6
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '联盟名称不能为空';
    } else if (formData.name.length < 3) {
      newErrors.name = '联盟名称至少需要3个字符';
    } else if (formData.name.length > 100) {
      newErrors.name = '联盟名称不能超过100个字符';
    }

    if (!formData.theme.trim()) {
      newErrors.theme = '探索主题不能为空';
    } else if (formData.theme.length < 5) {
      newErrors.theme = '探索主题至少需要5个字符';
    } else if (formData.theme.length > 200) {
      newErrors.theme = '探索主题不能超过200个字符';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = '描述不能超过1000个字符';
    }

    if (!formData.max_members || formData.max_members < 2 || formData.max_members > 20) {
      newErrors.max_members = '成员数量必须在2-20之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await AllianceAPI.createGuild(formData);

      if (response.success) {
        onSuccess();
        onClose();
        // 重置表单
        setFormData({
          name: '',
          theme: '',
          description: '',
          max_members: 6
        });
        setErrors({});
      } else {
        // 显示错误信息
        alert(response.error?.message || '创建联盟失败');
      }
    } catch (error) {
      console.error('创建联盟失败:', error);
      alert('创建联盟时发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateGuildRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="relative p-6 border-b border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">创建探索者联盟</h2>
                    <p className="text-purple-200 text-sm">开启你的探索之旅</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 表单内容 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 联盟名称 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Target className="w-4 h-4 inline mr-2" />
                  联盟名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-white/20 focus:border-purple-400 focus:ring-purple-400/50'
                  }`}
                  placeholder="为你的联盟起一个响亮的名字..."
                  maxLength={100}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-purple-300">
                  {formData.name.length}/100 字符
                </p>
              </div>

              {/* 探索主题 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  探索主题 *
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.theme 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-white/20 focus:border-purple-400 focus:ring-purple-400/50'
                  }`}
                  placeholder="描述你们要探索的领域或问题..."
                  maxLength={200}
                />
                {errors.theme && (
                  <p className="mt-1 text-sm text-red-400">{errors.theme}</p>
                )}
                <p className="mt-1 text-xs text-purple-300">
                  {formData.theme.length}/200 字符
                </p>
              </div>

              {/* 详细描述 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  详细描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                    errors.description 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-white/20 focus:border-purple-400 focus:ring-purple-400/50'
                  }`}
                  placeholder="详细描述你们的探索目标、方法或愿景..."
                  maxLength={1000}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-purple-300">
                  {(formData.description?.length || 0)}/1000 字符
                </p>
              </div>

              {/* 成员数量限制 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  成员数量限制
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={formData.max_members}
                    onChange={(e) => handleInputChange('max_members', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-white font-semibold min-w-[3rem] text-center">
                    {formData.max_members}
                  </span>
                </div>
                {errors.max_members && (
                  <p className="mt-1 text-sm text-red-400">{errors.max_members}</p>
                )}
                <p className="mt-1 text-xs text-purple-300">
                  建议选择 4-8 人，确保深度协作
                </p>
              </div>

              {/* 提交按钮 */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-white/20 rounded-lg text-white font-medium hover:bg-white/10 transition-colors duration-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      创建中...
                    </div>
                  ) : (
                    '创建联盟'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
