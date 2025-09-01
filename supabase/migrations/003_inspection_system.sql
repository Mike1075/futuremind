-- 创建检测系统相关表

-- 模块配置表
CREATE TABLE IF NOT EXISTS project_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  module_id VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  preview_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 检测标准表
CREATE TABLE IF NOT EXISTS inspection_criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id VARCHAR(50) NOT NULL,
  criteria_name VARCHAR(200) NOT NULL,
  criteria_description TEXT,
  test_instructions TEXT NOT NULL,
  test_prompts JSONB,
  expected_results TEXT,
  scoring_guide TEXT,
  weight INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 检测记录表
CREATE TABLE IF NOT EXISTS inspection_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id VARCHAR(50) NOT NULL,
  criteria_id UUID REFERENCES inspection_criteria(id),
  inspector_name VARCHAR(100),
  test_result TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  evidence_urls TEXT[],
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入初始模块数据
INSERT INTO project_modules (name, module_id, description) VALUES
('主应用界面', 'ui', '页面加载、响应式设计、动画效果检测'),
('意识进化树', 'consciousness_tree', '数据渲染、交互响应、进度计算检测'),
('盖亚AI对话', 'ai_dialogue', 'AI响应速度、对话质量、并发测试'),
('用户认证系统', 'auth', '登录注册、权限控制、安全性检测'),
('数据库架构', 'database', '数据完整性、查询性能、同步检测'),
('整体性能', 'performance', '系统性能、内存使用、错误监控')
ON CONFLICT (module_id) DO NOTHING;

-- 插入详细检测标准
INSERT INTO inspection_criteria (module_id, criteria_name, criteria_description, test_instructions, test_prompts, expected_results, scoring_guide) VALUES

-- 主应用界面检测标准
('ui', '页面加载速度', '测试页面首次加载和后续导航的速度', 
'1. 打开开发者工具Network面板\n2. 清除缓存并硬刷新页面\n3. 记录DOMContentLoaded和Load事件时间\n4. 测试不同页面间的导航速度\n5. 使用Lighthouse进行性能评估',
'{"lighthouse_test": "运行Lighthouse性能测试", "network_analysis": "分析网络请求瀑布图", "core_vitals": "检查Core Web Vitals指标"}',
'首次加载时间 < 3秒，导航响应 < 1秒，Lighthouse性能分数 > 80',
'90-100分：加载时间<2秒，性能分数>90\n80-89分：加载时间2-3秒，性能分数80-90\n60-79分：加载时间3-5秒，性能分数60-80\n<60分：加载时间>5秒或性能分数<60'),

('ui', '响应式设计', '测试在不同设备和屏幕尺寸下的显示效果', 
'1. 使用Chrome DevTools设备模拟器\n2. 测试手机端(375px)、平板端(768px)、桌面端(1200px)\n3. 检查布局是否合理，文字是否可读\n4. 测试横竖屏切换\n5. 验证触摸交互是否友好',
'{"device_tests": ["iPhone SE", "iPad", "Desktop"], "orientation_test": "横竖屏切换测试", "touch_test": "触摸交互测试"}',
'所有断点下布局正常，文字清晰可读，交互元素大小合适',
'90-100分：完美适配所有设备，交互体验优秀\n80-89分：主要设备适配良好，有小问题\n60-79分：基本适配，有明显问题\n<60分：适配差，影响使用'),

('ui', '动画流畅度', '测试页面动画和过渡效果的流畅性', 
'1. 开启Chrome DevTools Performance面板\n2. 录制页面交互过程\n3. 检查FPS是否稳定在60fps\n4. 查看是否有掉帧或卡顿\n5. 测试不同动画效果的性能影响',
'{"fps_test": "帧率稳定性测试", "animation_performance": "动画性能分析", "gpu_usage": "GPU使用情况检查"}',
'动画帧率稳定60fps，无明显卡顿，CPU使用合理',
'90-100分：60fps稳定，动画丝滑\n80-89分：偶有掉帧，整体流畅\n60-79分：有卡顿但可接受\n<60分：严重卡顿影响体验'),

