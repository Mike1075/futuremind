"""
regen_corrupted.py - 重新生成被损坏的11天冥想音频

这11天音频需要重新生成：
- 9天被 fix_audio.py 错误损坏（有重复段落）
- 2天原始TTS就有重复

使用数据库中的 meditation_guide 文本，通过豆包TTS全文重录。
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from config import COURSES
from main import fetch_course_data
from fix_audio import (
    regenerate_full_tts,
    FIX_DIR, FIX_TTS_DIR, FIX_OUTPUT_DIR,
)

# 需要重新生成的11天
REGEN_LIST = [
    # 3月 Day 1: 已完成 (4356KB, uploaded)
    # ("dependency_freedom", 1),
    ("dependency_freedom", 2),
    ("dependency_freedom", 4),
    # 3月：原始TTS重复
    ("dependency_freedom", 5),
    # 3月：被 fix_audio.py 损坏
    ("dependency_freedom", 12),
    # 4月：被 fix_audio.py 损坏
    ("desire_flame", 18),
    # 5月：原始TTS重复
    ("wisdom_awakening", 4),
    # 5月：被 fix_audio.py 损坏
    ("wisdom_awakening", 30),
    # 6月：被 fix_audio.py 损坏
    ("energy_alchemy", 3),
    ("energy_alchemy", 10),
    ("energy_alchemy", 16),
]


def main():
    import argparse
    parser = argparse.ArgumentParser(description="重新生成被损坏的冥想音频")
    parser.add_argument("--no-upload", action="store_true",
                        help="只生成本地文件，不上传到 Supabase")
    parser.add_argument("--dry-run", action="store_true",
                        help="只显示计划，不执行")
    args = parser.parse_args()

    FIX_DIR.mkdir(parents=True, exist_ok=True)
    FIX_TTS_DIR.mkdir(parents=True, exist_ok=True)
    FIX_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"重新生成被损坏的冥想音频 ({len(REGEN_LIST)} 天)")
    print(f"{'='*60}")

    # 按课程分组获取数据
    course_data_cache = {}
    courses_needed = set(sk for sk, _ in REGEN_LIST)

    for system_key in courses_needed:
        info = COURSES[system_key]
        print(f"\n获取课程数据: {info['title']}...")
        course_data = fetch_course_data(system_key)
        # 建立 day -> item 映射
        course_data_cache[system_key] = {
            item["sequence_number"]: item for item in course_data
        }

    # 逐个重新生成
    success = 0
    failed = 0

    for system_key, day_num in REGEN_LIST:
        info = COURSES[system_key]
        item = course_data_cache.get(system_key, {}).get(day_num)

        if not item:
            print(f"\n[{info['title']}] Day {day_num}: 未找到课程数据!")
            failed += 1
            continue

        if not item.get("meditation_guide"):
            print(f"\n[{info['title']}] Day {day_num}: meditation_guide 为空!")
            failed += 1
            continue

        audio_url = item.get("audio_url")
        guide_len = len(item["meditation_guide"])
        print(f"\n[{info['title']}] Day {day_num}: 引导文本 {guide_len} 字")

        if args.dry_run:
            print(f"  (dry-run) 将重新生成 TTS 并{'不上传' if args.no_upload else '上传'}到 Supabase")
            success += 1
            continue

        result = regenerate_full_tts(
            system_key, day_num,
            item["meditation_guide"],
            audio_url,
            do_upload=not args.no_upload,
        )

        status = result.get("status", "unknown")
        if status in ("regen_done", "regen_local"):
            print(f"  [OK] 成功 ({status})")
            success += 1
        else:
            print(f"  [FAIL] 失败 ({status})")
            failed += 1

        # 每天之间稍等，避免 TTS API 过载
        time.sleep(1)

    print(f"\n{'='*60}")
    print(f"完成: 成功 {success}/{len(REGEN_LIST)}, 失败 {failed}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
