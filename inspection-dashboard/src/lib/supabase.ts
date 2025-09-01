import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表类型定义
export interface FeatureBranch {
  id: string
  name: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  priority: 'high' | 'medium' | 'low'
  preview_url?: string
  repository_url?: string
  assigned_to?: string
  estimated_time?: string
  created_at: string
  updated_at: string
}

export interface InspectionStandard {
  id: string
  branch_id: string
  standard_name: string
  description: string
  criteria: string[]
  weight: number
  test_type: 'manual' | 'automated' | 'hybrid'
  created_at: string
}

export interface InspectionRecord {
  id: string
  branch_id: string
  standard_id: string
  inspector_id: string
  status: 'pending' | 'in_progress' | 'passed' | 'failed'
  score?: number
  notes?: string
  evidence_files?: string[]
  started_at: string
  completed_at?: string
}

export interface TestCase {
  id: string
  branch_id: string
  test_name: string
  test_type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security'
  test_script?: string
  expected_result: string
  actual_result?: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  execution_time?: number
  created_at: string
  updated_at: string
}

// 数据库操作函数
export class InspectionService {
  // 获取所有功能分支
  static async getFeatureBranches(): Promise<FeatureBranch[]> {
    const { data, error } = await supabase
      .from('feature_branches')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // 创建功能分支
  static async createFeatureBranch(branch: Omit<FeatureBranch, 'id' | 'created_at' | 'updated_at'>): Promise<FeatureBranch> {
    const { data, error } = await supabase
      .from('feature_branches')
      .insert([branch])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 更新功能分支
  static async updateFeatureBranch(id: string, updates: Partial<FeatureBranch>): Promise<FeatureBranch> {
    const { data, error } = await supabase
      .from('feature_branches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 获取检验标准
  static async getInspectionStandards(branchId?: string): Promise<InspectionStandard[]> {
    let query = supabase.from('inspection_standards').select('*')
    
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // 创建检验记录
  static async createInspectionRecord(record: Omit<InspectionRecord, 'id' | 'started_at'>): Promise<InspectionRecord> {
    const { data, error } = await supabase
      .from('inspection_records')
      .insert([{ ...record, started_at: new Date().toISOString() }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 更新检验记录
  static async updateInspectionRecord(id: string, updates: Partial<InspectionRecord>): Promise<InspectionRecord> {
    const { data, error } = await supabase
      .from('inspection_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 获取检验记录
  static async getInspectionRecords(branchId?: string): Promise<InspectionRecord[]> {
    let query = supabase.from('inspection_records').select(`
      *,
      feature_branches(name),
      inspection_standards(standard_name)
    `)
    
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    
    const { data, error } = await query.order('started_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // 执行自动化测试
  static async runAutomatedTests(branchId: string): Promise<TestCase[]> {
    // 这里可以集成实际的测试执行逻辑
    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('branch_id', branchId)
    
    if (error) throw error
    return data || []
  }

  // 生成检验报告数据
  static async generateReportData(branchId?: string) {
    const branches = await this.getFeatureBranches()
    const records = await this.getInspectionRecords(branchId)
    
    const stats = {
      totalBranches: branches.length,
      completedBranches: branches.filter(b => b.status === 'completed').length,
      inProgressBranches: branches.filter(b => b.status === 'in_progress').length,
      failedBranches: branches.filter(b => b.status === 'failed').length,
      totalInspections: records.length,
      passedInspections: records.filter(r => r.status === 'passed').length,
      failedInspections: records.filter(r => r.status === 'failed').length,
      averageScore: records.reduce((sum, r) => sum + (r.score || 0), 0) / records.length || 0
    }
    
    return { branches, records, stats }
  }
}