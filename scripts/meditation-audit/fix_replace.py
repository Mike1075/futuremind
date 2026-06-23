"""
fix_replace.py - 修复音频中的TTS误读/重复错误

与 fix_audio.py 不同，这个脚本处理的是：
1. TTS 误读（读错字）→ 用正确TTS替换错误片段
2. TTS 重复（短语重复）→ 用单次正确TTS替换重复片段

用法:
  python fix_replace.py                    # 预览修复计划
  python fix_replace.py --fix              # 执行修复
  python fix_replace.py --fix --no-upload  # 修复但不上传
"""

import json
import os
import sys
import re
import time
import argparse
from pathlib import Path

sys.path.insert(0, r"D:\CursorWork\doubao\yuyinhecheng")
from tts import synthesize as tts_synthesize

from config import COURSES, SUPABASE_URL, WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
from main import fetch_course_data, CACHE_PATH, AUDIO_PATH

SCRIPT_DIR = Path(__file__).parent
FIX_DIR = SCRIPT_DIR / "fix"
FIX_TTS_DIR = FIX_DIR / "tts"
FIX_OUTPUT_DIR = FIX_DIR / "output"

SUPABASE_SERVICE_KEY = "sb_secret_U2QYJz4gOMDw-c16W5Xz1g_f0zpFfqn"
STORAGE_BUCKET = "media"


# ============================================================
# 定义需要修复的错误
# ============================================================

FIXES = [
    # === 已完成 ===
    # batch 1: dependency_freedom Day 20, energy_alchemy Day 14
    # batch 2: wisdom_awakening Day 31, desire_flame Day 1, desire_flame Day 10
    # batch 3: desire_flame Day 8, wisdom_awakening Day 19, energy_alchemy Day 15, dependency_freedom Day 13

    # === batch 4: Day 9 重做（上次时间戳倒转） ===
    {
        "course": "dependency_freedom",
        "day": 9,
        "description": "TTS结巴：'还能感到空荡吗'多余重复",
        "find_start": "匮乏吗还能感到空荡",
        "find_end": "空荡荡的状态吗还是",
        "correct_text": "你感到匮乏吗？还是感到一种无限的可能性？",
        "fallback_start": 97.4,
        "fallback_end": 103.3,
    },
]


# ============================================================
# Whisper 模型
# ============================================================

_whisper_model = None

def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print(f"加载 Whisper 模型: {WHISPER_MODEL}...")
        _whisper_model = WhisperModel(
            WHISPER_MODEL, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE,
        )
        print("模型加载完成")
    return _whisper_model


def find_timestamps_in_clip(audio_path, search_start_s, search_end_s, find_start_text, find_end_text):
    """
    在音频片段中用 Whisper 做逐段转录，定位错误区域的精确时间戳。
    返回 (start_time, end_time) 或 None
    """
    from pydub import AudioSegment
    import tempfile

    audio = AudioSegment.from_mp3(str(audio_path))

    # 提取片段（前后各加2秒缓冲）
    clip_start_ms = max(0, int((search_start_s - 2) * 1000))
    clip_end_ms = min(len(audio), int((search_end_s + 2) * 1000))
    clip = audio[clip_start_ms:clip_end_ms]

    # 使用脚本目录下的临时文件（避免 Windows 中文用户名路径问题）
    temp_dir = Path(__file__).parent / "fix" / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_path = str(temp_dir / f"clip_{int(search_start_s)}_{int(search_end_s)}.mp3")
    clip.export(temp_path, format="mp3")

    try:
        model = _get_whisper_model()
        segs_iter, _ = model.transcribe(
            temp_path, language="zh", vad_filter=False, beam_size=5,
        )

        # 收集所有段落
        all_segs = []
        for s in segs_iter:
            # 转换为原始音频时间
            real_start = clip_start_ms / 1000 + s.start
            real_end = clip_start_ms / 1000 + s.end
            clean = re.sub(r'[^\u4e00-\u9fff]', '', s.text)
            all_segs.append({
                "start": real_start,
                "end": real_end,
                "text": s.text,
                "clean": clean,
            })

        # 拼接所有clean文本
        full_clean = "".join(s["clean"] for s in all_segs)
        print(f"    局部转录: {full_clean[:80]}...")

        # 搜索 find_start 的位置
        clean_start = re.sub(r'[^\u4e00-\u9fff]', '', find_start_text)
        clean_end = re.sub(r'[^\u4e00-\u9fff]', '', find_end_text)

        start_idx = full_clean.find(clean_start)
        end_idx = full_clean.find(clean_end)

        if start_idx == -1:
            print(f"    !! 找不到起始标记: {clean_start}")
            # 尝试缩短搜索
            for length in range(len(clean_start)-1, 3, -1):
                start_idx = full_clean.find(clean_start[:length])
                if start_idx != -1:
                    print(f"    使用缩短标记: {clean_start[:length]}")
                    break
            if start_idx == -1:
                return None

        if end_idx == -1:
            print(f"    !! 找不到结束标记: {clean_end}")
            for length in range(len(clean_end)-1, 3, -1):
                end_idx = full_clean.find(clean_end[:length])
                if end_idx != -1:
                    print(f"    使用缩短标记: {clean_end[:length]}")
                    break
            if end_idx == -1:
                return None

        # 将字符位置映射回时间戳
        char_pos = 0
        result_start = None
        result_end = None

        for seg in all_segs:
            seg_len = len(seg["clean"])
            if result_start is None and char_pos + seg_len > start_idx:
                # 起始段：按字符比例估算精确时间
                ratio = (start_idx - char_pos) / seg_len if seg_len > 0 else 0
                result_start = seg["start"] + ratio * (seg["end"] - seg["start"])

            end_of_match = end_idx + len(clean_end)
            if result_end is None and char_pos + seg_len >= end_of_match:
                ratio = (end_of_match - char_pos) / seg_len if seg_len > 0 else 1
                result_end = seg["start"] + ratio * (seg["end"] - seg["start"])

            char_pos += seg_len

        if result_start is None or result_end is None:
            print(f"    !! 时间映射失败")
            return None

        return (result_start, result_end)

    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


