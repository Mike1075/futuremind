#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Direct import script - generates individual INSERT commands that can be copy-pasted into MCP
"""

import json
import os

SYSTEM_ID = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'

def load_metadata():
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

def main():
    data = load_metadata()
    projects = data['projects']

    print("=" * 80)
    print(f"Loaded {len(projects)} projects")
    print("=" * 80)
    print()

    # Print summary
    for idx, project in enumerate(projects, 1):
        stage_name = project['stage_name']
        age_range = project['suggested_age_range']
        duration = project['duration_weeks']
        module = project['module_category'].split('(')[0].strip()

        # Normalize objectives
        objectives_text = normalize_text(project.get('core_objectives', ''))
        objectives_list = [obj.strip() for obj in objectives_text.split('。')[:5] if obj.strip()]

        print(f"{idx}. {stage_name}")
        print(f"   Age: {age_range}, Duration: {duration} weeks, Module: {module}")
        print(f"   Objectives ({len(objectives_list)}): {objectives_list[0][:50]}...")
        print()

    print("\n" + "=" * 80)
    print(f"Ready to import {len(projects)} projects to Supabase")
    print("Please execute the generated SQL files via MCP tools")
    print("=" * 80)

if __name__ == '__main__':
    main()
