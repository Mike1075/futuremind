# -*- coding: utf-8 -*-
"""找出匹配率低或起始位置异常的天"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check_order import load_transcript_cache, analyze_day, fetch_course_contents
from config import COURSES

suspicious = []
for course_key, info in COURSES.items():
    db_guides = fetch_course_contents(info['system_id'])
    for day in range(1, info['days'] + 1):
        cache = load_transcript_cache(course_key, day)
        if not cache: continue
        db_text = db_guides.get(day, '')
        if not db_text: continue
        segments = cache.get('segments', [])
        if not segments: continue

        result = analyze_day(segments, db_text)
        total = result['total']
        matched = result['matched']
        unmatched_pct = (total - matched) / total * 100 if total > 0 else 0

        # 低匹配率(>25%)或负起始位置
        if unmatched_pct > 25 or result['start_pct'] < 0:
            first_5 = [s['text'][:15] for s in segments[:5]]
            suspicious.append({
                'course': course_key,
                'day': day,
                'start_pct': result['start_pct'],
                'matched': matched,
                'total': total,
                'unmatched_pct': round(unmatched_pct, 1),
                'order': round(result['order_score'], 2),
                'first_5_segs': first_5,
                'db_start': result['first_db'][:50],
            })

print(f"Found {len(suspicious)} suspicious days (>25% unmatched or start<0):\n")
for s in suspicious:
    pct = s['unmatched_pct']
    print(f"  {s['course']} Day {s['day']:2d}: start={s['start_pct']}%  matched={s['matched']}/{s['total']} ({pct}% unmatched)  order={s['order']}")
    print(f"    audio start: {' | '.join(s['first_5_segs'])}")
    print(f"    db start:    {s['db_start']}")
    print()