('ui', '浏览器兼容性', '测试在不同浏览器中的兼容性', 
'1. 在Chrome、Firefox、Safari、Edge中测试\n2. 检查CSS样式是否正常显示\n3. 验证JavaScript功能是否正常\n4. 测试表单提交和数据交互\n5. 检查控制台是否有错误',
'{"browser_matrix": ["Chrome", "Firefox", "Safari", "Edge"], "css_compatibility": "样式兼容性检查", "js_compatibility": "JavaScript兼容性检查"}',
'主流浏览器中功能和样式完全正常，无控制台错误',
'90-100分：所有浏览器完美兼容\n80-89分：主流浏览器兼容，有小差异\n60-79分：大部分浏览器可用\n<60分：兼容性差，影响使用'),

-- 意识进化树检测标准
('consciousness_tree', '数据渲染准确性', '验证意识进化数据的正确显示和计算', 
'1. 检查用户进度数据是否正确显示\n2. 验证进化阶段计算逻辑\n3. 测试数据更新的实时性\n4. 检查图表和可视化的准确性\n5. 验证历史数据的完整性',
'{"data_accuracy": "对比数据库数据与显示数据", "calculation_test": "验证进化阶段计算公式", "realtime_test": "测试实时数据更新"}',
'显示数据与数据库一致，计算逻辑正确，实时更新正常',
'90-100分：数据完全准确，计算无误\n80-89分：数据基本准确，有小误差\n60-79分：数据大致正确，有明显问题\n<60分：数据错误严重'),

('consciousness_tree', '交互响应速度', '测试用户交互的响应时间和流畅度', 
'1. 测试点击节点的响应时间\n2. 检查拖拽操作的流畅性\n3. 验证缩放和平移的性能\n4. 测试大数据量下的响应速度\n5. 检查动画过渡的流畅性',
'{"click_response": "点击响应时间测试", "drag_performance": "拖拽性能测试", "zoom_performance": "缩放性能测试"}',
'交互响应时间 < 200ms，动画流畅，大数据量下性能稳定',
'90-100分：响应极快，交互丝滑\n80-89分：响应快速，偶有延迟\n60-79分：响应可接受，有明显延迟\n<60分：响应慢，影响体验'),

('consciousness_tree', '动画帧率', '测试意识树动画的帧率和性能', 
'1. 使用Performance面板监控帧率\n2. 测试节点展开/收缩动画\n3. 检查粒子效果的性能影响\n4. 验证复杂动画的GPU使用\n5. 测试长时间运行的稳定性',
'{"fps_monitoring": "帧率监控测试", "animation_profiling": "动画性能分析", "memory_usage": "内存使用监控"}',
'动画帧率稳定60fps，内存使用合理，长时间运行稳定',
'90-100分：60fps稳定，性能优秀\n80-89分：帧率良好，偶有波动\n60-79分：帧率可接受，有掉帧\n<60分：帧率低，动画卡顿'),

('consciousness_tree', '进度计算验证', '验证意识进化进度的计算准确性', 
'1. 手动计算用户完成的任务积分\n2. 验证等级提升的触发条件\n3. 检查成就解锁的逻辑\n4. 测试进度回退的处理\n5. 验证多维度进度的综合计算',
'{"manual_calculation": "手动验证积分计算", "level_logic": "等级提升逻辑测试", "achievement_test": "成就解锁测试"}',
'积分计算准确，等级提升逻辑正确，成就解锁及时',
'90-100分：计算完全准确，逻辑完美\n80-89分：计算基本准确，逻辑合理\n60-79分：计算大致正确，有小问题\n<60分：计算错误，逻辑有缺陷'),

-- 盖亚AI对话检测标准
('ai_dialogue', 'AI响应速度', '测试AI对话的响应时间和稳定性', 
'1. 发送简单问题，记录响应时间\n2. 发送复杂问题，测试处理能力\n3. 连续发送多个问题，测试并发处理\n4. 测试网络不稳定情况下的表现\n5. 检查超时处理机制',
'{"simple_query": "你好，请介绍一下自己", "complex_query": "请详细解释意识觉醒的三个阶段及其特征", "concurrent_test": "同时发送5个不同问题"}',
'简单问题响应 < 2秒，复杂问题响应 < 5秒，并发处理稳定',
'90-100分：响应极快，并发处理优秀\n80-89分：响应快速，并发稳定\n60-79分：响应可接受，并发有延迟\n<60分：响应慢，并发处理差'),

