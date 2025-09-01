import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 创建功能分支表
    const createFeatureBranchesTable = `
      CREATE TABLE IF NOT EXISTS feature_branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
        preview_url TEXT,
        repository_url TEXT,
        assigned_to VARCHAR(255),
        estimated_time VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // 创建检验标准表
    const createInspectionStandardsTable = `
      CREATE TABLE IF NOT EXISTS inspection_standards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES feature_branches(id) ON DELETE CASCADE,
        standard_name VARCHAR(255) NOT NULL,
        description TEXT,
        criteria JSONB NOT NULL DEFAULT '[]',
        weight DECIMAL(3,2) DEFAULT 1.0,
        test_type VARCHAR(20) DEFAULT 'manual' CHECK (test_type IN ('manual', 'automated', 'hybrid')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // 创建检验记录表
    const createInspectionRecordsTable = `
      CREATE TABLE IF NOT EXISTS inspection_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES feature_branches(id) ON DELETE CASCADE,
        standard_id UUID REFERENCES inspection_standards(id) ON DELETE CASCADE,
        inspector_id VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed')),
        score DECIMAL(5,2),
        notes TEXT,
        evidence_files JSONB DEFAULT '[]',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `

    // 创建测试用例表
    const createTestCasesTable = `
      CREATE TABLE IF NOT EXISTS test_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id UUID REFERENCES feature_branches(id) ON DELETE CASCADE,
        test_name VARCHAR(255) NOT NULL,
        test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('unit', 'integration', 'e2e', 'performance', 'security')),
        test_script TEXT,
        expected_result TEXT NOT NULL,
        actual_result TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed')),
        execution_time INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // 执行表创建
    await supabase.rpc('exec_sql', { sql: createFeatureBranchesTable })
    await supabase.rpc('exec_sql', { sql: createInspectionStandardsTable })
    await supabase.rpc('exec_sql', { sql: createInspectionRecordsTable })
    await supabase.rpc('exec_sql', { sql: createTestCasesTable })

    // 插入初始数据 - 六大功能分支
    const initialBranches = [
      {
        name: 'Gaia AI集成',
        description: '集成真实AI API，实现智能对话和推荐系统',
        status: 'not_started',
        priority: 'high',
        estimated_time: '2-3周',
        assigned_to: '待分配'
      },
      {
        name: '意识进化树增强',
        description: '增强意识进化树的交互性和可视化效果',
        status: 'in_progress',
        priority: 'high',
        estimated_time: '1-2周',
        assigned_to: '前端团队'
      },
      {
        name: 'PBL协作系统',
        description: '完善项目制学习协作功能',
        status: 'in_progress',
        priority: 'medium',
        estimated_time: '2-3周',
        assigned_to: '后端团队'
      },
      {
        name: '内容管理系统',
        description: '开发内容管理和动态推送系统',
        status: 'in_progress',
        priority: 'medium',
        estimated_time: '2周',
        assigned_to: '全栈团队'
      },
      {
        name: '移动端优化',
        description: '移动端适配和专属功能开发',
        status: 'not_started',
        priority: 'low',
        estimated_time: '1-2周',
        assigned_to: '移动端团队'
      },
      {
        name: '数据分析仪表板',
        description: '用户行为分析和学习效果统计',
        status: 'completed',
        priority: 'low',
        estimated_time: '2-3周',
        assigned_to: '数据团队'
      }
    ]

    // 检查是否已有数据
    const { data: existingBranches } = await supabase
      .from('feature_branches')
      .select('id')
      .limit(1)

    if (!existingBranches || existingBranches.length === 0) {
      const { error: insertError } = await supabase
        .from('feature_branches')
        .insert(initialBranches)

      if (insertError) {
        console.error('插入初始数据失败:', insertError)
        throw insertError
      }
    }

    // 创建RLS策略
    const enableRLS = `
      ALTER TABLE feature_branches ENABLE ROW LEVEL SECURITY;
      ALTER TABLE inspection_standards ENABLE ROW LEVEL SECURITY;
      ALTER TABLE inspection_records ENABLE ROW LEVEL SECURITY;
      ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

      -- 允许所有用户读取功能分支
      CREATE POLICY IF NOT EXISTS "允许读取功能分支" ON feature_branches FOR SELECT USING (true);
      
      -- 允许认证用户创建和更新记录
      CREATE POLICY IF NOT EXISTS "允许创建检验记录" ON inspection_records FOR INSERT WITH CHECK (true);
      CREATE POLICY IF NOT EXISTS "允许更新检验记录" ON inspection_records FOR UPDATE USING (true);
      CREATE POLICY IF NOT EXISTS "允许读取检验记录" ON inspection_records FOR SELECT USING (true);
    `

    await supabase.rpc('exec_sql', { sql: enableRLS })

    return NextResponse.json({ 
      success: true, 
      message: '数据库初始化成功！已创建所有必要的表和初始数据。' 
    })

  } catch (error) {
    console.error('数据库初始化失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}