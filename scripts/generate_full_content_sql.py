#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成伊卡洛斯计划完整内容的SQL更新语句
Generate SQL UPDATE statements for full Icarus content
"""

import json
import sys
import os

# Windows UTF-8 支持
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def generate_full_content_sql():
    """
    为每个项目生成单独的SQL文件
    """

    input_file = "scripts/icarus_full_content.json"
    output_dir = "scripts/sql_updates_full"

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 读取完整内容数据
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    system_id = data["system_id"]
    projects = data["projects"]

    print("=" * 70)
    print("伊卡洛斯计划 - 生成完整内容SQL更新")
    print("=" * 70)
    print()
    print(f"输入文件: {input_file}")
    print(f"输出目录: {output_dir}/")
    print(f"项目总数: {len(projects)}")
    print()

    # 为每个项目生成单独的SQL文件
    for project in projects:
        seq = project["sequence_number"]
        title = project["title"]
        week_plan = project["week_plan"]

        # 转换week_plan为JSON字符串
        week_plan_json = json.dumps(week_plan, ensure_ascii=False, separators=(',', ':'))

        # 生成SQL文件名
        sql_filename = f"{output_dir}/update_project_{seq:02d}_{title.replace('：', '_').replace('、', '_')}.sql"

        # 生成UPDATE语句（使用dollar-quoting）
        sql_content = f"""-- ============================================================
-- 项目 {seq}: {title}
-- 周数: {len(week_plan)}
-- 活动数: {sum(len(w['activities']) for w in week_plan)}
-- ============================================================

UPDATE course_contents
SET week_plan = $week_data${week_plan_json}$week_data$::jsonb
WHERE system_id = '{system_id}'::uuid
  AND sequence_number = {seq};

-- 验证更新
SELECT
  sequence_number,
  title,
  jsonb_array_length(week_plan) as weeks_count,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(week_plan) w,
         jsonb_array_elements(w->'activities') a
  ) as activities_count
FROM course_contents
WHERE system_id = '{system_id}'::uuid
  AND sequence_number = {seq};
"""

        # 保存SQL文件
        with open(sql_filename, 'w', encoding='utf-8') as f:
            f.write(sql_content)

        file_size = len(sql_content.encode('utf-8'))
        print(f"  [{seq:2d}] {title[:30]:30s} - {len(week_plan):2d}周 - {file_size:>8d} bytes")

    # 生成执行所有更新的主脚本
    master_script = f"""-- ============================================================
-- 伊卡洛斯计划 - 完整内容更新主脚本
-- Icarus Full Content Update Master Script
-- ============================================================
-- 总项目数: {len(projects)}
-- 总周数: {sum(len(p['week_plan']) for p in projects)}
-- 总活动数: {sum(sum(len(w['activities']) for w in p['week_plan']) for p in projects)}
-- ============================================================

-- 说明：
-- 此文件包含所有11个项目的UPDATE语句
-- 由于文件较大，建议分批执行：
-- 方法1: 在Supabase Dashboard SQL Editor中逐个执行单独的SQL文件
-- 方法2: 使用本master脚本一次性执行所有更新（需要足够的内存）

"""

    for project in projects:
        seq = project["sequence_number"]
        title = project["title"]
        master_script += f"\n-- 执行项目 {seq}: {title}\n"
        master_script += f"\\i {output_dir}/update_project_{seq:02d}_{title.replace('：', '_').replace('、', '_')}.sql\n"

    master_script += f"""
-- ============================================================
-- 完整验证查询
-- ============================================================
SELECT
  sequence_number,
  title,
  jsonb_array_length(week_plan) as weeks_count,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(week_plan) w,
         jsonb_array_elements(w->'activities') a
  ) as activities_count
FROM course_contents
WHERE system_id = '{system_id}'::uuid
ORDER BY sequence_number;
"""

    master_filename = f"{output_dir}/master_update_all.sql"
    with open(master_filename, 'w', encoding='utf-8') as f:
        f.write(master_script)

    print()
    print("=" * 70)
    print(f"✓ 成功生成 {len(projects)} 个SQL文件")
    print(f"✓ 输出目录: {output_dir}/")
    print(f"✓ 主脚本: {master_filename}")
    print()
    print("下一步:")
    print("  1. 打开Supabase Dashboard > SQL Editor")
    print("  2. 逐个复制并执行每个SQL文件")
    print("  3. 或者使用master_update_all.sql一次性执行")
    print("=" * 70)

    return True


def main():
    """主函数"""

    try:
        success = generate_full_content_sql()
        return success

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
