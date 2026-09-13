# -*- coding: utf-8 -*-
"""
verify_fix.py - 验证冥想音频修复质量

抽检修复后的音频，用 Whisper 转录后与数据库文本对比覆盖率。
- 全文TTS重录的天：全部抽检
- 补丁修复的天：每课程随机抽3天

用法: python verify_fix.py
"""

import json
import os
import sys
import re
import time
import random
import difflib
import ssl
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

# 使用本地缓存的 HuggingFace 模型，避免网络问题
os.environ["HF_HUB_OFFLINE"] = "1"

# Windows 控制台 UTF-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from config import COURSES, SUPABASE_URL, SUPABASE_ANON_KEY, WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
from main import fetch_course_data, clean_db_text
from analyze import flatten_to_chars, chars_to_pinyin

# 目录
FIX_OUTPUT_DIR = SCRIPT_DIR / "fix" / "output"
FIX_TTS_DIR = SCRIPT_DIR / "fix" / "tts"
VERIFY_DIR = SCRIPT_DIR / "fix" / "verify"
VERIFY_DIR.mkdir(parents=True, exist_ok=True)

# SSL
SSL_CTX = ssl.create_default_context()

# 随机种子（可复现）
random.seed(42)

# 每课程补丁修复抽检数
PATCH_SAMPLE_COUNT = 3


def http_get(url, retries=3):
    for attempt in range(retries):
        try:
            req = Request(url, headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            })
            with urlopen(req, context=SSL_CTX, timeout=60) as resp:
                return resp.read()
        except (URLError, ssl.SSLError, TimeoutError) as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise


def download_audio(url, local_path):
    """下载音频到本地"""
    if local_path.exists():
        return True
    try:
        data = http_get(url)
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(data)
        return True
    except Exception as e:
        print(f"    download failed: {e}")
        return False


# Whisper 模型（懒加载）
_whisper_model = None


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print(f"Loading Whisper: {WHISPER_MODEL} ({WHISPER_DEVICE}, {WHISPER_COMPUTE_TYPE})...")
        _whisper_model = WhisperModel(
            WHISPER_MODEL,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
        )
        print("Model loaded")
    return _whisper_model


def transcribe(audio_path, cache_path):
    """转录音频，返回 {"text": str, "segments": [...], "duration": float}"""
    if cache_path.exists():
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    model = get_whisper_model()
    segments_iter, info = model.transcribe(
        str(audio_path),
        language="zh",
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        beam_size=5,
        word_timestamps=False,
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

    result = {
        "text": "\n".join(text_parts),
        "segments": segments,
        "duration": round(info.duration, 1),
    }

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return result


def compute_coverage(db_text, transcription):
    """计算覆盖率：数据库文本中有多少比例被音频转录覆盖"""
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


def classify_day(system_key, day_num):
    """
    判断一天的修复类型:
    - "regen": 全文TTS重录
    - "patch": 补丁修复
    - "none": 未修复
    """
    output_file = FIX_OUTPUT_DIR / system_key / f"day_{day_num}.mp3"
    regen_dir = FIX_TTS_DIR / system_key / f"day_{day_num}_regen"

    if not output_file.exists():
        return "none"
    if regen_dir.exists():
        return "regen"
    return "patch"


def select_sample(system_key, course_data):
    """
    选择抽检天:
    - 全部 regen 天
    - 从 patch 天中随机抽 PATCH_SAMPLE_COUNT 天
    """
    regen_days = []
    patch_days = []
    none_days = []

    for item in course_data:
        day = item["sequence_number"]
        if not item["meditation_guide"] or not item["audio_url"]:
            continue
        fix_type = classify_day(system_key, day)
        if fix_type == "regen":
            regen_days.append(item)
        elif fix_type == "patch":
            patch_days.append(item)
        else:
            none_days.append(item)

    # 从 patch 天随机抽样
    patch_sample = random.sample(patch_days, min(PATCH_SAMPLE_COUNT, len(patch_days)))

    sample = []
    for item in regen_days:
        sample.append((item, "regen"))
    for item in patch_sample:
        sample.append((item, "patch"))

    # 按 day 排序
    sample.sort(key=lambda x: x[0]["sequence_number"])

    return sample, len(regen_days), len(patch_days), len(none_days)


def main():
    print("=" * 60)
    print("=== Meditation Audio Fix Verification ===")
    print("=" * 60)

    all_results = {}
    total_checked = 0
    total_ge90 = 0
    total_80_90 = 0
    total_lt80 = 0
    needs_review = []

    for system_key, info in COURSES.items():
        title = info["title"]
        print(f"\n--- {title} ---")

        # 获取课程数据
        print(f"  Fetching course data...", flush=True)
        course_data = fetch_course_data(system_key)

        # 选择抽检样本
        sample, regen_count, patch_count, none_count = select_sample(system_key, course_data)
        print(f"  Fix stats: regen={regen_count}, patch={patch_count}, unchanged={none_count}")
        print(f"  Sampling: {len(sample)} days (all regen + {min(PATCH_SAMPLE_COUNT, patch_count)} patch samples)")

        course_results = []

        for item, fix_type in sample:
            day = item["sequence_number"]
            audio_url = item["audio_url"]
            label = "regen" if fix_type == "regen" else "patch"

            # 下载修复后的音频（从 Supabase Storage）
            audio_dir = VERIFY_DIR / system_key
            audio_dir.mkdir(parents=True, exist_ok=True)
            audio_file = audio_dir / f"day_{day}.mp3"
            cache_file = audio_dir / f"day_{day}_transcript.json"

            if not audio_file.exists():
                print(f"  Day {day} [{label}]: downloading...", end="", flush=True)
                if not download_audio(audio_url, audio_file):
                    print(f" FAILED!")
                    course_results.append({
                        "day": day, "fix_type": fix_type,
                        "coverage": 0, "error": "download_failed",
                    })
                    continue
                print(f" OK", flush=True)

            # 转录
            if not cache_file.exists():
                print(f"  Day {day} [{label}]: transcribing...", end="", flush=True)
                t0 = time.time()
                tr = transcribe(audio_file, cache_file)
                elapsed = time.time() - t0
                print(f" ({elapsed:.1f}s)", flush=True)
            else:
                tr = transcribe(audio_file, cache_file)

            # 计算覆盖率
            coverage = compute_coverage(item["meditation_guide"], tr)

            # 状态标记（ASCII safe）
            if coverage >= 90:
                marker = "PASS"
                total_ge90 += 1
            elif coverage >= 80:
                marker = "WARN (<90%)"
                total_80_90 += 1
                needs_review.append((title, day, coverage))
            else:
                marker = "FAIL"
                total_lt80 += 1
                needs_review.append((title, day, coverage))

            total_checked += 1
            print(f"  Day {day} [{label}]: coverage {coverage:.1f}% {marker}")

            course_results.append({
                "day": day, "fix_type": fix_type, "coverage": coverage,
            })

        all_results[system_key] = course_results

    # 汇总
    print(f"\n{'=' * 60}")
    print(f"=== VERIFICATION SUMMARY ===")
    print(f"  Total checked: {total_checked} days")
    if total_checked > 0:
        print(f"  >=90%: {total_ge90} days ({total_ge90/total_checked*100:.1f}%)")
        print(f"  80-90%: {total_80_90} days")
        print(f"  <80%: {total_lt80} days")

    if needs_review:
        print(f"\n  Needs manual review:")
        for title, day, cov in needs_review:
            print(f"    - {title} Day {day}: {cov:.1f}%")
    else:
        print(f"\n  ALL PASSED! Every sampled day has coverage >= 90%")

    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
