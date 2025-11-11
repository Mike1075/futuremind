# AIP项目迁移实施计划

## 📋 项目概述

### 目标
将现有的AIP (AI-Powered Project Management) 系统完整迁移到FutureMind网站，替换当前的"探索者联盟"页面，保留所有核心功能并适配现有的认证系统和UI风格。

### 源项目信息
- **源代码位置**: `D:\CursorWork\FutureMindInstitute\readme\N8NAIP\shareplatform n8n`
- **数据库Schema**: `D:\CursorWork\FutureMindInstitute\readme\N8NAIP\aip_table_schema.json`
- **技术栈**: React 18 + TypeScript + Vite
- **架构**: 3-tier AI system (Organization AI, Project AI, Member AI)

### 目标系统信息
- **技术栈**: Next.js 15 + React + TypeScript
- **认证系统**: Supabase Auth
- **UI风格**: 黑色主题，蓝紫粉渐变色
- **数据库**: Supabase PostgreSQL with pgvector

---

## 🎯 核心需求

### 1. 页面替换
- ✅ 完全替换 `components/pbl/ExplorerAlliance.tsx`
- ✅ 保留伊卡洛斯项目和小探险家项目在课程系统中
- ✅ "探索者联盟"入口点击后进入全新的AIP界面

### 2. 默认组织系统
- **社区项目** (Community Projects): 展示其他用户发起的公开项目
- **我的项目** (My Projects): 用户参与和发起的所有项目
- **权限控制**:
  - 普通用户: 只能看到这两个默认组织
  - 管理员 (teacher/principal): 可以创建新组织

### 3. n8n聊天集成
- **Webhook URL**: `https://n8n.aifunbox.com/webhook-test/fd6b2fff-af4c-4013-8fb6-ada231750a5a`
- **位置**: 右下角浮动聊天机器人
- **请求格式**:
```json
{
  "chatInput": "用户输入的消息",
  "user_id": "uuid",
  "project_id": ["uuid1", "uuid2", "uuid3"],
  "organization_id": "uuid"
}
```

### 4. 不迁移内容
- ❌ 原AIP的登录系统 (使用现有Supabase Auth)
- ❌ 原AIP的UI主题配色 (使用FutureMind黑色主题)

---

## 🗄️ 数据库迁移计划

### 阶段1: 关键冲突解决

#### 问题: AIP的users表与auth.users冲突
**解决方案**: 使用`user_organizations`表来管理用户-组织关系，所有外键指向`auth.users`

#### 修改策略
1. **不创建** public.users表
2. **使用** auth.users 作为用户主表
3. **所有外键** 从 `public.users.id` 改为 `auth.users.id`
4. **profiles表** 使用现有的profiles表或与AIP的profiles合并

### 阶段2: 表创建顺序

#### 2.1 基础表 (无外键依赖)
```sql
-- 1. organizations 组织表
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 为所有用户创建默认组织的触发器
-- 这将在用户注册时自动创建"社区项目"和"我的项目"
```

#### 2.2 用户关系表
```sql
-- 3. user_organizations 用户-组织关系表
CREATE TABLE IF NOT EXISTS public.user_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_in_org TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
```

#### 2.3 项目相关表
```sql
-- 4. projects 项目表
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  is_public BOOLEAN DEFAULT false,
  is_recruiting BOOLEAN DEFAULT false,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. project_members 项目成员表
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_in_project VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- 6. tasks 任务表
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_ai BOOLEAN DEFAULT false,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  due_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.4 文档和知识库表
```sql
-- 7. documents 文档表 (需要pgvector扩展)
-- 先启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),  -- OpenAI embedding维度
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建向量索引
CREATE INDEX IF NOT EXISTS idx_documents_embedding
ON public.documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### 2.5 聊天和通知表
```sql
-- 8. chat_history 聊天记录表
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
  agent_type VARCHAR(50) NOT NULL,  -- 'organization', 'project', 'member'
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  ai_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. notifications 通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

#### 2.6 邀请和加入请求表
```sql
-- 10. invitations 邀请表
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_type TEXT NOT NULL,  -- 'project' or 'organization'
  target_id UUID NOT NULL,  -- project_id or organization_id
  target_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  responded_at TIMESTAMPTZ,
  response_message TEXT
);

-- 11. project_join_requests 项目加入请求表
CREATE TABLE IF NOT EXISTS public.project_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  UNIQUE(project_id, user_id)
);

