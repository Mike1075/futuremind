#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parse the detailed Icarus document and extract complete week_plan with goals and activities
"""

import json
import os
import re

def load_document():
    """Load the detailed Icarus document"""
    doc_path = r'D:\CursorWork\FutureMindInstitute\readme\三大课程资料\（细化完整版）未来教育PBL课程体系："伊卡洛斯计划：探索现实的边缘".md'
    with open(doc_path, 'r', encoding='utf-8') as f:
        return f.read()

def normalize_text(text):
    """Normalize Chinese punctuation to ASCII"""
    if not text:
        return ''
    return (text
        .replace('"', '"').replace('"', '"')
        .replace(''', "'").replace(''', "'")
        .replace('—', '-').replace('–', '-')
    )

def extract_project_sections(content):
    """Extract all 11 project sections from the document"""
    # Split by major project headers (第X阶段：)
    pattern = r'#+\s*(第[一二三四]阶段：[^\n]+)'
    matches = list(re.finditer(pattern, content))

    projects = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i < len(matches) - 1 else len(content)

        project_title = match.group(1).strip()
        project_content = content[start:end]

        projects.append({
            'title': project_title,
            'content': project_content
        })

    return projects

def extract_week_plan(project_content):
    """Extract detailed week plan from project content"""
    weeks = []

    # Find all week sections (第X周：)
    week_pattern = r'#+\s*第([一二三四五六七八九十]+)周[：:]\s*([^\n]+)'
    week_matches = list(re.finditer(week_pattern, project_content))

    chinese_nums = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}

    for i, week_match in enumerate(week_matches):
        week_num_cn = week_match.group(1)
        week_num = chinese_nums.get(week_num_cn, i + 1)
        week_theme = week_match.group(2).strip()

        # Get week content
        week_start = week_match.start()
        week_end = week_matches[i + 1].start() if i < len(week_matches) - 1 else len(project_content)
        week_content = project_content[week_start:week_end]

        # Extract goals (本周目标：)
        goals = []
        goals_match = re.search(r'本周目标[：:]\s*([^\n]+(?:\n(?!#+|【)[^\n]+)*)', week_content)
        if goals_match:
            goals_text = goals_match.group(1).strip()
            # Split by common delimiters
            goals = [normalize_text(g.strip()) for g in re.split(r'[。；\n]', goals_text) if g.strip() and len(g.strip()) > 5]
            goals = goals[:5]  # Limit to 5 goals

        # Extract daily activities (【第X周 | Day ...】)
        activities = []
        day_pattern = r'【[^】]*Day\s+(\d+(?:-\d+)?)[^】]*】\s*([^\n]+)'
        day_matches = re.finditer(day_pattern, week_content)

        for day_match in day_matches:
            day = day_match.group(1)
            title = normalize_text(day_match.group(2).strip())

            # Find activity content (until next 【 or end)
            activity_start = day_match.end()
            next_bracket = week_content.find('【', activity_start)
            activity_end = next_bracket if next_bracket != -1 and next_bracket < week_end else week_end
            activity_content = week_content[activity_start:activity_end]

            # Extract description (first paragraph after title)
            desc_lines = []
            for line in activity_content.split('\n'):
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('【'):
                    desc_lines.append(line)
                    if len(' '.join(desc_lines)) > 200:
                        break

            description = normalize_text(' '.join(desc_lines))[:500]

            activities.append({
                'day': day,
                'title': title,
                'description': description
            })

        week_data = {
            'week': week_num,
            'theme': normalize_text(week_theme),
            'goals': goals if goals else ['完成本周学习任务'],
            'activities': activities if activities else []
        }

        weeks.append(week_data)

    return weeks

def main():
    print("Loading document...")
    content = load_document()
    print(f"Document loaded: {len(content)} characters")

    print("\nExtracting project sections...")
    projects = extract_project_sections(content)
    print(f"Found {len(projects)} projects")

    # For each project, extract week plan
    results = []
    for i, project in enumerate(projects, 1):
        print(f"\nProcessing Project {i}: {project['title']}")
        week_plan = extract_week_plan(project['content'])
        print(f"  Extracted {len(week_plan)} weeks")

        results.append({
            'sequence_number': i,
            'title': project['title'],
            'week_count': len(week_plan),
            'week_plan': week_plan
        })

    # Save to JSON
    output_path = os.path.join(os.path.dirname(__file__), 'icarus_full_week_plans.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'total_projects': len(results),
            'projects': results
        }, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Saved to: {output_path}")
    print(f"✓ Total projects: {len(results)}")

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("=" * 60)
    for result in results:
        print(f"{result['sequence_number']}. {result['title']}")
        print(f"   Weeks: {result['week_count']}")
        for week in result['week_plan']:
            print(f"     Week {week['week']}: {week['theme']}")
            print(f"       Goals: {len(week['goals'])}")
            print(f"       Activities: {len(week['activities'])}")

if __name__ == '__main__':
    main()
