#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
伊卡洛斯计划 - 完整内容提取脚本
提取原markdown文档的ALL内容（不简化）
Extract COMPLETE content from Icarus markdown document
"""

import re
import json
import sys

# Windows UTF-8 支持
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def extract_full_project_content(file_path):
    """
    提取所有项目的完整内容（包括所有文字说明）
    """

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 定义11个项目的标题和预期周数
    projects_meta = [
        {"seq": 1, "title": "第一阶段：宠物侦探", "weeks": 4, "module": "模块一：无形的纽带"},
        {"seq": 2, "title": "第二阶段：杰提计划", "weeks": 8, "module": "模块一：无形的纽带"},
        {"seq": 3, "title": "第三阶段：贝尔不等式与生命系统", "weeks": 16, "module": "模块一：无形的纽带"},
        {"seq": 4, "title": "第一阶段：植物的悄悄话", "weeks": 4, "module": "模块二：无形的地图"},
        {"seq": 5, "title": "第二阶段：远程蚁巢", "weeks": 8, "module": "模块二：无形的地图"},
        {"seq": 6, "title": "第三阶段：记忆的水实验", "weeks": 12, "module": "模块二：无形的地图"},
        {"seq": 7, "title": "第四阶段：意识地理学", "weeks": 8, "module": "模块二：无形的地图"},
        {"seq": 8, "title": "第一阶段：情绪的颜色", "weeks": 4, "module": "模块三：延展的心灵"},
        {"seq": 9, "title": "第二阶段：跨越距离的凝视", "weeks": 6, "module": "模块三：延展的心灵"},
        {"seq": 10, "title": "第三阶段：意念撼动概率", "weeks": 10, "module": "模块三：延展的心灵"},
        {"seq": 11, "title": "第四阶段：幻肢与纠缠", "weeks": 12, "module": "模块三：延展的心灵"}
    ]

    all_projects = []

    for project_meta in projects_meta:
        print(f"\n正在提取项目 {project_meta['seq']}: {project_meta['title']}")

        # 找到项目的起始位置
        title_pattern = re.escape(project_meta['title'])
        project_start_match = re.search(title_pattern, content)

        if not project_start_match:
            print(f"  ⚠️  未找到项目标题")
            continue

        project_start = project_start_match.start()

        # 找到下一个项目的起始位置（或文档结束）
        if project_meta['seq'] < 11:
            next_title = projects_meta[project_meta['seq']]['title']
            next_project_match = re.search(re.escape(next_title), content[project_start + 100:])
            if next_project_match:
                project_end = project_start + 100 + next_project_match.start()
            else:
                project_end = len(content)
        else:
            project_end = len(content)

        project_content = content[project_start:project_end]

        # 提取所有周的内容
        week_plans = extract_full_week_plans(project_content, project_meta['weeks'])

        project_data = {
            "sequence_number": project_meta['seq'],
            "title": project_meta['title'],
            "module": project_meta['module'],
            "expected_weeks": project_meta['weeks'],
            "actual_weeks": len(week_plans),
            "week_plan": week_plans
        }

        all_projects.append(project_data)
        print(f"  ✓ 提取了 {len(week_plans)} 周的内容")

    return all_projects


def extract_full_week_plans(project_content, expected_weeks):
    """
    提取一个项目中所有周的完整内容（包括所有文字）
    """

    week_plans = []

    # 匹配周标题：第X周：主题 (Days X-Y)
    week_pattern = r'第([一二三四五六七八九十百]+)周[：:]\s*([^\n\(]+)\s*\(Days?\s+([\d\-]+)\)'

    week_matches = list(re.finditer(week_pattern, project_content))

    for i, week_match in enumerate(week_matches):
        week_num_cn = week_match.group(1)
        week_theme = week_match.group(2).strip()
        days_range = week_match.group(3)

        # 转换中文数字为阿拉伯数字
        week_num = chinese_to_number(week_num_cn)

        # 确定本周内容的范围
        week_start = week_match.end()

        if i + 1 < len(week_matches):
            week_end = week_matches[i + 1].start()
        else:
            # 最后一周，到项目结束
            week_end = len(project_content)

        week_content = project_content[week_start:week_end]

        # 提取本周目标（通常在周标题之后）
        goals = extract_week_goals(week_content)

        # 提取本周的所有活动（Day）
        activities = extract_full_activities(week_content)

        week_data = {
            "week": week_num,
            "theme": week_theme,
            "days_range": days_range,
            "goals": goals,
            "activities": activities
        }

        week_plans.append(week_data)

    return week_plans


def extract_week_goals(week_content):
    """提取本周目标"""
    goals = []

    # 匹配 "本周目标：" 后面的内容
    goal_pattern = r'本周目标[：:]\s*([^\n]+)'
    goal_match = re.search(goal_pattern, week_content)

    if goal_match:
        goals.append(goal_match.group(1).strip())

    return goals


def extract_full_activities(week_content):
    """
    提取一周内的所有活动（Day），保留完整内容
    """

    activities = []

    # 匹配活动标题：【第X周 | Day X-Y】标题 (英文标题)
    activity_pattern = r'【第[^】]+\|\s*Day\s+([\d\-\,]+)】([^(]+)\(([^)]+)\)'

    activity_matches = list(re.finditer(activity_pattern, week_content))

    for i, activity_match in enumerate(activity_matches):
        day_range = activity_match.group(1).strip()
        title_full = activity_match.group(2).strip()
        title_en = activity_match.group(3).strip()

        # 分离中文和英文标题
        # 标题格式通常是：中文标题 (English Title) 或 中文标题
        if '(' in title_full:
            title_zh = title_full.split('(')[0].strip()
        else:
            title_zh = title_full

        # 确定活动内容的范围
        content_start = activity_match.end()

        if i + 1 < len(activity_matches):
            content_end = activity_matches[i + 1].start()
        else:
            # 最后一个活动，到周结束
            content_end = len(week_content)

        # 提取完整的活动内容（markdown格式）
        activity_content = week_content[content_start:content_end].strip()

        # 提取任务时长
        duration = extract_duration(activity_content)

        # 计算序号（用于排序）
        sequence = calculate_sequence(day_range)

        activity_data = {
            "sequence": sequence,
            "day_label": f"Day {day_range}",
            "day_range": day_range,
            "title_zh": title_zh,
            "title_en": title_en,
            "duration": duration,
            "content": activity_content  # 完整的markdown内容
        }

        activities.append(activity_data)

    # 按序号排序
    activities.sort(key=lambda x: x['sequence'])

    return activities


def extract_duration(content):
    """提取任务时长"""
    duration_pattern = r'\(任务时长[：:]\s*([^)]+)\)'
    match = re.search(duration_pattern, content)
    if match:
        return match.group(1).strip()
    return "未指定"


def calculate_sequence(day_range):
    """
    计算活动序号（用于排序）
    例如：
    "1" -> 1
    "2-4" -> 2
    "5-7" -> 5
    "16-18" -> 16
    """
    # 提取第一个数字
    numbers = re.findall(r'\d+', day_range)
    if numbers:
        return int(numbers[0])
    return 999  # 如果无法解析，放到最后


def chinese_to_number(cn_num):
    """中文数字转阿拉伯数字"""
    cn_map = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
        '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16
    }
    return cn_map.get(cn_num, 0)


def main():
    """主函数"""

    input_file = "icarus_full_temp.md"
    output_file = "scripts/icarus_full_content.json"

    print("=" * 70)
    print("伊卡洛斯计划 - 完整内容提取")
    print("提取原markdown文档的ALL内容（不简化）")
    print("=" * 70)
    print()
    print(f"输入文件: {input_file}")
    print(f"输出文件: {output_file}")
    print()

    try:
        # 提取所有项目的完整内容
        all_projects = extract_full_project_content(input_file)

        # 统计
        total_weeks = sum(p['actual_weeks'] for p in all_projects)
        total_activities = sum(len(w['activities']) for p in all_projects for w in p['week_plan'])

        # 保存JSON
        output_data = {
            "course_system": "icarus",
            "system_id": "9da7c347-fe63-4c81-81e1-df576bcd2e6c",
            "extraction_mode": "FULL_CONTENT",
            "total_projects": len(all_projects),
            "total_weeks": total_weeks,
            "total_activities": total_activities,
            "projects": all_projects
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        print()
        print("=" * 70)
        print("✓ 提取完成！")
        print(f"✓ 项目总数: {len(all_projects)}")
        print(f"✓ 周计划总数: {total_weeks}")
        print(f"✓ 活动总数: {total_activities}")
        print(f"✓ 输出文件: {output_file}")
        print("=" * 70)

        # 显示每个项目的统计
        print()
        print("各项目统计:")
        for p in all_projects:
            activities_count = sum(len(w['activities']) for w in p['week_plan'])
            print(f"  {p['sequence_number']:2d}. {p['title'][:30]:30s} - {p['actual_weeks']:2d}周, {activities_count:3d}活动")

        return True

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