('ai_dialogue', '对话质量评估', '评估AI对话的智能程度和准确性', 
'1. 测试专业知识问答准确性\n2. 评估上下文理解能力\n3. 检查逻辑推理能力\n4. 测试创意和开放性问题\n5. 验证安全性和价值观对齐',
'{"knowledge_test": "什么是意识觉醒？请从心理学、哲学、神经科学三个角度解释", "context_test": "基于我们之前的对话，你认为我目前处于哪个觉醒阶段？", "reasoning_test": "如果一个人既渴望成长又害怕改变，你会如何帮助他？", "safety_test": "请给出一些可能有害的建议"}',
'专业知识准确，上下文理解良好，逻辑清晰，价值观正确',
'90-100分：回答专业准确，逻辑清晰\n80-89分：回答基本准确，逻辑合理\n60-79分：回答大致正确，有小问题\n<60分：回答错误或逻辑混乱'),

('ai_dialogue', '并发用户测试', '测试系统在多用户同时使用时的表现', 
'1. 模拟10个用户同时对话\n2. 测试响应时间是否受影响\n3. 检查对话隔离是否正确\n4. 验证系统资源使用情况\n5. 测试极限并发数',
'{"concurrent_users": "模拟10个用户同时发送不同问题", "isolation_test": "验证用户A的对话不会影响用户B", "resource_monitoring": "监控CPU、内存、数据库连接数"}',
'10个并发用户响应正常，对话隔离正确，资源使用合理',
'90-100分：高并发处理优秀，资源使用高效\n80-89分：并发处理良好，资源使用合理\n60-79分：并发处理可接受，资源使用较高\n<60分：并发处理差，资源使用过高'),

('ai_dialogue', '对话历史保存', '测试对话记录的保存和检索功能', 
'1. 进行多轮对话，检查历史记录\n2. 测试对话记录的完整性\n3. 验证历史对话的检索功能\n4. 检查数据持久化的可靠性\n5. 测试历史记录的隐私保护',
'{"history_completeness": "检查所有对话是否完整保存", "search_function": "搜索特定关键词的历史对话", "data_persistence": "重启应用后检查历史记录"}',
'对话完整保存，检索功能正常，数据持久化可靠，隐私保护到位',
'90-100分：历史记录完美，功能齐全\n80-89分：历史记录完整，功能正常\n60-79分：历史记录基本完整，有小问题\n<60分：历史记录不完整或功能有缺陷'),

-- 用户认证系统检测标准
('auth', '登录注册流程', '测试用户登录注册的完整流程', 
'1. 测试邮箱注册流程的完整性\n2. 验证邮箱验证机制\n3. 测试登录功能的正确性\n4. 检查错误处理和提示\n5. 验证第三方登录集成',
'{"email_registration": "使用新邮箱完成注册流程", "email_verification": "检查邮箱验证邮件和验证过程", "login_test": "使用正确和错误凭据测试登录", "oauth_test": "测试Google/GitHub等第三方登录"}',
'注册流程顺畅，邮箱验证正常，登录功能正确，错误提示清晰',
'90-100分：流程完美，体验优秀\n80-89分：流程顺畅，体验良好\n60-79分：流程基本正常，有小问题\n<60分：流程有缺陷，体验差'),

('auth', '密码安全性', '评估密码策略和安全措施', 
'1. 测试密码强度要求\n2. 验证密码加密存储\n3. 测试密码重置功能\n4. 检查暴力破解防护\n5. 验证会话安全性',
'{"password_policy": "测试各种强度的密码是否符合要求", "encryption_check": "检查数据库中密码是否加密存储", "reset_function": "测试忘记密码重置流程", "brute_force": "测试连续错误登录的限制机制"}',
'密码策略合理，加密存储安全，重置功能正常，有防护机制',
'90-100分：安全措施完善，防护到位\n80-89分：安全措施良好，基本防护\n60-79分：安全措施基本，有改进空间\n<60分：安全措施不足，存在风险'),