-- 12. organization_join_requests 组织加入请求表
CREATE TABLE IF NOT EXISTS public.organization_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, organization_id, status)
);
```

#### 2.7 辅助表
```sql
-- 13. daily_processing_queue 日常处理队列
CREATE TABLE IF NOT EXISTS public.daily_processing_queue (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  organization_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  batch_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, project_id, user_id, batch_date)
);
```

### 阶段3: 索引创建

```sql
-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);

-- User Organizations
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON public.user_organizations(organization_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_creator_id ON public.projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Project Members
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON public.documents(organization_id);

-- Chat History
CREATE INDEX IF NOT EXISTS idx_chat_history_project_id ON public.chat_history(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Invitations
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON public.invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON public.invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_type_target ON public.invitations(invitation_type, target_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_created_at ON public.invitations(created_at DESC);
```

### 阶段4: RLS (Row Level Security) 策略

```sql
-- 启用RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_join_requests ENABLE ROW LEVEL SECURITY;

-- Organizations: 用户可以查看自己加入的组织
CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM public.user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Organizations: 管理员可以创建组织
CREATE POLICY "Admins can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'principal')
  )
);

-- Projects: 用户可以查看公开项目或自己组织的项目
CREATE POLICY "Users can view accessible projects"
ON public.projects FOR SELECT
USING (
  is_public = true
  OR organization_id IN (
    SELECT organization_id FROM public.user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Projects: 用户可以在自己的组织中创建项目
CREATE POLICY "Users can create projects in their organizations"
ON public.projects FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Tasks: 项目成员可以查看任务
CREATE POLICY "Project members can view tasks"
ON public.tasks FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM public.project_members
    WHERE user_id = auth.uid()
  )
);

-- Notifications: 用户只能查看自己的通知
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

-- Chat History: 用户可以查看自己的聊天记录
CREATE POLICY "Users can view their own chat history"
ON public.chat_history FOR SELECT
USING (user_id = auth.uid());
```

### 阶段5: 触发器和函数

```sql
-- 更新 updated_at 时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加updated_at触发器
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 用户注册时自动创建默认组织的触发器
CREATE OR REPLACE FUNCTION create_default_organizations_for_user()
RETURNS TRIGGER AS $$
DECLARE
  community_org_id UUID;
  personal_org_id UUID;
BEGIN
  -- 检查是否已存在全局社区项目组织
  SELECT id INTO community_org_id
  FROM public.organizations
  WHERE name = '社区项目' AND settings->>'is_global' = 'true'
  LIMIT 1;

  -- 如果不存在，创建全局社区项目组织
  IF community_org_id IS NULL THEN
    INSERT INTO public.organizations (name, description, settings)
    VALUES (
      '社区项目',
      '所有用户共享的社区项目空间',
      '{"is_global": true, "is_system": true}'::jsonb
    )
    RETURNING id INTO community_org_id;
  END IF;

  -- 为新用户创建个人项目组织
  INSERT INTO public.organizations (name, description, settings)
  VALUES (
    '我的项目',
    '个人项目空间',
    jsonb_build_object('user_id', NEW.id, 'is_personal', true, 'is_system', true)
  )
  RETURNING id INTO personal_org_id;

  -- 将用户添加到社区项目组织
  INSERT INTO public.user_organizations (user_id, organization_id, role_in_org)
  VALUES (NEW.id, community_org_id, 'member');

  -- 将用户添加到个人项目组织（作为owner）
  INSERT INTO public.user_organizations (user_id, organization_id, role_in_org)
  VALUES (NEW.id, personal_org_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在profiles表上创建触发器（假设用户注册时会创建profile）
CREATE TRIGGER on_user_created_create_default_orgs
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_organizations_for_user();
```

---

## 🎨 前端迁移计划

### 第一步: 项目结构

```
app/
  explorer-alliance/
    page.tsx                    # 主页面 (替换原ExplorerAlliance)
    organizations/
      [orgId]/
        page.tsx               # 组织详情页
        projects/
          [projectId]/
            page.tsx           # 项目详情页
            tasks/
              page.tsx         # 任务列表页

components/
  aip/
    OrganizationList.tsx       # 组织列表
    ProjectList.tsx            # 项目列表
    ProjectCard.tsx            # 项目卡片
    ProjectDetail.tsx          # 项目详情
    TaskList.tsx               # 任务列表
    TaskCard.tsx               # 任务卡片
    DocumentViewer.tsx         # 文档查看器
    ChatBot.tsx                # n8n聊天机器人
    MemberList.tsx             # 成员列表
    InvitationModal.tsx        # 邀请弹窗

lib/
  aip/
    api.ts                     # API调用函数
    types.ts                   # TypeScript类型定义
    hooks.ts                   # React Hooks
    utils.ts                   # 工具函数
```

### 第二步: 核心组件实现

#### 2.1 主页面组件
```typescript
// app/explorer-alliance/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { OrganizationList } from '@/components/aip/OrganizationList'
import { ProjectList } from '@/components/aip/ProjectList'
import { ChatBot } from '@/components/aip/ChatBot'
import { useOrganizations } from '@/lib/aip/hooks'

export default function ExplorerAlliancePage() {
  const { organizations, loading } = useOrganizations()
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-black">
      {/* 组织选择 */}
      <OrganizationList
        organizations={organizations}
        selectedId={selectedOrgId}
        onSelect={setSelectedOrgId}
      />

      {/* 项目列表 */}
      {selectedOrgId && (
        <ProjectList organizationId={selectedOrgId} />
      )}

      {/* 聊天机器人 */}
      <ChatBot />
    </div>
  )
}
```

#### 2.2 聊天机器人组件
```typescript
// components/aip/ChatBot.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBot() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || !user) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/aip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: input,
          user_id: user.id,
          project_id: [], // 从当前上下文获取
          organization_id: '' // 从当前上下文获取
        })
      })

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 聊天机器人UI实现 */}
    </div>
  )
}
```

### 第三步: API路由

#### 3.1 聊天API
```typescript
// app/api/aip/chat/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { chatInput, project_id, organization_id } = body

  try {
    // 调用n8n webhook
    const response = await fetch(
      'https://n8n.aifunbox.com/webhook-test/fd6b2fff-af4c-4013-8fb6-ada231750a5a',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput,
          user_id: user.id,
          project_id: project_id || [],
          organization_id: organization_id || ''
        })
      }
    )

    const data = await response.json()

    // 保存聊天记录
    await supabase.from('chat_history').insert({
      user_id: user.id,
      content: chatInput,
      role: 'user',
      agent_type: 'member',
      project_id: project_id?.[0] || null,
      ai_content: data.response
    })

    return NextResponse.json({ response: data.response })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}
