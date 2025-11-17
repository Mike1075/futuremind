#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取伊卡洛斯计划完整元数据（包含所有周计划）
Extract complete Icarus metadata with all week plans
"""

import re
import json
import sys

# Windows UTF-8 支持
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# 项目结构定义
PROJECTS_STRUCTURE = [
    {"sequence": 1, "module": "模块一", "title": "第一阶段：宠物侦探", "weeks": 4, "icon": "PawPrint", "color": "purple"},
    {"sequence": 2, "module": "模块一", "title": "第二阶段：杰提计划", "weeks": 8, "icon": "Microscope", "color": "blue"},
    {"sequence": 3, "module": "模块一", "title": "第三阶段：贝尔不等式与生命系统", "weeks": 16, "icon": "Atom", "color": "indigo"},
    {"sequence": 4, "module": "模块二", "title": "第一阶段：植物的悄悄话", "weeks": 4, "icon": "Sprout", "color": "green"},
    {"sequence": 5, "module": "模块二", "title": "第二阶段：远程蚁巢", "weeks": 8, "icon": "Bug", "color": "amber"},
    {"sequence": 6, "module": "模块二", "title": "第三阶段：记忆的水实验", "weeks": 12, "icon": "Droplet", "color": "cyan"},
    {"sequence": 7, "module": "模块二", "title": "第四阶段：意识地理学", "weeks": 8, "icon": "MapPin", "color": "teal"},
    {"sequence": 8, "module": "模块三", "title": "第一阶段：情绪的颜色", "weeks": 4, "icon": "Palette", "color": "pink"},
    {"sequence": 9, "module": "模块三", "title": "第二阶段：跨越距离的凝视", "weeks": 6, "icon": "Eye", "color": "violet"},
    {"sequence": 10, "module": "模块三", "title": "第三阶段：意念撼动概率", "weeks": 10, "icon": "Dices", "color": "orange"},
    {"sequence": 11, "module": "模块三", "title": "第四阶段：幻肢与纠缠", "weeks": 12, "icon": "Waves", "color": "rose"},
]

def extract_project_metadata(file_path):
    """提取所有项目的完整元数据"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 按模块分割内容
    modules = re.split(r'^模块[一二三]：', content, flags=re.MULTILINE)
    modules = [m.strip() for m in modules if m.strip()]

    all_projects = []
    current_project_idx = 0

    # 提取每个项目的完整内容
    project_sections = re.split(r'^第[一二三四]阶段：', content, flags=re.MULTILINE)[1:]

    for i, section in enumerate(project_sections):
        if current_project_idx >= len(PROJECTS_STRUCTURE):
            break

        project_info = PROJECTS_STRUCTURE[current_project_idx]

        # 提取项目标题
        title_match = re.match(r'^([^\n]+)', section)
        if not title_match:
            continue

        full_title = "第" + ["一", "二", "三", "四"][i % 4] + "阶段：" + title_match.group(1).split('\n')[0].strip()

        # 提取项目基本信息
        project_data = {
            "sequence_number": project_info["sequence"],
            "module": project_info["module"],
            "title": full_title,
            "icon": project_info["icon"],
            "color": project_info["color"],
            "week_plan": []
        }

        # 提取年龄段
        age_match = re.search(r'目标年龄段[：:]\s*(\d+-\d+岁)', section)
        if age_match:
            project_data["target_age"] = age_match.group(1)

        # 提取核心目标
        goal_match = re.search(r'核心目标[：:]\s*([^\n]+)', section)
        if goal_match:
            project_data["core_goal"] = goal_match.group(1).strip()

        # 提取周计划
        weeks = extract_week_plans(section, project_info["weeks"])
        project_data["week_plan"] = weeks

        all_projects.append(project_data)
        current_project_idx += 1

        print(f"✓ 提取项目 {project_data['sequence_number']}: {project_data['title']} - {len(weeks)} 周")

    return all_projects

