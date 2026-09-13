# -*- coding: utf-8 -*-
"""
find_short_gaps.py - 找出被阈值过滤掉的短缺失内容

之前 MIN_GAP_PINYIN_LEN=15 过滤了 4 字以下的缺失（如"只有声音"=14拼音）。
本脚本用更低阈值（8拼音≈3汉字）重新扫描所有课程，找出所有短缺失。
"""
import json, os, re, sys, difflib
from pathlib import Path

# Windows UTF-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import COURSES
from main import fetch_course_data, clean_db_text, CACHE_PATH
from analyze import flatten_to_chars, chars_to_pinyin, strip_all

# 新的更低阈值：8拼音 ≈ 3个汉字
SHORT_GAP_MIN = 8
# 旧阈值（之前已修复的都>=15）
OLD_MIN = 15

SCRIPT_DIR = Path(__file__).parent
OUTPUT_PATH = SCRIPT_DIR / "output"


def find_gaps_with_threshold(db_text, tr_text, min_pinyin_len):
    """用指定阈值找缺失内容"""
    cleaned = clean_db_text(db_text)
    db_chars = flatten_to_chars(cleaned)
    tr_chars = flatten_to_chars(tr_text)

    if not db_chars:
        return []

    db_pinyin = chars_to_pinyin(db_chars)
    tr_pinyin = chars_to_pinyin(tr_chars)

    sm = difflib.SequenceMatcher(None, db_pinyin, tr_pinyin, autojunk=False)

    gaps = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'delete':
            chunk_chars = db_chars[i1:i2]
            chunk_text = ''.join(chunk_chars)
            chunk_pinyin_len = sum(len(p) for p in db_pinyin[i1:i2])
            char_count = len(chunk_chars)

            if chunk_pinyin_len >= min_pinyin_len:
                # 在原文中找上下文
                context_before = ''.join(db_chars[max(0, i1-6):i1])
                context_after = ''.join(db_chars[i2:min(len(db_chars), i2+6)])
                gaps.append({
                    'text': chunk_text,
                    'chars': char_count,
                    'pinyin_len': chunk_pinyin_len,
                    'context': f"...{context_before}【{chunk_text}】{context_after}...",
                    'was_detected': chunk_pinyin_len >= OLD_MIN,
                })

    return gaps


def main():
    print("=" * 60)
    print("  扫描被阈值过滤的短缺失内容")
    print(f"  新阈值: {SHORT_GAP_MIN} (旧: {OLD_MIN})")
    print("=" * 60)

    all_new_gaps = []  # 之前没发现的
    all_gaps = []      # 所有的

    for course_key, info in COURSES.items():
        title = info['title']
        print(f"\n--- {title} ---")

        items = fetch_course_data(course_key)
        item_map = {item['sequence_number']: item for item in items}

        for day in range(1, info['days'] + 1):
            # 加载转录缓存
            cache_file = CACHE_PATH / course_key / f"day_{day}.json"
            if not cache_file.exists():
                continue

            with open(cache_file, 'r', encoding='utf-8') as f:
                cache = json.load(f)

            tr_text = cache.get('text', '')
            if not tr_text:
                continue

            item = item_map.get(day)
            if not item:
                continue

            db_text = item.get('meditation_guide', '')
            if not db_text:
                continue

            gaps = find_gaps_with_threshold(db_text, tr_text, SHORT_GAP_MIN)

            for g in gaps:
                g['course'] = course_key
                g['course_title'] = title
                g['day'] = day
                all_gaps.append(g)

                if not g['was_detected']:
                    all_new_gaps.append(g)
                    print(f"  Day {day:2d}: ★新发现 [{g['chars']}字,{g['pinyin_len']}py] {g['context']}")

    # 汇总
    print(f"\n{'=' * 60}")
    print(f"  扫描结果汇总")
    print(f"{'=' * 60}")
    print(f"  总缺失: {len(all_gaps)} 处")
    print(f"  之前已发现(>=15py): {sum(1 for g in all_gaps if g['was_detected'])} 处")
    print(f"  ★新发现({SHORT_GAP_MIN}-14py): {len(all_new_gaps)} 处")

    if all_new_gaps:
        print(f"\n  新发现的短缺失详情:")
        for g in all_new_gaps:
            print(f"    {g['course_title']} Day {g['day']:2d}: "
                  f"[{g['chars']}字] {g['context']}")

    # 保存结果
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_PATH / "short_gaps_report.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(all_new_gaps, f, ensure_ascii=False, indent=2)
    print(f"\n  报告已保存: {out_file}")


if __name__ == '__main__':
    main()
