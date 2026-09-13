"""
verify_regen.py - 验证重新生成的音频质量

下载重新生成的音频，转录后检查：
1. 没有重复段落
2. 文本覆盖率正常
"""

import sys
import json
import os
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from config import COURSES
from main import fetch_course_data, clean_db_text, http_get, transcribe_audio
from fix_audio import compute_coverage
from analyze import strip_all, flatten_to_chars

# 验证列表（与 regen_corrupted.py 一致）
VERIFY_LIST = [
    ("dependency_freedom", 1),
    ("dependency_freedom", 2),
    ("dependency_freedom", 4),
    ("dependency_freedom", 5),
    ("dependency_freedom", 12),
    ("desire_flame", 18),
    ("wisdom_awakening", 4),
    ("wisdom_awakening", 30),
    ("energy_alchemy", 3),
    ("energy_alchemy", 10),
    ("energy_alchemy", 16),
]


def find_repeats(text, min_len=15):
    """检查文本中是否有重复的长片段"""
    repeats = []
    words = text.replace("\n", "")
    for length in range(min_len, min(80, len(words) // 2)):
        for i in range(len(words) - length * 2):
            chunk = words[i:i+length]
            rest = words[i+length:]
            pos = rest.find(chunk)
            if pos != -1 and pos < length * 3:  # 重复出现在附近
                repeats.append((chunk, i, i + length + pos))
    # 去重：保留最长的
    if not repeats:
        return []
    repeats.sort(key=lambda x: len(x[0]), reverse=True)
    filtered = []
    seen_ranges = set()
    for chunk, start, end in repeats:
        overlap = False
        for s, e in seen_ranges:
            if start < e and end > s:
                overlap = True
                break
        if not overlap:
            filtered.append((chunk, start, end))
            seen_ranges.add((start, end))
    return filtered


def main():
    import argparse
    parser = argparse.ArgumentParser(description="验证重新生成的音频")
    parser.add_argument("--quick", action="store_true",
                        help="只验证前3个（快速检查）")
    args = parser.parse_args()

    verify_list = VERIFY_LIST[:3] if args.quick else VERIFY_LIST

    # 获取课程数据
    course_data_cache = {}
    courses_needed = set(sk for sk, _ in verify_list)
    for system_key in courses_needed:
        info = COURSES[system_key]
        print(f"Getting course data: {info['title']}...")
        course_data = fetch_course_data(system_key)
        course_data_cache[system_key] = {
            item["sequence_number"]: item for item in course_data
        }

    # 下载 + 转录 + 验证
    verify_dir = Path(__file__).parent / "verify"
    verify_dir.mkdir(exist_ok=True)

    results = []

    for system_key, day_num in verify_list:
        info = COURSES[system_key]
        item = course_data_cache.get(system_key, {}).get(day_num)
        if not item:
            print(f"\n[{info['title']}] Day {day_num}: No data!")
            results.append((system_key, day_num, "no_data", 0, []))
            continue

        audio_url = item.get("audio_url")
        if not audio_url:
            print(f"\n[{info['title']}] Day {day_num}: No audio URL!")
            results.append((system_key, day_num, "no_url", 0, []))
            continue

        # 下载新音频（强制重新下载）
        audio_file = verify_dir / f"{system_key}_day_{day_num}.mp3"
        print(f"\n[{info['title']}] Day {day_num}: Downloading fresh...")
        try:
            data = http_get(audio_url)
            audio_file.write_bytes(data)
            size_kb = len(data) // 1024
            print(f"  Downloaded: {size_kb}KB")
        except Exception as e:
            print(f"  Download failed: {e}")
            results.append((system_key, day_num, "download_failed", 0, []))
            continue

        # 转录（不用缓存）
        cache_file = verify_dir / f"{system_key}_day_{day_num}_transcript.json"
        print(f"  Transcribing...")
        transcription = transcribe_audio(audio_file, cache_file)

        # 检查覆盖率
        coverage = compute_coverage(item["meditation_guide"], transcription)
        print(f"  Coverage: {coverage:.1f}%")

        # 检查重复
        tr_text = transcription.get("text", "")
        repeats = find_repeats(tr_text)
        if repeats:
            print(f"  WARNING: Found {len(repeats)} repeats!")
            for chunk, start, end in repeats[:3]:
                print(f"    '{chunk[:40]}...' at positions {start}-{end}")
        else:
            print(f"  No repeats detected")

        # 检查转录长度 vs 数据库文本长度
        cleaned_db = clean_db_text(item["meditation_guide"])
        db_chars = len(flatten_to_chars(cleaned_db))
        tr_chars = len(flatten_to_chars(tr_text))
        ratio = tr_chars / db_chars if db_chars > 0 else 0
        print(f"  Text length: DB={db_chars}, Transcription={tr_chars}, Ratio={ratio:.2f}")

        status = "OK" if coverage >= 85 and not repeats and 0.8 <= ratio <= 1.3 else "WARN"
        results.append((system_key, day_num, status, coverage, repeats))

    # 汇总
    print(f"\n{'='*60}")
    print("Verification Summary")
    print(f"{'='*60}")
    ok_count = 0
    warn_count = 0
    for system_key, day_num, status, coverage, repeats in results:
        month = COURSES[system_key]["month"]
        repeat_info = f", {len(repeats)} repeats" if repeats else ""
        icon = "[OK]" if status == "OK" else "[!!]"
        print(f"  {icon} {month}月 Day {day_num}: {status} (coverage={coverage:.1f}%{repeat_info})")
        if status == "OK":
            ok_count += 1
        else:
            warn_count += 1

    print(f"\nTotal: {ok_count} OK, {warn_count} warnings out of {len(results)}")


if __name__ == "__main__":
    main()
