"""
spot_check.py - 随机抽查其他天数的音频质量

从不同类别中抽取样本：
- fix_audio.py 修改过但扫描正常的天
- 从未修改的天
- fix_replace.py 修复过的天
"""

import sys
import json
import os
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from config import COURSES
from main import fetch_course_data, clean_db_text, http_get, transcribe_audio
from fix_audio import compute_coverage
from analyze import strip_all, flatten_to_chars

# 抽查样本（从各类别中选取）
SPOT_CHECK = [
    # fix_audio.py 修改过，扫描正常（从75天中选）
    ("dependency_freedom", 3, "fix_audio modified"),
    ("dependency_freedom", 7, "fix_audio modified"),
    ("dependency_freedom", 20, "fix_audio modified"),
    ("desire_flame", 5, "fix_audio modified"),
    ("desire_flame", 15, "fix_audio modified"),
    ("wisdom_awakening", 10, "fix_audio modified"),
    ("wisdom_awakening", 20, "fix_audio modified"),
    ("energy_alchemy", 7, "fix_audio modified"),
    ("energy_alchemy", 20, "fix_audio modified"),
    # 从未修改的天（从26天中选）
    ("dependency_freedom", 9, "unmodified"),
    ("desire_flame", 2, "unmodified"),
    ("wisdom_awakening", 1, "unmodified"),
    ("energy_alchemy", 1, "unmodified"),
    # fix_replace.py 修复过的天（从10天中选）
    ("dependency_freedom", 13, "fix_replace fixed"),
    ("desire_flame", 1, "fix_replace fixed"),
    ("desire_flame", 8, "fix_replace fixed"),
    ("energy_alchemy", 15, "fix_replace fixed"),
]


def find_significant_repeats(text, min_len=20):
    """检查转录文本中是否有显著重复（排除Whisper幻觉短重复）"""
    chars = text.replace("\n", "").replace(" ", "")
    repeats = []
    # 只检查较长的重复（>=20字），短重复多为Whisper幻觉
    for length in range(min_len, min(100, len(chars) // 2)):
        for i in range(len(chars) - length * 2):
            chunk = chars[i:i+length]
            rest = chars[i+length:]
            pos = rest.find(chunk)
            if pos != -1 and pos < length * 2:
                repeats.append((chunk, length))
                break  # 找到这个长度的就够了
        if len(repeats) >= 3:
            break
    return repeats


def main():
    # 获取课程数据
    course_data_cache = {}
    courses_needed = set(sk for sk, _, _ in SPOT_CHECK)
    for system_key in courses_needed:
        info = COURSES[system_key]
        print(f"Getting data: {info['title']}...")
        course_data = fetch_course_data(system_key)
        course_data_cache[system_key] = {
            item["sequence_number"]: item for item in course_data
        }

    verify_dir = Path(__file__).parent / "verify"
    verify_dir.mkdir(exist_ok=True)

    results = []

    for system_key, day_num, category in SPOT_CHECK:
        info = COURSES[system_key]
        item = course_data_cache.get(system_key, {}).get(day_num)
        if not item or not item.get("audio_url") or not item.get("meditation_guide"):
            print(f"\n[{info['month']}月 Day {day_num}] ({category}): SKIP - no data")
            continue

        audio_url = item["audio_url"]
        audio_file = verify_dir / f"{system_key}_day_{day_num}.mp3"

        print(f"\n[{info['month']}月 Day {day_num}] ({category})")

        # 下载
        if not audio_file.exists():
            print(f"  Downloading...")
            try:
                data = http_get(audio_url)
                audio_file.write_bytes(data)
                print(f"  Downloaded: {len(data)//1024}KB")
            except Exception as e:
                print(f"  Download failed: {e}")
                results.append((system_key, day_num, category, "download_fail", 0, 0, []))
                continue

        # 转录
        cache_file = verify_dir / f"{system_key}_day_{day_num}_transcript.json"
        if not cache_file.exists():
            print(f"  Transcribing...")
            transcription = transcribe_audio(audio_file, cache_file)
        else:
            with open(cache_file, "r", encoding="utf-8") as f:
                transcription = json.load(f)

        # 覆盖率
        coverage = compute_coverage(item["meditation_guide"], transcription)

        # 长度比
        cleaned_db = clean_db_text(item["meditation_guide"])
        db_chars = len(flatten_to_chars(cleaned_db))
        tr_text = transcription.get("text", "")
        tr_chars = len(flatten_to_chars(tr_text))
        ratio = tr_chars / db_chars if db_chars > 0 else 0

        # 重复检测
        repeats = find_significant_repeats(tr_text)

        # 判定
        issues = []
        if coverage < 85:
            issues.append(f"low coverage {coverage:.0f}%")
        if repeats:
            issues.append(f"{len(repeats)} repeats(longest={len(repeats[0][0])}chars)")
        if ratio > 1.4:
            issues.append(f"ratio too high {ratio:.2f}")
        if ratio < 0.7:
            issues.append(f"ratio too low {ratio:.2f}")

        status = "WARN" if issues else "OK"
        issue_str = ", ".join(issues) if issues else "none"
        print(f"  Coverage={coverage:.1f}%, Ratio={ratio:.2f}, Issues: {issue_str}")

        results.append((system_key, day_num, category, status, coverage, ratio, issues))

    # 汇总报告
    print(f"\n{'='*70}")
    print("Spot Check Summary")
    print(f"{'='*70}")

    for category_label in ["fix_audio modified", "unmodified", "fix_replace fixed"]:
        cat_results = [(sk, d, cat, st, cov, rat, iss) for sk, d, cat, st, cov, rat, iss in results if cat == category_label]
        if not cat_results:
            continue
        print(f"\n  --- {category_label} ---")
        for sk, d, cat, st, cov, rat, iss in cat_results:
            month = COURSES[sk]["month"]
            icon = "[OK]" if st == "OK" else "[!!]"
            issue_str = " | " + ", ".join(iss) if iss else ""
            print(f"    {icon} {month}月 Day {d:2d}: coverage={cov:.1f}%, ratio={rat:.2f}{issue_str}")

    ok_count = sum(1 for _, _, _, st, _, _, _ in results if st == "OK")
    warn_count = sum(1 for _, _, _, st, _, _, _ in results if st == "WARN")
    total = len(results)
    print(f"\n  Total: {ok_count}/{total} OK, {warn_count} warnings")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
