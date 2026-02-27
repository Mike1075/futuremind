# -*- coding: utf-8 -*-
"""
fix_order.py - 修复13天语序错误的音频

对每一天：
1. 全文TTS重录（不上传）
2. Whisper 转录验证
3. 检查覆盖率 + 语序
4. 全部通过才上传
"""

import json
import os
import sys
import time
from pathlib import Path

# 使用本地缓存的 HuggingFace 模型
os.environ["HF_HUB_OFFLINE"] = "1"

# Windows 控制台 UTF-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, r"D:\CursorWork\doubao\yuyinhecheng")

from config import COURSES, WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
from main import fetch_course_data, clean_db_text
from analyze import flatten_to_chars, chars_to_pinyin
from check_order import analyze_day, strip_punctuation
import fix_audio
from fix_audio import (
    regenerate_full_tts, upload_to_supabase, get_storage_path_from_url,
    FIX_OUTPUT_DIR,
)
import difflib

# 需要修复的13天
DAYS_TO_FIX = [
    ("dependency_freedom", 28),
    ("desire_flame", 4),
    ("wisdom_awakening", 2),
    ("wisdom_awakening", 16),
    ("wisdom_awakening", 19),
    ("wisdom_awakening", 21),
    ("wisdom_awakening", 24),
    ("wisdom_awakening", 26),
    ("wisdom_awakening", 30),
    ("energy_alchemy", 9),
    ("energy_alchemy", 19),
    ("energy_alchemy", 20),
    ("energy_alchemy", 23),
]

# 覆盖率阈值
COVERAGE_THRESHOLD = 95.0

# Whisper 模型（共享）
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print(f"加载 Whisper: {WHISPER_MODEL} ({WHISPER_DEVICE}, {WHISPER_COMPUTE_TYPE})...")
        _whisper_model = WhisperModel(
            WHISPER_MODEL, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE,
        )
        print("模型加载完成")
        # 共享给 fix_audio
        fix_audio._whisper_model = _whisper_model
    return _whisper_model


def transcribe(audio_path):
    model = get_whisper_model()
    segments_iter, info = model.transcribe(
        str(audio_path), language="zh", vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        beam_size=5, word_timestamps=False,
    )
    segments = []
    text_parts = []
    for seg in segments_iter:
        segments.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
        text_parts.append(seg.text.strip())
    return {
        "text": "\n".join(text_parts),
        "segments": segments,
        "duration": round(info.duration, 1),
    }


def compute_coverage(db_text, transcription):
    cleaned = clean_db_text(db_text)
    tr_text = transcription["text"].replace("\n", "")
    db_chars = flatten_to_chars(cleaned)
    tr_chars = flatten_to_chars(tr_text)
    if not db_chars:
        return 100.0
    db_py = chars_to_pinyin(db_chars)
    tr_py = chars_to_pinyin(tr_chars)
    sm = difflib.SequenceMatcher(None, db_py, tr_py, autojunk=False)
    matched = sum(i2 - i1 for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag == "equal")
    return matched / len(db_chars) * 100


def check_order(segments, db_text):
    """检查语序，返回 (ok, issues_list)"""
    result = analyze_day(segments, db_text)
    return len(result["issues"]) == 0, result["issues"]


def main():
    print(f"\n{'='*60}")
    print(f"修复13天语序错误音频 - 全文TTS重录")
    print(f"{'='*60}")

    # 预先获取所有课程数据
    course_data_cache = {}
    courses_needed = set(sk for sk, _ in DAYS_TO_FIX)
    for sk in courses_needed:
        print(f"  获取 {COURSES[sk]['title']} 数据...")
        items = fetch_course_data(sk)
        course_data_cache[sk] = {item["sequence_number"]: item for item in items}

    results = []

    for system_key, day in DAYS_TO_FIX:
        title = COURSES[system_key]["title"]
        print(f"\n--- {title} Day {day} ---")

        item = course_data_cache[system_key].get(day)
        if not item:
            print(f"  未找到课程数据!")
            results.append((system_key, day, "无数据", 0, []))
            continue

        meditation_guide = item.get("meditation_guide", "")
        audio_url = item.get("audio_url", "")

        if not meditation_guide or not audio_url:
            print(f"  缺少 meditation_guide 或 audio_url!")
            results.append((system_key, day, "缺数据", 0, []))
            continue

        # 1. 全文TTS重录（不上传）
        print(f"  TTS重录...", flush=True)
        regen_result = regenerate_full_tts(
            system_key, day, meditation_guide, audio_url, do_upload=False
        )

        if regen_result["status"] in ("tts_failed", "empty", "merge_failed"):
            print(f"  重录失败: {regen_result['status']}")
            results.append((system_key, day, regen_result["status"], 0, []))
            continue

        # 2. 转录验证
        output_file = FIX_OUTPUT_DIR / system_key / f"day_{day}.mp3"
        if not output_file.exists():
            print(f"  输出文件不存在!")
            results.append((system_key, day, "无输出", 0, []))
            continue

        print(f"  Whisper验证...", end="", flush=True)
        tr = transcribe(str(output_file))

        # 3. 检查覆盖率
        coverage = compute_coverage(meditation_guide, tr)
        print(f" 覆盖率={coverage:.1f}%", end="")

        # 4. 检查语序
        order_ok, order_issues = check_order(tr["segments"], meditation_guide)
        if order_ok:
            print(f" 语序OK", end="")
        else:
            print(f" 语序问题: {order_issues}", end="")

        # 5. 判断是否上传
        if coverage >= COVERAGE_THRESHOLD and order_ok:
            storage_path = get_storage_path_from_url(audio_url)
            if storage_path:
                print(f"\n  上传...", end="", flush=True)
                upload_url = upload_to_supabase(str(output_file), storage_path)
                if upload_url:
                    print(f" 成功! ✓")
                    results.append((system_key, day, "已修复", coverage, []))
                else:
                    print(f" 失败!")
                    results.append((system_key, day, "上传失败", coverage, []))
            else:
                print(f"\n  无法获取存储路径!")
                results.append((system_key, day, "路径错误", coverage, []))
        else:
            reasons = []
            if coverage < COVERAGE_THRESHOLD:
                reasons.append(f"覆盖率{coverage:.1f}%<{COVERAGE_THRESHOLD}%")
            if not order_ok:
                reasons.append(f"语序: {order_issues}")
            print(f"\n  未通过验证: {', '.join(reasons)}")
            results.append((system_key, day, "未通过", coverage, reasons))

        time.sleep(0.5)

    # 汇总
    print(f"\n{'='*60}")
    print(f"=== 修复结果 ===")
    fixed = [r for r in results if r[2] == "已修复"]
    failed = [r for r in results if r[2] != "已修复"]
    print(f"  成功: {len(fixed)}/{len(DAYS_TO_FIX)}")

    if fixed:
        print(f"\n  ✓ 修复成功:")
        for sk, day, status, cov, _ in fixed:
            print(f"    {COURSES[sk]['title']} Day {day}: 覆盖率{cov:.1f}%")

    if failed:
        print(f"\n  ✗ 需复查:")
        for sk, day, status, cov, reasons in failed:
            print(f"    {COURSES[sk]['title']} Day {day}: {status} (覆盖率{cov:.1f}%)")
            for r in reasons:
                print(f"      {r}")

    print(f"{'='*60}")


if __name__ == "__main__":
    main()