def generate_tts(text, output_dir, name_prefix):
    """生成TTS语音"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    result = tts_synthesize(
        text,
        filename=name_prefix,
        speed_ratio=1.0,
        output_dir=str(output_dir),
    )
    return result


def replace_audio_segment(audio_path, start_time, end_time, replacement_path, output_path):
    """
    替换音频中 [start_time, end_time] 的内容为 replacement_path 的内容。
    在替换片段前后各加短静音过渡。
    """
    from pydub import AudioSegment

    audio = AudioSegment.from_mp3(str(audio_path))
    replacement = AudioSegment.from_mp3(str(replacement_path))

    start_ms = int(start_time * 1000)
    end_ms = int(end_time * 1000)

    # 小静音过渡
    transition = AudioSegment.silent(duration=200, frame_rate=audio.frame_rate)

    # 拼接: 原始前半 + 过渡 + 替换音频 + 过渡 + 原始后半
    result = audio[:start_ms] + transition + replacement + transition + audio[end_ms:]

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    result.export(str(output_path), format="mp3", bitrate="128k")
    return True


def upload_to_supabase(local_path, storage_path):
    """上传文件到 Supabase Storage"""
    import requests
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_path}"

    with open(local_path, "rb") as f:
        file_data = f.read()

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "audio/mpeg",
        "x-upsert": "true",
    }

    resp = requests.post(url, headers=headers, data=file_data, timeout=120)
    if not resp.ok:
        print(f"    上传失败: {resp.status_code} {resp.text[:200]}")
        return None

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"
    return public_url


def get_storage_path_from_url(audio_url):
    """从公开URL提取存储路径"""
    prefix = f"/storage/v1/object/public/{STORAGE_BUCKET}/"
    idx = audio_url.find(prefix)
    if idx >= 0:
        return audio_url[idx + len(prefix):]
    return None


def main():
    parser = argparse.ArgumentParser(description="修复音频TTS误读/重复")
    parser.add_argument("--fix", action="store_true", help="执行修复")
    parser.add_argument("--no-upload", action="store_true", help="不上传")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"音频TTS误读/重复修复 - {'执行修复' if args.fix else '预览'}")
    print(f"{'='*60}")

    # 预加载课程数据
    course_data_cache = {}
    for fix in FIXES:
        ck = fix["course"]
        if ck not in course_data_cache:
            course_data_cache[ck] = fetch_course_data(ck)

    for fix_idx, fix in enumerate(FIXES):
        course = fix["course"]
        day = fix["day"]
        print(f"\n[{fix_idx+1}/{len(FIXES)}] {COURSES[course]['title']} Day {day}")
        print(f"  问题: {fix['description']}")
        print(f"  替换文本: {fix['correct_text'][:60]}...")

        if not args.fix:
            continue

        # 找到音频URL
        audio_url = None
        for item in course_data_cache[course]:
            if item["sequence_number"] == day:
                audio_url = item.get("audio_url")
                break

        audio_file = AUDIO_PATH / course / f"day_{day}.mp3"
        if not audio_file.exists():
            print(f"  !! 音频文件不存在: {audio_file}")
            continue

        # 加载转录缓存获取大致时间范围
        cache_file = CACHE_PATH / course / f"day_{day}.json"
        if not cache_file.exists():
            print(f"  !! 转录缓存不存在")
            continue

        with open(cache_file, "r", encoding="utf-8") as f:
            transcription = json.load(f)

        # 在转录文本中搜索错误区域的大致位置（跨段落搜索）
        clean_find_start = re.sub(r'[^\u4e00-\u9fff]', '', fix["find_start"])
        clean_find_end = re.sub(r'[^\u4e00-\u9fff]', '', fix["find_end"])

        # 构建段落映射：拼接所有段落的clean text，记录每个字符属于哪个段
        seg_chars = []
        for seg_idx, seg in enumerate(transcription["segments"]):
            clean_seg = re.sub(r'[^\u4e00-\u9fff]', '', seg["text"])
            for ch in clean_seg:
                seg_chars.append((ch, seg_idx, seg["start"], seg["end"]))
        full_clean = "".join(c[0] for c in seg_chars)

        start_pos = full_clean.find(clean_find_start[:8])
        end_pos = full_clean.find(clean_find_end[:8])

        # 如果精确匹配失败，尝试缩短搜索
        if start_pos == -1:
            for ln in range(7, 3, -1):
                start_pos = full_clean.find(clean_find_start[:ln])
                if start_pos != -1:
                    break
        if end_pos == -1:
            for ln in range(7, 3, -1):
                end_pos = full_clean.find(clean_find_end[:ln])
                if end_pos != -1:
                    break

        if start_pos == -1 or end_pos == -1:
            print(f"  !! 无法在转录中定位错误区域 (start={start_pos}, end={end_pos})")
            print(f"     搜索: '{clean_find_start[:8]}' / '{clean_find_end[:8]}'")
            print(f"     全文: {full_clean[:100]}...")
            continue

        search_start_s = seg_chars[start_pos][2]  # segment start time
        # For end, find the segment that contains the end of the match
        end_match_end = end_pos + len(clean_find_end)
        end_char_idx = min(end_match_end, len(seg_chars) - 1)
        search_end_s = seg_chars[end_char_idx][3]  # segment end time

        # 如果是音频末尾的修复，end 设为音频末尾
        if fix.get("is_at_end"):
            search_end_s = transcription["segments"][-1]["end"]

        print(f"  大致时间范围: {search_start_s:.1f}s - {search_end_s:.1f}s")

        # 精确定位
        print(f"  精确定位中...")
        timestamps = find_timestamps_in_clip(
            audio_file, search_start_s, search_end_s,
            fix["find_start"], fix["find_end"],
        )

        if not timestamps:
            # 使用 fallback 时间戳
            fb_start = fix.get("fallback_start")
            fb_end = fix.get("fallback_end")
            if fb_start is not None and fb_end is not None:
                print(f"  精确定位失败，使用 fallback 时间戳: {fb_start}s - {fb_end}s")
                timestamps = (fb_start, fb_end)
            else:
                print(f"  !! 精确定位失败，且无 fallback 时间戳")
                continue

        start_time, end_time = timestamps

        # 检查时间戳合理性（start 必须 < end，且时长 > 0.5s）
        if start_time >= end_time or (end_time - start_time) < 0.5:
            fb_start = fix.get("fallback_start")
            fb_end = fix.get("fallback_end")
            if fb_start is not None and fb_end is not None:
                print(f"  时间戳异常 ({start_time:.2f}s >= {end_time:.2f}s)，使用 fallback: {fb_start}s - {fb_end}s")
                start_time, end_time = fb_start, fb_end
            else:
                print(f"  !! 时间戳异常且无 fallback: {start_time:.2f}s - {end_time:.2f}s")
                continue

        print(f"  精确时间: {start_time:.2f}s - {end_time:.2f}s (时长 {end_time-start_time:.1f}s)")

        # 生成正确的TTS
        print(f"  生成正确TTS...")
        tts_dir = FIX_TTS_DIR / course / f"day_{day}_replace"
        tts_path = generate_tts(fix["correct_text"], tts_dir, f"replace_{day}")

        if not tts_path:
            print(f"  !! TTS生成失败")
            continue

        from pydub import AudioSegment
        tts_duration = len(AudioSegment.from_mp3(tts_path)) / 1000
        print(f"  TTS时长: {tts_duration:.1f}s (原错误段 {end_time-start_time:.1f}s)")

        # 替换音频
        output_path = FIX_OUTPUT_DIR / course / f"day_{day}.mp3"
        print(f"  替换音频段...")
        replace_audio_segment(audio_file, start_time, end_time, tts_path, str(output_path))

        original_kb = audio_file.stat().st_size // 1024
        fixed_kb = output_path.stat().st_size // 1024
        print(f"  {original_kb}KB -> {fixed_kb}KB")

        # 上传
        if not args.no_upload and audio_url:
            storage_path = get_storage_path_from_url(audio_url)
            if storage_path:
                print(f"  上传: {storage_path}...")
                result_url = upload_to_supabase(str(output_path), storage_path)
                if result_url:
                    print(f"  上传成功!")
                else:
                    print(f"  上传失败!")
            else:
                print(f"  !! 无法解析存储路径")
        elif args.no_upload:
            print(f"  (跳过上传)")

    print(f"\n{'='*60}")
    if not args.fix:
        print(f"运行 python fix_replace.py --fix 执行修复")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
