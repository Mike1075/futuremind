#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Update week_plan JSONB data for all 11 projects
"""

import json
import os

SYSTEM_ID = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'

def load_metadata():
    """Load the metadata JSON file"""
    json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'icarus_projects_metadata.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def normalize_text(text):
    """Normalize Chinese punctuation to ASCII"""
    if not text:
        return ''
    return (text
        .replace('"', '"').replace('"', '"')  # Chinese quotes to ASCII
        .replace(''', "'").replace(''', "'")  # Chinese apostrophes to ASCII
        .replace('—', '-').replace('–', '-')  # Em/en dashes to hyphen
    )

def build_week_plan(project):
    """Build week_plan JSONB array from project data"""
    weeks = project.get('weeks', [])
    week_plan = []

    for week in weeks:
        week_obj = {
            'week': week.get('week_number', 0),
            'theme': normalize_text(week.get('week_title', '')),
            'goals': normalize_text(week.get('week_objectives', '')),
            'activities': []
        }

        # Add daily activities
        for day in week.get('days', []):
            activity = {
                'day': day.get('day', ''),
                'title': normalize_text(day.get('title', '')),
                'duration': day.get('duration', ''),
                'description': normalize_text(day.get('description', ''))[:500],  # Limit description length
                'deliverables': [normalize_text(d)[:200] for d in day.get('deliverables', [])[:3]]  # Limit deliverables
            }
            week_obj['activities'].append(activity)

        week_plan.append(week_obj)

    return week_plan

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def main():
    data = load_metadata()
    projects = data['projects']

    print(f"-- Updating week_plan for {len(projects)} projects")
    print()

    # Generate UPDATE statements for each project
    for idx, project in enumerate(projects, 1):
        stage_number = idx
        week_plan = build_week_plan(project)

        # Convert to JSON string
        week_plan_json = json.dumps(week_plan, ensure_ascii=False, indent=None)
        week_plan_escaped = escape_sql_string(week_plan_json)

        print(f"-- Project {stage_number}: {project['stage_name']}")
        print(f"UPDATE course_contents")
        print(f"SET week_plan = '{week_plan_escaped}'::jsonb,")
        print(f"    updated_at = NOW()")
        print(f"WHERE system_id = '{SYSTEM_ID}'::uuid")
        print(f"  AND sequence_number = {stage_number};")
        print()

if __name__ == '__main__':
    main()