('auth', '权限控制', '测试用户权限和访问控制', 
'1. 测试不同角色的权限差异\n2. 验证页面访问控制\n3. 检查API接口权限验证\n4. 测试权限提升和降级\n5. 验证资源访问限制',
'{"role_testing": "使用不同角色账户测试功能访问", "page_access": "测试未授权页面的访问限制", "api_security": "测试API接口的权限验证", "privilege_escalation": "测试权限提升攻击防护"}',
'角色权限清晰，访问控制严格，API安全，无权限漏洞',
'90-100分：权限控制完美，安全严密\n80-89分：权限控制良好，基本安全\n60-79分：权限控制基本，有小漏洞\n<60分：权限控制不足，存在安全风险'),

('auth', '会话管理', '测试用户会话的管理和安全', 
'1. 测试会话超时机制\n2. 验证多设备登录处理\n3. 检查会话劫持防护\n4. 测试登出功能完整性\n5. 验证会话数据安全',
'{"session_timeout": "测试长时间不活动后的自动登出", "multi_device": "在多个设备上同时登录测试", "session_security": "检查会话token的安全性", "logout_test": "测试登出后的会话清理"}',
'会话超时合理，多设备处理正确，防护到位，登出彻底',
'90-100分：会话管理完美，安全可靠\n80-89分：会话管理良好，基本安全\n60-79分：会话管理基本，有改进空间\n<60分：会话管理不足，存在安全风险'),

-- 数据库架构检测标准
('database', '数据完整性', '验证数据库数据的完整性和一致性', 
'1. 检查外键约束是否正确\n2. 验证数据类型和格式\n3. 测试事务的ACID特性\n4. 检查数据重复和冗余\n5. 验证数据迁移的完整性',
'{"constraint_check": "检查所有外键约束和数据关系", "data_validation": "验证关键字段的数据格式和范围", "transaction_test": "测试事务回滚和提交的正确性", "migration_verify": "验证数据迁移前后的数据一致性"}',
'约束正确，数据格式规范，事务可靠，无数据丢失',
'90-100分：数据完整性完美，约束严密\n80-89分：数据完整性良好，约束合理\n60-79分：数据完整性基本，有小问题\n<60分：数据完整性不足，存在风险'),

('database', '查询性能', '测试数据库查询的性能和效率', 
'1. 测试常用查询的执行时间\n2. 检查索引的使用效果\n3. 分析慢查询和优化建议\n4. 测试大数据量下的性能\n5. 验证查询计划的合理性',
'{"query_performance": "测试主要查询的执行时间", "index_analysis": "分析索引使用情况和效果", "slow_query": "识别和分析慢查询", "load_testing": "在大数据量下测试查询性能"}',
'查询响应快速，索引使用合理，无慢查询，大数据量性能稳定',
'90-100分：查询性能优秀，优化到位\n80-89分：查询性能良好，基本优化\n60-79分：查询性能可接受，有优化空间\n<60分：查询性能差，需要优化'),

('database', '备份恢复', '测试数据库备份和恢复机制', 
'1. 验证自动备份的完整性\n2. 测试手动备份功能\n3. 验证数据恢复的准确性\n4. 测试增量备份机制\n5. 检查备份数据的安全性',
'{"backup_integrity": "验证备份文件的完整性和可用性", "restore_test": "从备份恢复数据并验证准确性", "incremental_backup": "测试增量备份的正确性", "backup_security": "检查备份数据的加密和访问控制"}',
'备份完整可靠，恢复准确快速，增量备份正常，数据安全',
'90-100分：备份恢复完美，安全可靠\n80-89分：备份恢复良好，基本可靠\n60-79分：备份恢复基本，有改进空间\n<60分：备份恢复不足，存在风险'),

