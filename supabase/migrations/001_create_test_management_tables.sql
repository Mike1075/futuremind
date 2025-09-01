-- 创建测试管理相关表

-- 1. 项目模块表
CREATE TABLE IF NOT EXISTS project_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    preview_url TEXT,
    status VARCHAR(50) DEFAULT 'development',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 测试用例表
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES project_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    test_type VARCHAR(50) NOT NULL, -- 'functional', 'ui', 'integration', 'performance'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    expected_result TEXT,
    test_steps JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 测试记录表
CREATE TABLE IF NOT EXISTS test_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    tester_name VARCHAR(255),
    test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL, -- 'passed', 'failed', 'blocked', 'skipped'
    actual_result TEXT,
    notes TEXT,
    screenshots JSONB, -- 存储截图URL数组
    execution_time INTEGER, -- 执行时间（秒）
    browser_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 预览链接表
CREATE TABLE IF NOT EXISTS preview_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES project_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    environment VARCHAR(50) DEFAULT 'development', -- 'development', 'staging', 'production'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 测试报告表
CREATE TABLE IF NOT EXISTS test_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES project_modules(id) ON DELETE CASCADE,
    report_date DATE DEFAULT CURRENT_DATE,
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    blocked_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    pass_rate DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入初始项目模块数据
INSERT INTO project_modules (name, description, status) VALUES
('主应用界面', '包含主页、登录页、仪表板等核心界面', 'development'),
('意识进化树', '可视化用户成长轨迹的交互组件', 'development'),
('盖亚AI对话', 'AI导师对话系统', 'development'),
('检查仪表板', '项目管理和监控仪表板', 'development'),
('用户认证系统', '用户登录、注册、权限管理', 'planning'),
('主线剧情系统', '第一季：声音的交响剧情内容', 'planning'),
('PBL协作系统', '项目协作和团队管理功能', 'planning');

-- 为主要模块插入测试用例
INSERT INTO test_cases (module_id, title, description, test_type, priority, expected_result, test_steps) 
SELECT 
    pm.id,
    '页面加载测试',
    '验证页面能够正常加载并显示所有元素',
    'functional',
    'high',
    '页面在3秒内完全加载，所有元素正确显示',
    '[
        {"step": 1, "action": "打开浏览器", "expected": "浏览器正常启动"},
        {"step": 2, "action": "访问页面URL", "expected": "页面开始加载"},
        {"step": 3, "action": "等待页面加载完成", "expected": "所有元素显示正常"},
        {"step": 4, "action": "检查控制台错误", "expected": "无JavaScript错误"}
    ]'::jsonb
FROM project_modules pm 
WHERE pm.name IN ('主应用界面', '意识进化树', '盖亚AI对话', '检查仪表板');

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_modules_updated_at BEFORE UPDATE ON project_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON test_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preview_links_updated_at BEFORE UPDATE ON preview_links FOR EACH ROW EXECUTE FUNCTION update_preview_links_updated_at_column();

-- 启用行级安全策略
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;

-- 创建公共访问策略（开发阶段）
CREATE POLICY "Allow all operations" ON project_modules FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON test_cases FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON test_records FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON preview_links FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON test_reports FOR ALL USING (true);