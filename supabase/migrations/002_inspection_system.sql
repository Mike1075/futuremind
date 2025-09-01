-- 项目模块表
CREATE TABLE IF NOT EXISTS project_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preview_url TEXT,
    repository_url TEXT,
    module_type VARCHAR(50) NOT NULL, -- 'ui', 'consciousness_tree', 'ai_dialogue', 'auth', 'database', 'performance'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'testing', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 检测标准表
CREATE TABLE IF NOT EXISTS inspection_criteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_type VARCHAR(50) NOT NULL,
    criteria_name VARCHAR(100) NOT NULL,
    criteria_description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0, -- 权重
    pass_threshold DECIMAL(5,2) DEFAULT 80.0, -- 及格分数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 检测记录表
CREATE TABLE IF NOT EXISTS inspection_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES project_modules(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES auth.users(id),
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overall_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 检测结果详情表
CREATE TABLE IF NOT EXISTS inspection_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID REFERENCES inspection_records(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES inspection_criteria(id),
    score DECIMAL(5,2) NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    evidence_url TEXT, -- 截图或证据链接
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认检测标准
INSERT INTO inspection_criteria (module_type, criteria_name, criteria_description, weight, pass_threshold) VALUES
-- 主应用界面标准
('ui', '页面加载速度', '首次加载时间应小于3秒', 1.0, 80.0),
('ui', '响应式设计', '在不同设备上正常显示', 1.0, 85.0),
('ui', '动画流畅度', '动画帧率应大于60FPS', 0.8, 75.0),
('ui', '浏览器兼容性', '主流浏览器兼容性测试', 0.9, 80.0),

-- 意识进化树标准
('consciousness_tree', '数据渲染准确性', '数据显示100%准确', 1.2, 95.0),
('consciousness_tree', '交互响应速度', '点击响应时间小于100ms', 1.0, 80.0),
('consciousness_tree', '动画帧率', '树形动画流畅度', 0.8, 75.0),
('consciousness_tree', '进度计算验证', '进度计算逻辑正确', 1.1, 90.0),

-- 盖亚AI对话标准
('ai_dialogue', 'AI响应速度', 'AI回复时间小于2秒', 1.2, 85.0),
('ai_dialogue', '对话质量评估', '回复内容相关性和准确性', 1.3, 80.0),
('ai_dialogue', '并发用户测试', '多用户同时使用稳定性', 1.0, 75.0),
('ai_dialogue', '对话历史保存', '对话记录正确保存和加载', 0.9, 85.0),

-- 用户认证系统标准
('auth', '登录注册流程', '用户注册登录功能正常', 1.2, 95.0),
('auth', '密码安全性', '密码加密和安全策略', 1.3, 90.0),
('auth', '权限控制', '用户权限控制准确', 1.2, 95.0),
('auth', '会话管理', '用户会话安全管理', 1.0, 85.0),

-- 数据库架构标准
('database', '数据完整性', '数据约束和完整性检查', 1.3, 95.0),
('database', '查询性能', '数据库查询响应时间', 1.2, 80.0),
('database', '备份恢复', '数据备份和恢复机制', 1.0, 85.0),
('database', '数据同步', '数据同步准确性', 1.1, 80.0),

-- 整体性能标准
('performance', '内存使用', '系统内存使用优化', 1.0, 80.0),
('performance', 'CPU使用率', 'CPU使用率控制', 1.0, 75.0),
('performance', '错误监控', '错误处理和监控', 1.1, 85.0),
('performance', 'API响应时间', 'API接口响应速度', 1.2, 80.0);

-- 插入默认模块
INSERT INTO project_modules (name, description, module_type, status) VALUES
('主应用界面', '用户界面和交互体验', 'ui', 'pending'),
('意识进化树', '用户成长进度可视化', 'consciousness_tree', 'pending'),
('盖亚AI对话', 'AI智能对话系统', 'ai_dialogue', 'pending'),
('用户认证系统', '用户登录注册和权限管理', 'auth', 'pending'),
('数据库架构', '数据存储和管理系统', 'database', 'pending'),
('整体性能', '系统性能和稳定性', 'performance', 'pending');

-- 启用行级安全
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_results ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Anyone can view modules" ON project_modules FOR SELECT USING (true);
CREATE POLICY "Anyone can view criteria" ON inspection_criteria FOR SELECT USING (true);
CREATE POLICY "Users can view their own records" ON inspection_records FOR SELECT USING (auth.uid() = inspector_id);
CREATE POLICY "Users can insert their own records" ON inspection_records FOR INSERT WITH CHECK (auth.uid() = inspector_id);
CREATE POLICY "Users can update their own records" ON inspection_records FOR UPDATE USING (auth.uid() = inspector_id);
CREATE POLICY "Users can view results for their records" ON inspection_results FOR SELECT USING (
    EXISTS (SELECT 1 FROM inspection_records WHERE id = record_id AND inspector_id = auth.uid())
);
CREATE POLICY "Users can insert results for their records" ON inspection_results FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM inspection_records WHERE id = record_id AND inspector_id = auth.uid())
);