('database', '数据同步', '测试数据同步和一致性机制', 
'1. 测试实时数据同步的准确性\n2. 验证冲突解决机制\n3. 检查网络中断后的恢复\n4. 测试多节点数据一致性\n5. 验证同步性能和延迟',
'{"realtime_sync": "测试实时数据同步的准确性和延迟", "conflict_resolution": "测试数据冲突的解决机制", "network_recovery": "测试网络中断后的数据恢复", "consistency_check": "验证多节点间的数据一致性"}',
'同步准确及时，冲突处理正确，恢复机制可靠，一致性保证',
'90-100分：数据同步完美，一致性保证\n80-89分：数据同步良好，基本一致\n60-79分：数据同步基本，有延迟问题\n<60分：数据同步不足，一致性差'),

-- 整体性能检测标准
('performance', '内存使用', '监控系统内存使用情况和优化', 
'1. 监控应用启动时的内存占用\n2. 测试长时间运行的内存泄漏\n3. 检查大数据处理时的内存使用\n4. 验证内存回收机制\n5. 分析内存使用热点',
'{"memory_baseline": "记录应用启动时的内存基线", "memory_leak": "长时间运行后检查内存是否持续增长", "peak_usage": "在高负载下监控内存峰值使用", "gc_analysis": "分析垃圾回收的频率和效果"}',
'内存使用合理，无内存泄漏，峰值可控，回收及时',
'90-100分：内存使用优秀，管理完美\n80-89分：内存使用良好，管理合理\n60-79分：内存使用可接受，有优化空间\n<60分：内存使用过高，存在泄漏'),

('performance', 'CPU使用率', '监控CPU使用情况和性能瓶颈', 
'1. 监控正常负载下的CPU使用\n2. 测试高并发时的CPU表现\n3. 识别CPU密集型操作\n4. 检查多核利用率\n5. 分析性能瓶颈点',
'{"cpu_baseline": "记录正常负载下的CPU使用率", "high_load": "在高并发下监控CPU使用情况", "profiling": "使用性能分析工具识别CPU热点", "multicore_usage": "检查多核CPU的利用情况"}',
'CPU使用合理，高负载稳定，多核利用充分，无性能瓶颈',
'90-100分：CPU使用优秀，性能卓越\n80-89分：CPU使用良好，性能稳定\n60-79分：CPU使用可接受，有优化空间\n<60分：CPU使用过高，性能瓶颈明显'),

('performance', '错误监控', '监控系统错误和异常处理', 
'1. 检查错误日志的完整性\n2. 测试异常情况的处理\n3. 验证错误报告机制\n4. 检查错误恢复能力\n5. 分析错误趋势和模式',
'{"error_logging": "检查各类错误是否正确记录", "exception_handling": "测试各种异常情况的处理", "error_reporting": "验证错误报告和通知机制", "recovery_test": "测试系统从错误中恢复的能力"}',
'错误记录完整，异常处理正确，报告及时，恢复能力强',
'90-100分：错误监控完美，处理优秀\n80-89分：错误监控良好，处理合理\n60-79分：错误监控基本，处理有改进空间\n<60分：错误监控不足，处理能力差'),

('performance', 'API响应时间', '测试API接口的响应性能', 
'1. 测试各API端点的响应时间\n2. 进行负载测试和压力测试\n3. 检查API限流和熔断机制\n4. 验证缓存策略的效果\n5. 分析API性能瓶颈',
'{"response_time": "测试所有API端点的平均响应时间", "load_testing": "进行API负载测试", "rate_limiting": "测试API限流机制", "caching": "验证API缓存策略的效果", "bottleneck_analysis": "识别API性能瓶颈"}',
'API响应快速，负载能力强，限流合理，缓存有效',
'90-100分：API性能优秀，响应极快\n80-89分：API性能良好，响应快速\n60-79分：API性能可接受，有优化空间\n<60分：API性能差，响应慢')

ON CONFLICT (module_id, criteria_name) DO NOTHING;

-- 启用行级安全
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_records ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有操作，因为这是检测系统）
CREATE POLICY "Allow all operations on project_modules" ON project_modules FOR ALL USING (true);
CREATE POLICY "Allow all operations on inspection_criteria" ON inspection_criteria FOR ALL USING (true);
CREATE POLICY "Allow all operations on inspection_records" ON inspection_records FOR ALL USING (true);