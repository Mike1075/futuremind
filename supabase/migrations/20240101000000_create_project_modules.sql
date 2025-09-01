-- Create project_modules table for inspection system
CREATE TABLE IF NOT EXISTS project_modules (
  id SERIAL PRIMARY KEY,
  module_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  preview_url TEXT,
  repository_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default modules
INSERT INTO project_modules (module_id, name, description, status) VALUES
  ('ui', '主应用界面', '用户界面和交互设计', 'pending'),
  ('consciousness_tree', '意识进化树', '意识发展可视化系统', 'pending'),
  ('ai_dialogue', 'Gaia AI对话', 'AI智能对话系统', 'pending'),
  ('auth', '用户认证系统', '登录注册和权限管理', 'pending'),
  ('database', '数据库架构', '数据存储和管理系统', 'pending'),
  ('performance', '整体性能', '系统性能和优化', 'pending')
ON CONFLICT (module_id) DO NOTHING;

-- Enable RLS
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is for inspection)
CREATE POLICY "Allow all operations on project_modules" ON project_modules
  FOR ALL USING (true);