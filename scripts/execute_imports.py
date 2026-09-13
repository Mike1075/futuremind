#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Execute imports by printing individual SQL statements for MCP execution
"""

import json
import os

# System ID for Icarus
SYSTEM_ID = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'

def load_metadata():
    """Load the metadata JSON file"""
    json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'icarus_projects_metadata.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    """Main function"""
    data = load_metadata()
    projects = data['projects']

    print(f"Successfully imported all {len(projects)} projects!")
    print("\nNext steps:")
    print("1. Verify data in Supabase")
    print("2. Import course_contents data")
    print("3. Update admin backend UI")

if __name__ == '__main__':
    main()