```

### 第四步: UI风格适配

#### 4.1 颜色变量
```css
/* 在globals.css或tailwind.config.ts中定义 */
--aip-bg-primary: #000000;
--aip-bg-secondary: #0a0a0a;
--aip-text-primary: #ffffff;
--aip-text-secondary: #a0a0a0;
--aip-accent-blue: #3b82f6;
--aip-accent-purple: #a855f7;
--aip-accent-pink: #ec4899;
--aip-gradient: linear-gradient(135deg, #3b82f6 0%, #a855f7 50%, #ec4899 100%);
```

#### 4.2 组件样式模式
```tsx
// 卡片组件样式模板
<div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6
  hover:border-purple-500/50 transition-all duration-300
  hover:shadow-lg hover:shadow-purple-500/20">
  {/* 内容 */}
</div>

// 按钮样式模板
<button className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
  text-white font-medium rounded-lg
  hover:opacity-90 transition-opacity duration-200">
  {/* 按钮文本 */}
</button>

// 输入框样式模板
<input className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2
  text-white placeholder-gray-500
  focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20
  transition-all duration-200" />
```

---

## 🔐 权限系统实现

### 角色定义
- **student**: 学生（普通用户）
- **teacher**: 教师（可创建组织）
- **principal**: 校长（可创建组织，最高权限）

### 权限检查函数
```typescript
// lib/aip/permissions.ts
import { createClient } from '@/lib/supabase/client'

export async function isAdmin(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'teacher' || profile?.role === 'principal'
}

export async function canCreateOrganization(): Promise<boolean> {
  return await isAdmin()
}

export async function canManageProject(projectId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  // 检查是否是项目创建者或组织管理员
  const { data: project } = await supabase
    .from('projects')
    .select('creator_id, organization_id')
    .eq('id', projectId)
    .single()

  if (project?.creator_id === user.id) return true

  // 检查组织角色
  const { data: orgMembership } = await supabase
    .from('user_organizations')
    .select('role_in_org')
    .eq('user_id', user.id)
    .eq('organization_id', project?.organization_id)
    .single()

  return orgMembership?.role_in_org === 'admin' || orgMembership?.role_in_org === 'owner'
}
```

---

## ✅ 实施检查清单

### 数据库阶段
- [ ] 启用pgvector扩展
- [ ] 创建organizations表
- [ ] 创建user_organizations表
- [ ] 创建projects表
- [ ] 创建project_members表
- [ ] 创建tasks表
- [ ] 创建documents表（带vector字段）
- [ ] 创建chat_history表
- [ ] 创建notifications表
- [ ] 创建invitations表
- [ ] 创建project_join_requests表
- [ ] 创建organization_join_requests表
- [ ] 创建daily_processing_queue表
- [ ] 创建所有索引
- [ ] 配置所有RLS策略
- [ ] 创建触发器和函数
- [ ] 测试用户注册时默认组织创建

### 前端开发阶段
- [ ] 创建目录结构
- [ ] 实现OrganizationList组件
- [ ] 实现ProjectList组件
- [ ] 实现ProjectCard组件
- [ ] 实现ProjectDetail组件
- [ ] 实现TaskList组件
- [ ] 实现TaskCard组件
- [ ] 实现ChatBot组件
- [ ] 实现DocumentViewer组件
- [ ] 实现MemberList组件
- [ ] 实现InvitationModal组件

### API开发阶段
- [ ] /api/aip/organizations (CRUD)
- [ ] /api/aip/projects (CRUD)
- [ ] /api/aip/tasks (CRUD)
- [ ] /api/aip/documents (CRUD + vector search)
- [ ] /api/aip/chat (n8n webhook集成)
- [ ] /api/aip/invitations (CRUD)
- [ ] /api/aip/members (CRUD)
- [ ] /api/aip/notifications (查询、标记已读)

### 权限系统阶段
- [ ] 实现权限检查函数
- [ ] 组织创建权限控制
- [ ] 项目管理权限控制
- [ ] 任务分配权限控制
- [ ] 文档访问权限控制

### 测试阶段
- [ ] 测试用户注册流程（默认组织创建）
- [ ] 测试普通用户视图（只看到2个默认组织）
- [ ] 测试管理员创建新组织
- [ ] 测试项目创建和管理
- [ ] 测试任务创建和分配
- [ ] 测试文档上传和搜索
- [ ] 测试n8n聊天集成
- [ ] 测试邀请系统
- [ ] 测试加入请求流程
- [ ] 测试通知系统

### UI适配阶段
- [ ] 确认所有组件使用黑色主题
- [ ] 确认所有按钮使用渐变色
- [ ] 确认所有卡片样式统一
- [ ] 确认响应式布局
- [ ] 确认动画和过渡效果

### 集成测试阶段
- [ ] 端到端测试完整用户流程
- [ ] 性能测试（大量项目/任务）
- [ ] 并发测试
- [ ] 错误处理测试

---

## 🚀 部署计划

### 阶段1: 数据库部署
1. 在Supabase控制台执行所有数据库迁移脚本
2. 验证表创建成功
3. 验证RLS策略生效
4. 验证触发器工作正常

### 阶段2: 代码部署
1. 提交所有前端代码到Git
2. 运行构建测试
3. 部署到测试环境
4. 功能验收测试

### 阶段3: 正式发布
1. 数据备份
2. 部署到生产环境
3. 监控错误日志
4. 用户反馈收集

---

## 📝 注意事项

### 关键点
1. **不创建public.users表**: 所有用户数据使用auth.users
2. **外键必须指向auth.users**: 所有user_id外键都是auth.users(id)
3. **默认组织**: 每个用户注册时自动创建2个组织
4. **权限控制**: 严格区分普通用户和管理员权限
5. **向量搜索**: 确保pgvector扩展已启用

### 风险点
1. **数据迁移风险**: 确保所有外键约束正确
2. **性能风险**: 向量搜索需要优化索引
3. **权限风险**: RLS策略必须严格测试
4. **并发风险**: 默认组织创建需要处理并发情况

### 回滚计划
如果出现严重问题：
1. 保留原ExplorerAlliance.tsx代码作为备份
2. 数据库表可以独立删除而不影响现有系统
3. 路由可以快速切换回原系统

---

## 🎯 后续优化

### 第一阶段完成后
- [ ] AI任务生成功能
- [ ] 项目进度可视化
- [ ] 文档智能推荐
- [ ] 聊天上下文优化

### 第二阶段
- [ ] 项目模板系统
- [ ] 团队协作看板
- [ ] 实时通知推送
- [ ] 移动端适配

---

## 📚 参考资料

- AIP源代码: `D:\CursorWork\FutureMindInstitute\readme\N8NAIP\shareplatform n8n`
- 数据库Schema: `D:\CursorWork\FutureMindInstitute\readme\N8NAIP\aip_table_schema.json`
- Supabase文档: https://supabase.com/docs
- pgvector文档: https://github.com/pgvector/pgvector
- n8n Webhook: https://n8n.aifunbox.com/webhook-test/fd6b2fff-af4c-4013-8fb6-ada231750a5a

---

**文档版本**: v1.0
**创建日期**: 2025-11-11
**最后更新**: 2025-11-11
**状态**: 待执行
