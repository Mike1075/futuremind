-- 创建项目加入申请表
CREATE TABLE IF NOT EXISTS project_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 防止重复申请（同一用户对同一项目只能有一个待处理申请）
  UNIQUE(project_id, user_id)
);

-- 创建组织加入申请表
CREATE TABLE IF NOT EXISTS organization_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 防止重复申请
  UNIQUE(organization_id, user_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_project_join_requests_project_id ON project_join_requests(project_id);
CREATE INDEX idx_project_join_requests_user_id ON project_join_requests(user_id);
CREATE INDEX idx_project_join_requests_status ON project_join_requests(status);

CREATE INDEX idx_organization_join_requests_org_id ON organization_join_requests(organization_id);
CREATE INDEX idx_organization_join_requests_user_id ON organization_join_requests(user_id);
CREATE INDEX idx_organization_join_requests_status ON organization_join_requests(status);

-- 启用 RLS
ALTER TABLE project_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_join_requests ENABLE ROW LEVEL SECURITY;

-- 项目加入申请的 RLS 策略
-- 1. 申请者可以查看自己的申请
CREATE POLICY "Users can view their own project join requests"
  ON project_join_requests FOR SELECT
  USING (auth.uid() = user_id);

-- 2. 项目管理员可以查看该项目的所有申请
CREATE POLICY "Project managers can view all join requests for their projects"
  ON project_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_join_requests.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role_in_project = 'manager'
    )
  );

-- 3. 任何登录用户可以创建项目加入申请
CREATE POLICY "Authenticated users can create project join requests"
  ON project_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 4. 项目管理员可以更新申请状态
CREATE POLICY "Project managers can update join requests"
  ON project_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_join_requests.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role_in_project = 'manager'
    )
  );

-- 组织加入申请的 RLS 策略
-- 1. 申请者可以查看自己的申请
CREATE POLICY "Users can view their own organization join requests"
  ON organization_join_requests FOR SELECT
  USING (auth.uid() = user_id);

-- 2. 组织管理员可以查看该组织的所有申请
CREATE POLICY "Organization admins can view all join requests for their orgs"
  ON organization_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organization_join_requests.organization_id
        AND user_organizations.user_id = auth.uid()
        AND user_organizations.role_in_org IN ('admin', 'owner')
    )
  );

-- 3. 任何登录用户可以创建组织加入申请
CREATE POLICY "Authenticated users can create organization join requests"
  ON organization_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 4. 组织管理员可以更新申请状态
CREATE POLICY "Organization admins can update join requests"
  ON organization_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organization_join_requests.organization_id
        AND user_organizations.user_id = auth.uid()
        AND user_organizations.role_in_org IN ('admin', 'owner')
    )
  );

-- 创建触发器以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_join_requests_updated_at
  BEFORE UPDATE ON project_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_join_requests_updated_at
  BEFORE UPDATE ON organization_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
