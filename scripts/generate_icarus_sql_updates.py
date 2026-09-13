#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成伊卡洛斯计划的SQL更新语句
Generate SQL UPDATE statements for Icarus projects
"""

import json
import sys

# Windows UTF-8 支持
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def escape_sql_string(s):
    """转义SQL字符串中的特殊字符"""
    if s is None:
        return ""
    return s.replace("'", "''").replace("\\", "\\\\")

def generate_sql_updates(metadata_file, output_file):
    """生成SQL更新语句"""

    # 读取元数据
    with open(metadata_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    system_id = data["system_id"]
    projects = data["projects"]

    sql_statements = []

    # 生成文件头部注释
    header = f"""-- ============================================================
-- 伊卡洛斯计划 - 完整周计划数据更新
-- Icarus Project - Complete Week Plan Data Update
-- ============================================================
-- 生成时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- 项目总数: {len(projects)}
-- 周计划总数: {data['total_weeks']}
-- ============================================================

"""
    sql_statements.append(header)

    # 为每个项目生成UPDATE语句
    for project in projects:
        seq = project["sequence_number"]
        title = project["title"]
        week_plan = project["week_plan"]
        weeks_count = len(week_plan)

        # 转换week_plan为JSON字符串
        week_plan_json = json.dumps(week_plan, ensure_ascii=False, separators=(',', ':'))

        # 生成UPDATE语句 (使用 $$ dollar-quoting 避免转义问题)
        update_sql = f"""-- ------------------------------------------------------------
-- 项目 {seq}: {title}
-- 周数: {weeks_count}
-- ------------------------------------------------------------
UPDATE course_contents
SET week_plan = $week_data${week_plan_json}$week_data$::jsonb
WHERE system_id = '{system_id}'::uuid
  AND sequence_number = {seq};

"""
        sql_statements.append(update_sql)

    # 添加验证查询
    verification = f"""-- ============================================================
-- 验证查询 - 检查更新后的数据
-- ============================================================
SELECT
  sequence_number,
  title,
  jsonb_array_length(week_plan) as weeks_count,
  (week_plan->0->>'week') as first_week,
  (week_plan->(jsonb_array_length(week_plan)-1)->>'week') as last_week
FROM course_contents
WHERE system_id = '{system_id}'::uuid
ORDER BY sequence_number;

-- 预期结果:
-- sequence_number | title | weeks_count | first_week | last_week
-- ----------------+-------+-------------+------------+-----------
"""

    for project in projects:
        verification += f"--      {project['sequence_number']:2d}       | {project['title'][:40]:40s} |     {len(project['week_plan']):2d}      |     {project['week_plan'][0]['week']}      |     {project['week_plan'][-1]['week']}\n"

    sql_statements.append(verification)

    # 保存SQL文件
    full_sql = "".join(sql_statements)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(full_sql)

    return full_sql, len(projects)

def main():
    """主函数"""

    metadata_file = "scripts/icarus_complete_metadata.json"
    output_file = "scripts/update_icarus_week_plans.sql"

    print("开始生成SQL更新语句...")
    print(f"输入文件: {metadata_file}")
    print(f"输出文件: {output_file}")
    print("-" * 60)

    try:
        sql, project_count = generate_sql_updates(metadata_file, output_file)

        # 统计信息
        update_count = sql.count("UPDATE course_contents")

        print(f"✓ 成功生成 {update_count} 条UPDATE语句")
        print(f"✓ 覆盖 {project_count} 个项目")
        print(f"\n✓ SQL文件已保存到: {output_file}")
        print(f"✓ 文件大小: {len(sql)} 字符")

        print("\n" + "=" * 60)
        print("下一步操作:")
        print("=" * 60)
        print("1. 检查生成的SQL文件")
        print("2. 使用Supabase MCP工具执行SQL更新")
        print("3. 验证数据库中的week_plan已正确更新")
        print("4. 检查管理后台和前端显示")

        return True

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
