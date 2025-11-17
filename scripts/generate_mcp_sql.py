#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate SQL for Icarus projects import via MCP
Outputs clean SQL without Unicode console characters
"""

import json
import os
import sys

# System ID for Icarus
SYSTEM_ID = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    if s is None:
        return ''
    return str(s).replace("'", "''")

def escape_for_json(s):
    """Escape string for inclusion in JSON - replace double quotes and backslashes"""
    if s is None:
        return ''
    return str(s).replace('\\', '\\\\').replace('"', '\\"')

def load_metadata():
    """Load the metadata JSON file"""
    json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'icarus_projects_metadata.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_stages_sql(projects):
    """Generate SQL for course_stages"""
    sql_statements = []

    sql_statements.append("-- Import Icarus Projects - course_stages\n")

    for idx, project in enumerate(projects, 1):
        # Extract core objectives (convert to JSONB array)
        objectives_text = project.get('core_objectives', '')
        # Replace Chinese quotation marks with regular quotes so json.dumps can escape them properly
        objectives_text_normalized = objectives_text.replace('"', '"').replace('"', '"').replace(''', "'").replace(''', "'")
        objectives_list = [obj.strip() for obj in objectives_text_normalized.split('。')[:5] if obj.strip()]
        # Use json.dumps to properly escape all special characters
        objectives_json = json.dumps(objectives_list, ensure_ascii=False)
        # Then escape single quotes for SQL
        objectives_escaped = escape_sql_string(objectives_json)

        # Get first line of final outcome
        final_outcome = project.get('final_outcome', '')
        final_outcome_first = final_outcome.split('\n')[0] if final_outcome else ''

        sql = f"""
-- Project {idx}: {project['stage_name']}
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '{SYSTEM_ID}'::uuid,
    {idx},
    '{escape_sql_string(project['stage_name'])}',
    '{escape_sql_string(project['stage_name_en'])} | {escape_sql_string(project['suggested_age_range'])} | {project['duration_weeks']}周',
    '{escape_sql_string(objectives_text[:500])}',
    '{objectives_escaped}'::jsonb,
    '{escape_sql_string(final_outcome_first[:500])}',
    '{escape_sql_string(project['suggested_age_range'])}',
    {project['duration_weeks']},
    '{escape_sql_string(project['module_category'])}',
    {idx},
    true,
    NOW(),
    NOW()
) ON CONFLICT (system_id, stage_number)
DO UPDATE SET
    stage_name = EXCLUDED.stage_name,
    stage_description = EXCLUDED.stage_description,
    welcome_message = EXCLUDED.welcome_message,
    core_objectives = EXCLUDED.core_objectives,
    final_outcome = EXCLUDED.final_outcome,
    suggested_age_range = EXCLUDED.suggested_age_range,
    duration_weeks = EXCLUDED.duration_weeks,
    module_category = EXCLUDED.module_category,
    updated_at = NOW();
"""
        sql_statements.append(sql)

    return '\n'.join(sql_statements)

def generate_contents_sql(projects):
    """Generate SQL for course_contents"""
    sql_statements = []

    sql_statements.append("-- Import Icarus Projects - course_contents\n")

    for idx, project in enumerate(projects, 1):
        # Build week_plan JSON
        weeks = []
        for week in project.get('weeks', []):
            activities = []
            for day in week.get('days', []):
                desc = day.get('description', '')[:500] if day.get('description') else ''
                activities.append({
                    'day': day.get('day', ''),
                    'title': day.get('title', ''),
                    'description': desc,
                    'duration': day.get('duration', ''),
                    'deliverables': day.get('deliverables', [])[:3]
                })

            week_objectives = week.get('week_objectives', '')
            goals = [g.strip() for g in week_objectives.split('。')[:3] if g.strip()]

            weeks.append({
                'week': week.get('week_number', 0),
                'theme': week.get('week_title', ''),
                'goals': goals,
                'activities': activities
            })

        week_plan_json = json.dumps(weeks, ensure_ascii=False)
        week_plan_escaped = escape_sql_string(week_plan_json)

        module_name = project['module_category'].split('(')[0].strip()
        intro = project.get('core_objectives', '')[:200] if project.get('core_objectives') else ''

        sql = f"""
-- Project {idx}: {project['stage_name']}
WITH stage AS (
    SELECT id FROM course_stages
    WHERE system_id = '{SYSTEM_ID}'::uuid AND stage_number = {idx}
)
INSERT INTO course_contents (
    system_id, stage_id, content_type, sequence_number,
    title, subtitle, original_text, module_name, difficulty_level,
    project_intro, week_plan, day_plan, estimated_duration,
    is_published, review_status, project_visibility,
    created_at, updated_at
) SELECT
    '{SYSTEM_ID}'::uuid,
    stage.id,
    'icarus',
    {idx},
    '{escape_sql_string(project['stage_name'])}',
    '{escape_sql_string(project['suggested_age_range'])}',
    '{escape_sql_string(project['module_category'])}',
    '{escape_sql_string(module_name)}',
    '{escape_sql_string(project['suggested_age_range'])}',
    '{escape_sql_string(intro)}',
    '{week_plan_escaped}'::jsonb,
    '[]'::jsonb,
    {project['duration_weeks'] * 7},
    true,
    'approved',
    'system',
    NOW(),
    NOW()
FROM stage
ON CONFLICT (system_id, sequence_number)
DO UPDATE SET
    stage_id = EXCLUDED.stage_id,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    module_name = EXCLUDED.module_name,
    project_intro = EXCLUDED.project_intro,
    week_plan = EXCLUDED.week_plan,
    estimated_duration = EXCLUDED.estimated_duration,
    updated_at = NOW();
"""
        sql_statements.append(sql)

    return '\n'.join(sql_statements)

def main():
    """Main function"""
    # Load metadata
    data = load_metadata()
    projects = data['projects']

    print(f"Loaded {len(projects)} projects", file=sys.stderr)

    # Generate stages SQL
    stages_sql = generate_stages_sql(projects)
    with open('import_icarus_stages.sql', 'w', encoding='utf-8') as f:
        f.write(stages_sql)
    print("Generated import_icarus_stages.sql", file=sys.stderr)

    # Generate contents SQL
    contents_sql = generate_contents_sql(projects)
    with open('import_icarus_contents.sql', 'w', encoding='utf-8') as f:
        f.write(contents_sql)
    print("Generated import_icarus_contents.sql", file=sys.stderr)

    print("\nDone! SQL files generated:", file=sys.stderr)
    print("1. import_icarus_stages.sql", file=sys.stderr)
    print("2. import_icarus_contents.sql", file=sys.stderr)

if __name__ == '__main__':
    main()
