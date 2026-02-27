# -*- coding: utf-8 -*-
"""
full_audit.py - 全面审计+补丁修复冥想音频 v4

对所有122天音频进行全面校对：
1. 下载当前线上音频
2. Whisper 转录
3. 拼音 SequenceMatcher 对比覆盖率
4. 覆盖率不达标的天：只补录缺失片段，拼接到原音频（不全文重录）
5. 本地验证补丁效果，仅在改善时上传

用法:
  python full_audit.py                    # 审计+补丁修复
  python full_audit.py --audit-only       # 只审计不修复
  python full_audit.py --course dependency_freedom  # 指定课程
  python full_audit.py --threshold 98     # 自定义阈值（默认99）
"""

import json
import os
import sys
import re
import time
import difflib
import ssl
import argparse
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

# 使用本地缓存的 HuggingFace 模型
os.environ["HF_HUB_OFFLINE"] = "1"

# Windows 控制台 UTF-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, r"D:\CursorWork\doubao\yuyinhecheng")

from config import COURSES, SUPABASE_URL, SUPABASE_ANON_KEY, WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
from main import fetch_course_data, clean_db_text, AUDIO_PATH, CACHE_PATH
from analyze import flatten_to_chars, chars_to_pinyin
import fix_audio
from fix_audio import (
    process_day, upload_to_supabase, get_storage_path_from_url,
    FIX_OUTPUT_DIR,
)

# SSL
SSL_CTX = ssl.create_default_context()

# 达标阈值
DEFAULT_THRESHOLD = 99.0


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
    """下载音频到本地（强制重新下载）"""
    try:
        data = http_get(url)
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(data)
        return True
    except Exception as e:
        print(f"    下载失败: {e}")
        return False


# Whisper 模型（懒加载，与 fix_audio 共享）
_whisper_model = None


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print(f"加载 Whisper: {WHISPER_MODEL} ({WHISPER_DEVICE}, {WHISPER_COMPUTE_TYPE})...")
        _whisper_model = WhisperModel(
            WHISPER_MODEL,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
        )
        print("模型加载完成")
        # 共享给 fix_audio 模块，避免重复加载导致 CUDA OOM
        fix_audio._whisper_model = _whisper_model
    return _whisper_model


def transcribe(audio_path):
    """转录音频，返回包含 text/segments/duration 的字典"""
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

    return {
        "text": "\n".join(text_parts),
        "segments": segments,
        "duration": round(info.duration, 1),
    }


def compute_coverage(db_text, transcription):
    """计算覆盖率：数据库文本中有多少比例被音频转录覆盖"""
    cleaned = clean_db_text(db_text)
    tr_text = transcription["text"].replace("\n", "")

    db_chars = flatten_to_chars(cleaned)
    tr_chars = flatten_to_chars(tr_text)

    if not db_chars:
        return 100.0, []

    db_py = chars_to_pinyin(db_chars)
    tr_py = chars_to_pinyin(tr_chars)

    sm = difflib.SequenceMatcher(None, db_py, tr_py, autojunk=False)
    opcodes = sm.get_opcodes()

    matched = 0
    missing_segments = []

    for tag, i1, i2, j1, j2 in opcodes:
        if tag == "equal":
            matched += (i2 - i1)
        elif tag in ("delete", "replace"):
            missing_text = "".join(db_chars[i1:i2])
            if len(missing_text) >= 2:
                missing_segments.append(missing_text)

    coverage = matched / len(db_chars) * 100
    return coverage, missing_segments


def clear_word_cache(system_key, day_num):
    """清除逐字时间戳缓存（补丁后需要重新转录）"""
    cache_file = CACHE_PATH / system_key / f"day_{day_num}_words.json"
    if cache_file.exists():
        cache_file.unlink()


