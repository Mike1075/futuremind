#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量执行伊卡洛斯项目的SQL更新
Execute Icarus SQL updates in batch
"""

import json
import sys
import os

# Windows UTF-8 支持
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    """执行所有11个项目的week_plan更新"""

    metadata_file = "scripts/icarus_complete_metadata.json"
    system_id = "9da7c347-fe63-4c81-81e1-df576bcd2e6c"

    print("=" * 70)
    print("伊卡洛斯计划 - 批量更新Supabase数据库")
    print("=" * 70)
    print()

    # 读取元数据
    with open(metadata_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    projects = data["projects"]

    print(f"准备更新 {len(projects)} 个项目的完整周计划数据...")
    print()

    success_count = 0
    failed_updates = []

    for project in projects:
        seq = project["sequence_number"]
        title = project["title"]
        week_plan = project["week_plan"]
        weeks_count = len(week_plan)

        # 转换week_plan为JSON字符串
        week_plan_json = json.dumps(week_plan, ensure_ascii=False, separators=(',', ':'))

        # 生成UPDATE语句
        update_sql = f"""UPDATE course_contents
SET week_plan = $week_data${week_plan_json}$week_data$::jsonb
WHERE system_id = '{system_id}'::uuid
  AND sequence_number = {seq};"""

        print(f"[{seq}/11] 更新项目: {title}")
        print(f"        周数: {weeks_count} 周")

        # 保存SQL到临时文件
        temp_sql_file = f"scripts/temp_update_{seq}.sql"
        with open(temp_sql_file, 'w', encoding='utf-8') as f:
            f.write(update_sql)

        print(f"        SQL已保存到: {temp_sql_file}")
        print(f"        ⚠️  请使用Supabase MCP工具手动执行此SQL")
        print()

        success_count += 1

    print("=" * 70)
    print(f"✓ 成功准备 {success_count} 个项目的UPDATE语句")
    print(f"✓ SQL文件已保存到: scripts/temp_update_*.sql")
    print()
    print("下一步：")
    print("1. 使用Supabase MCP的execute_sql工具依次执行这些SQL文件")
    print("2. 或者直接在Supabase Dashboard的SQL Editor中执行")
    print("=" * 70)

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
