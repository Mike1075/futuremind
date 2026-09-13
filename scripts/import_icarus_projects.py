#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
伊卡洛斯项目数据导入脚本
从 icarus_projects_metadata.json 导入11个项目到 Supabase 数据库
"""

import json
import os
from supabase import create_client
from datetime import datetime

# 从环境变量或配置文件读取
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

def load_projects_data():
    """加载项目元数据"""
    json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'icarus_projects_metadata.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['projects']

def get_icarus_system_id(supabase):
    """获取伊卡洛斯课程系统ID"""
    result = supabase.table('course_systems').select('id').eq('system_key', 'icarus').single().execute()
    return result.data['id']

def create_or_update_stage(supabase, system_id, project, stage_order):
    """创建或更新course_stages记录"""
    stage_data = {
        'system_id': system_id,
        'stage_number': stage_order,
        'stage_name': project['stage_name'],
        'stage_description': f"{project['stage_name_en']} | {project['suggested_age_range']} | {project['duration_weeks']}周",
        'welcome_message': project.get('core_objectives', ''),
        'core_objectives': project.get('core_objectives', '').split('。')[:5],  # 转为数组
        'final_outcome': project.get('final_outcome', '').split('\n')[0] if project.get('final_outcome') else '',  # 只取第一段
        'suggested_age_range': project['suggested_age_range'],
        'duration_weeks': project['duration_weeks'],
        'module_category': project['module_category'],
        'stage_order': stage_order,
        'is_published': True,
        'updated_at': datetime.utcnow().isoformat()
    }

    # 检查是否已存在
    existing = supabase.table('course_stages').select('id').eq('system_id', system_id).eq('stage_number', stage_order).execute()

    if existing.data and len(existing.data) > 0:
        # 更新
        stage_id = existing.data[0]['id']
        supabase.table('course_stages').update(stage_data).eq('id', stage_id).execute()
        print(f"✓ 更新 course_stages: {project['stage_name']}")
    else:
        # 创建
        result = supabase.table('course_stages').insert(stage_data).execute()
        stage_id = result.data[0]['id']
        print(f"✓ 创建 course_stages: {project['stage_name']}")

    return stage_id

def create_or_update_content(supabase, system_id, stage_id, project, sequence_number):
    """创建或更新course_contents记录"""
    # 构建 week_plan JSONB
    week_plan = []
    for week in project.get('weeks', []):
        week_activities = []
        for day in week.get('days', []):
            week_activities.append({
                'day': day.get('day', ''),
                'title': day.get('title', ''),
                'description': day.get('description', '')[:500] if day.get('description') else '',  # 限制长度
                'duration': day.get('duration', ''),
                'deliverables': day.get('deliverables', [])[:3]  # 最多保留3个交付物
            })

        week_plan.append({
            'week': week.get('week_number', 0),
            'theme': week.get('week_title', ''),
            'goals': week.get('week_objectives', '').split('。')[:3],  # 转为数组，最多3个
            'activities': week_activities
        })

    content_data = {
        'system_id': system_id,
        'stage_id': stage_id,
        'content_type': 'icarus',
        'sequence_number': sequence_number,
        'title': project['stage_name'],
        'subtitle': project['suggested_age_range'],
        'original_text': project['module_category'],
        'module_name': project['module_category'].split('(')[0].strip(),
        'difficulty_level': project['suggested_age_range'],
        'project_intro': project.get('core_objectives', '')[:200] if project.get('core_objectives') else '',
        'week_plan': week_plan,
        'day_plan': [],  # 不再使用
        'estimated_duration': project['duration_weeks'] * 7,  # 转换为天数
        'is_published': True,
        'review_status': 'approved',
        'project_visibility': 'system',
        'updated_at': datetime.utcnow().isoformat()
    }

    # 检查是否已存在
    existing = supabase.table('course_contents').select('id').eq('system_id', system_id).eq('sequence_number', sequence_number).execute()

    if existing.data and len(existing.data) > 0:
        # 更新
        content_id = existing.data[0]['id']
        supabase.table('course_contents').update(content_data).eq('id', content_id).execute()
        print(f"  → 更新 course_contents (seq={sequence_number})")
    else:
        # 创建
        result = supabase.table('course_contents').insert(content_data).execute()
        content_id = result.data[0]['id']
        print(f"  → 创建 course_contents (seq={sequence_number})")

    return content_id

def main():
    """主函数"""
    print("="*60)
    print("伊卡洛斯项目数据导入")
    print("="*60)

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ 错误：请设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量")
        return

    # 创建 Supabase 客户端
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✓ 已连接到 Supabase")

    # 获取系统ID
    system_id = get_icarus_system_id(supabase)
    print(f"✓ 伊卡洛斯系统ID: {system_id}\n")

    # 加载项目数据
    projects = load_projects_data()
    print(f"✓ 已加载 {len(projects)} 个项目\n")

    # 导入每个项目
    for idx, project in enumerate(projects, 1):
        print(f"[{idx}/11] {project['stage_name']}")

        # 创建/更新 stage
        stage_id = create_or_update_stage(supabase, system_id, project, idx)

        # 创建/更新 content
        content_id = create_or_update_content(supabase, system_id, stage_id, project, idx)

        print()

    print("="*60)
    print("✅ 导入完成！")
    print("="*60)

if __name__ == '__main__':
    main()