def save_transcription_cache(system_key, day_num, transcription):
    """将转录结果保存到标准缓存目录（供 fix_audio.py 使用）"""
    cache_dir = CACHE_PATH / system_key
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"day_{day_num}.json"
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(transcription, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="全面审计+补丁修复冥想音频")
    parser.add_argument("--audit-only", action="store_true", help="只审计不修复")
    parser.add_argument("--course", type=str, help="指定课程")
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD, help=f"覆盖率阈值（默认{DEFAULT_THRESHOLD}）")
    parser.add_argument("--max-rounds", type=int, default=2, help="每天最多修复轮数（默认2，防止死循环）")
    args = parser.parse_args()

    if args.course:
        if args.course not in COURSES:
            print(f"未知课程: {args.course}")
            return
        course_keys = [args.course]
    else:
        course_keys = list(COURSES.keys())

    threshold = args.threshold
    max_rounds = args.max_rounds

    print(f"\n{'='*60}")
    print(f"全面音频审计 v4 - 补丁模式 (阈值: {threshold}%, 最多{max_rounds}轮)")
    print(f"{'='*60}")

    total_checked = 0
    total_pass = 0
    total_fixed = 0
    total_no_gap = 0  # Whisper差异（无可补丁的gap）
    total_fix_fail = 0
    all_results = []  # (course_title, day, initial_cov, final_cov, status)

    for system_key in course_keys:
        info = COURSES[system_key]
        title = info["title"]
        print(f"\n--- {title} ---")

        print(f"  获取课程数据...", flush=True)
        course_data = fetch_course_data(system_key)

        for item in course_data:
            day = item["sequence_number"]
            meditation_guide = item.get("meditation_guide")
            audio_url = item.get("audio_url")

            if not meditation_guide or not audio_url:
                continue

            total_checked += 1

            # === 阶段1：下载+转录+检查 ===
            audio_file = AUDIO_PATH / system_key / f"day_{day}.mp3"

            print(f"  Day {day}: 下载...", end="", flush=True)
            if not download_audio(audio_url, audio_file):
                print(f" 下载失败!")
                all_results.append((title, day, 0, 0, "下载失败"))
                continue
            print(f" 转录...", end="", flush=True)

            t0 = time.time()
            tr = transcribe(str(audio_file))
            elapsed = time.time() - t0

            # 保存转录到缓存（fix_audio.py 需要）
            save_transcription_cache(system_key, day, tr)

            coverage, missing = compute_coverage(meditation_guide, tr)

            if coverage >= threshold:
                print(f" {coverage:.1f}% ✓ ({elapsed:.1f}s)")
                total_pass += 1
                all_results.append((title, day, coverage, coverage, "达标"))
                if audio_file.exists():
                    audio_file.unlink()
                continue

            # 不达标
            missing_preview = "; ".join(m[:20] for m in missing[:3])
            if len(missing) > 3:
                missing_preview += f" ...等{len(missing)}处"
            print(f" {coverage:.1f}% ✗ ({elapsed:.1f}s) 缺: {missing_preview}")

            if args.audit_only:
                all_results.append((title, day, coverage, coverage, "不达标"))
                if audio_file.exists():
                    audio_file.unlink()
                continue

            # === 阶段2：补丁修复（最多 max_rounds 轮） ===
            initial_cov = coverage
            current_cov = coverage
            round_num = 0
            patched = False

            while current_cov < threshold and round_num < max_rounds:
                round_num += 1
                print(f"    === 补丁修复 第{round_num}轮 ===", flush=True)

                # 清除逐字缓存
                clear_word_cache(system_key, day)

                # 补丁修复（不上传，先本地验证）
                result = process_day(
                    system_key, day,
                    meditation_guide,
                    tr,
                    audio_url,
                    do_fix=True,
                    do_upload=False,  # 先不上传！
                )

                if result["status"] in ("tts_failed", "no_audio"):
                    print(f"    补丁失败: {result['status']}")
                    break

                if result["gaps"] == 0:
                    print(f"    未检测到可补丁的缺失片段（Whisper转录差异）")
                    break

                # 本地验证补丁效果
                patched_file = FIX_OUTPUT_DIR / system_key / f"day_{day}.mp3"
                if not patched_file.exists():
                    print(f"    补丁文件不存在")
                    break

                print(f"    本地验证...", end="", flush=True)
                tr_patched = transcribe(str(patched_file))
                new_cov, _ = compute_coverage(meditation_guide, tr_patched)

                if new_cov > current_cov:
                    print(f" {current_cov:.1f}% → {new_cov:.1f}%", end="")
                    if new_cov >= threshold:
                        print(f" ✓")
                    else:
                        print(f" (改善，继续)")

                    # 补丁有改善 → 上传
                    storage_path = get_storage_path_from_url(audio_url)
                    if storage_path:
                        print(f"    上传...", end="", flush=True)
                        upload_url = upload_to_supabase(str(patched_file), storage_path)
                        if upload_url:
                            print(f" 成功!")
                            patched = True
                        else:
                            print(f" 失败!")
                            break

                    # 更新状态，用补丁后的音频继续下一轮
                    current_cov = new_cov
                    tr = tr_patched

                    # 将补丁后的音频复制为新的"原始"音频（供下一轮使用）
                    import shutil
                    shutil.copy2(str(patched_file), str(audio_file))
                    save_transcription_cache(system_key, day, tr)

                else:
                    print(f" {current_cov:.1f}% → {new_cov:.1f}% (未改善，跳过上传)")
                    break

            # 记录最终结果
            final_cov = current_cov
            if final_cov >= threshold:
                total_fixed += 1
                all_results.append((title, day, initial_cov, final_cov, "已修复"))
            elif result.get("gaps", 0) == 0:
                total_no_gap += 1
                all_results.append((title, day, initial_cov, final_cov, "Whisper差异"))
            else:
                total_fix_fail += 1
                all_results.append((title, day, initial_cov, final_cov, "需复查"))

            # 清理
            if audio_file.exists():
                audio_file.unlink()

            time.sleep(0.5)

    # ========== 汇总报告 ==========
    print(f"\n{'='*60}")
    print(f"=== 审计汇总 ===")
    print(f"  检查总天数: {total_checked}")
    print(f"  初始达标 (>={threshold}%): {total_pass} 天")
    if not args.audit_only:
        print(f"  补丁修复成功: {total_fixed} 天")
        print(f"  Whisper差异(无需修复): {total_no_gap} 天")
        print(f"  需人工复查: {total_fix_fail} 天")

    # 详情
    needs_review = [(t, d, ic, fc, s) for t, d, ic, fc, s in all_results if s not in ("达标",)]
    if needs_review:
        print(f"\n=== 详情 ===")
        for title, day, initial_cov, final_cov, status in needs_review:
            if status == "已修复":
                print(f"  ✓ {title} Day {day}: {initial_cov:.1f}% → {final_cov:.1f}%")
            elif status == "Whisper差异":
                print(f"  ~ {title} Day {day}: {initial_cov:.1f}% (Whisper转录差异，音频可能正确)")
            elif status == "需复查":
                print(f"  ⚠ {title} Day {day}: {initial_cov:.1f}% → {final_cov:.1f}%")
            else:
                print(f"  ✗ {title} Day {day}: {status}")

    print(f"{'='*60}")


if __name__ == "__main__":
    main()