def extract_week_plans(section_content, expected_weeks):
    """提取一个项目的所有周计划"""

    week_plans = []

    # 匹配所有周标题
    week_pattern = r'第([一二三四五六七八九十]+)周[：:]\s*([^\n]+)\s*\(Days\s+(\d+)-(\d+)\)'
    week_matches = list(re.finditer(week_pattern, section_content))

    chinese_numbers = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    }

    # 处理大于10的中文数字
    def parse_chinese_week(chinese_num):
        if chinese_num == '十':
            return 10
        elif chinese_num.startswith('十'):
            return 10 + chinese_numbers.get(chinese_num[1:], 0)
        else:
            return chinese_numbers.get(chinese_num, 0)

    for i, match in enumerate(week_matches):
        week_num_chinese = match.group(1)
        week_title = match.group(2).strip()
        day_start = int(match.group(3))
        day_end = int(match.group(4))

        week_num = parse_chinese_week(week_num_chinese)

        # 提取本周目标
        week_start_pos = match.start()
        week_end_pos = week_matches[i + 1].start() if i + 1 < len(week_matches) else len(section_content)
        week_content = section_content[week_start_pos:week_end_pos]

        goal_match = re.search(r'本周目标[：:]\s*([^\n]+)', week_content)
        goals = [goal_match.group(1).strip()] if goal_match else []

        # 提取活动
        activities = extract_activities(week_content, week_num)

        week_plan = {
            "week": week_num,
            "theme": week_title,
            "days": f"Days {day_start}-{day_end}",
            "goals": goals,
            "activities": activities
        }

        week_plans.append(week_plan)

    return week_plans

def extract_activities(week_content, week_num):
    """提取一周内的所有活动"""

    activities = []

    # 匹配活动标题模式：【第X周 | Day X-X】或【第X周 | Day X】
    activity_pattern = r'【第.+?\|.+?】([^\n]+)'
    activity_matches = list(re.finditer(activity_pattern, week_content))

    for i, match in enumerate(activity_matches):
        full_match = match.group(0)
        activity_title = match.group(1).strip()

        # 提取天数
        day_match = re.search(r'Day\s+(\d+(?:-\d+)?)', full_match)
        day = day_match.group(1) if day_match else str(week_num)

        # 提取时长
        activity_start = match.start()
        activity_end = activity_matches[i + 1].start() if i + 1 < len(activity_matches) else len(week_content)
        activity_content = week_content[activity_start:activity_end]

        duration_match = re.search(r'\(任务时长[：:]\s*([^\)]+)\)', activity_content)
        duration = duration_match.group(1).strip() if duration_match else "约30分钟"

        # 提取描述（取第一段非标题文字）
        description_match = re.search(r'\)\s*\n([^\n【]+)', activity_content)
        description = description_match.group(1).strip() if description_match else ""

        activity = {
            "day": day,
            "title": activity_title,
            "duration": duration,
            "description": description[:200]  # 限制描述长度
        }

        activities.append(activity)

    return activities

def main():
    """主函数"""

    input_file = "icarus_full_temp.md"
    output_file = "scripts/icarus_complete_metadata.json"

    print("开始提取伊卡洛斯计划完整元数据...")
    print(f"输入文件: {input_file}")
    print(f"输出文件: {output_file}")
    print("-" * 60)

    try:
        # 提取所有项目数据
        projects = extract_project_metadata(input_file)

        print("-" * 60)
        print(f"✓ 成功提取 {len(projects)} 个项目")

        # 统计总周数
        total_weeks = sum(len(p["week_plan"]) for p in projects)
        print(f"✓ 总计 {total_weeks} 周的完整数据")

        # 保存为JSON
        output_data = {
            "course_system": "icarus",
            "system_id": "9da7c347-fe63-4c81-81e1-df576bcd2e6c",
            "total_projects": len(projects),
            "total_weeks": total_weeks,
            "projects": projects
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        print(f"\n✓ 元数据已保存到: {output_file}")

        # 打印统计信息
        print("\n" + "=" * 60)
        print("项目统计:")
        print("=" * 60)
        for p in projects:
            weeks_count = len(p["week_plan"])
            activities_count = sum(len(w["activities"]) for w in p["week_plan"])
            print(f"  {p['sequence_number']:2d}. {p['title']:30s} | {weeks_count:2d} 周 | {activities_count:3d} 个活动 | {p['icon']}")

        return True

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
