#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Split the large SQL file into individual UPDATE statements for execution
"""

import os
import re
import sys

# Force UTF-8 output
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def split_sql_updates():
    """Read SQL file and split into individual UPDATE statements"""
    sql_file = os.path.join(os.path.dirname(__file__), 'update_full_week_plans.sql')

    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by project comments
    pattern = r'-- Project (\d+): ([^\n]+)\n(UPDATE course_contents.*?;)\n'
    matches = re.findall(pattern, content, re.DOTALL)

    # Create individual SQL files
    output_dir = os.path.join(os.path.dirname(__file__), 'sql_updates')
    os.makedirs(output_dir, exist_ok=True)

    for project_num, project_name, update_sql in matches:
        output_file = os.path.join(output_dir, f'update_project_{project_num.zfill(2)}.sql')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"-- Project {project_num}: {project_name}\n")
            f.write(update_sql)
            f.write('\n')
        print(f"✓ Created: update_project_{project_num.zfill(2)}.sql - {project_name}")

    print(f"\n✓ Split into {len(matches)} individual SQL files")
    print(f"✓ Output directory: {output_dir}")
    return len(matches)

if __name__ == '__main__':
    count = split_sql_updates()
    print(f"\nNext: Execute each SQL file via Supabase MCP tool")
