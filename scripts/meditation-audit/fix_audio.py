"""
fix_audio.py - 修复冥想音频缺失内容

对于音频中缺失的文本内容：
1. 基于拼音对比定位缺失内容及其在音频中的插入时间点
2. 用豆包TTS（鸡汤女音色）生成缺失语音
3. 拼接到原始音频的正确位置
4. 上传修复后的音频到Supabase Storage

用法:
  python fix_audio.py                                    # 显示修复计划
  python fix_audio.py --fix                              # 执行全部修复
  python fix_audio.py --fix --course dependency_freedom  # 指定课程
  python fix_audio.py --fix --day 5                      # 指定天数
  python fix_audio.py --fix --no-upload                  # 修复但不上传
"""

import json
import os
import sys
import re
import time
import difflib
import argparse
import requests
import shutil
from pathlib import Path
from datetime import datetime

# 添加 TTS 模块路径
sys.path.insert(0, r"D:\CursorWork\doubao\yuyinhecheng")
from tts import synthesize as tts_synthesize

from config import COURSES, SUPABASE_URL, WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
from main import fetch_course_data, clean_db_text, CACHE_PATH, AUDIO_PATH
from analyze import strip_all, flatten_to_chars, chars_to_pinyin, MIN_GAP_PINYIN_LEN

SCRIPT_DIR = Path(__file__).parent
FIX_DIR = SCRIPT_DIR / "fix"
FIX_TTS_DIR = FIX_DIR / "tts"
FIX_OUTPUT_DIR = FIX_DIR / "output"
WORDS_CACHE_DIR = CACHE_PATH  # 逐字时间戳缓存与段级缓存同目录

# Supabase 上传配置
SUPABASE_SERVICE_KEY = "sb_secret_U2QYJz4gOMDw-c16W5Xz1g_f0zpFfqn"
STORAGE_BUCKET = "media"

# 插入片段前后的静音时长（毫秒）
SILENCE_PAD_MS = 800

# TTS 单次请求最大字符数
TTS_MAX_CHARS = 300


# ============================================================
# 1. 逐字时间戳转录（精确定位）
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


def get_word_timestamps(system_key, day_num):
    """
    获取逐字时间戳。优先用缓存，没有则重新转录。
    返回: [{"word": str, "start": float, "end": float}, ...]
    """
    cache_dir = WORDS_CACHE_DIR / system_key
    cache_file = cache_dir / f"day_{day_num}_words.json"

    if cache_file.exists():
        with open(cache_file, "r", encoding="utf-8") as f:
            return json.load(f)

    audio_file = AUDIO_PATH / system_key / f"day_{day_num}.mp3"
    if not audio_file.exists():
        return None

    model = _get_whisper_model()
    print(f"    转录逐字时间戳...", end="", flush=True)
    t0 = time.time()

    segments_iter, info = model.transcribe(
        str(audio_file),
        language="zh",
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        beam_size=5,
        word_timestamps=True,
    )

    words = []
    for seg in segments_iter:
        if seg.words:
            for w in seg.words:
                words.append({
                    "word": w.word.strip(),
                    "start": round(w.start, 2),
                    "end": round(w.end, 2),
                })

    result = {"words": words, "duration": round(info.duration, 1)}

    cache_dir.mkdir(parents=True, exist_ok=True)
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - t0
    print(f" ({elapsed:.1f}s, {len(words)} 词)")
    return result


# ============================================================
# 2. 带时间戳的缺失内容检测
# ============================================================

def _build_seg_char_map(segments):
    """
    从段级转录建立字符→段落映射。
    返回列表，每个元素 {"seg_idx", "seg_start", "seg_end", "pos_in_seg", "char_time"}。
    """
    mapping = []
    for seg_idx, seg in enumerate(segments):
        chars = list(strip_all(seg["text"]))
        n = len(chars)
        if n == 0:
            continue
        for i in range(n):
            ratio = i / n
            char_time = seg["start"] + ratio * (seg["end"] - seg["start"])
            mapping.append({
                "seg_idx": seg_idx,
                "seg_start": seg["start"],
                "seg_end": seg["end"],
                "pos_in_seg": i,
                "char_time": char_time,
            })
    return mapping


# 局部 Whisper 转录缓存：{cache_key: [sub_segments]}
_clip_transcription_cache = {}


def _refine_insert_time(audio_path, approx_time, tr_chars, tr_pos, seg_start, seg_end):
    """
    对长段落做局部 Whisper 转录，精确定位插入点。
    策略：在局部转录中搜索"后文"的起始时间，在其前方插入。
    """
    seg_duration = seg_end - seg_start
    if seg_duration < 10:
        # 短段落（<10s），线性估算已足够精确
        return approx_time

    # 提取后文（gap 后面的前6个字符，用于搜索）
    after_chars = "".join(tr_chars[tr_pos:tr_pos + 6])
    before_chars = "".join(tr_chars[max(0, tr_pos - 6):tr_pos])

    if not after_chars and not before_chars:
        return approx_time

    # 缓存 key：同一段落只转录一次
    cache_key = f"{audio_path}_{seg_start:.1f}_{seg_end:.1f}"

    if cache_key not in _clip_transcription_cache:
        try:
            from pydub import AudioSegment as PydubSegment
            audio = PydubSegment.from_mp3(str(audio_path))

            # 提取段落音频（前后各加1秒缓冲）
            clip_start_ms = max(0, int((seg_start - 1) * 1000))
            clip_end_ms = min(len(audio), int((seg_end + 1) * 1000))
            clip = audio[clip_start_ms:clip_end_ms]

            import tempfile
            temp_fd, temp_path = tempfile.mkstemp(suffix=".mp3")
            os.close(temp_fd)
            clip.export(temp_path, format="mp3")

            if not os.path.exists(temp_path) or os.path.getsize(temp_path) == 0:
                _clip_transcription_cache[cache_key] = []
                return approx_time

            model = _get_whisper_model()
            segs_iter, _ = model.transcribe(
                temp_path, language="zh", vad_filter=False, beam_size=5,
            )

            sub_segs = []
            for s in segs_iter:
                sub_segs.append({
                    "start": clip_start_ms / 1000 + s.start,
                    "end": clip_start_ms / 1000 + s.end,
                    "text": s.text,
                    "text_stripped": strip_all(s.text),
                })

            try:
                os.remove(temp_path)
            except OSError:
                pass

            _clip_transcription_cache[cache_key] = sub_segs
        except Exception as e:
            print(f"      精定位失败，回退到粗定位: {e}")
            _clip_transcription_cache[cache_key] = []
            return approx_time

    sub_segs = _clip_transcription_cache[cache_key]

    if not sub_segs:
        return approx_time

    after_stripped = strip_all(after_chars)
    before_stripped = strip_all(before_chars)

    # 方法1：搜索"后文"起始位置 → 插入在它之前
    if after_stripped:
        for s in sub_segs:
            if after_stripped[:3] in s["text_stripped"]:
                # 找到了后文所在的子段，在其起始时间前插入
                return s["start"] - 0.05

    # 方法2：搜索"前文"结束位置 → 插入在它之后
    if before_stripped:
        for s in reversed(sub_segs):
            if before_stripped[-3:] in s["text_stripped"]:
                return s["end"] + 0.05

    # 方法3：回退到线性估算
    return approx_time


def find_gaps_with_timestamps(db_text_cleaned, transcription, system_key, day_num):
    """
    找出缺失内容及其在音频中的插入时间点。
    策略：
      1. 用段级转录文本做 gap 检测（文本质量更高）
      2. 用段级 segment 做粗定位
      3. 对长段落做局部 Whisper 转录做精定位
    """
    tr_text = transcription["text"].replace("\n", "")
    db_chars = flatten_to_chars(db_text_cleaned)
    tr_chars = flatten_to_chars(tr_text)

    if not db_chars or not tr_chars:
        return []

    db_pinyin = chars_to_pinyin(db_chars)
    tr_pinyin = chars_to_pinyin(tr_chars)

    # 从段级 segment 建立字符映射
    seg_time_map = _build_seg_char_map(transcription["segments"])
    audio_duration = transcription["segments"][-1]["end"] if transcription["segments"] else 0

    # 长度校验
    if len(seg_time_map) != len(tr_chars):
        min_len = min(len(seg_time_map), len(tr_chars))
        seg_time_map = seg_time_map[:min_len]
        tr_chars = tr_chars[:min_len]
        tr_pinyin = tr_pinyin[:min_len]

    sm = difflib.SequenceMatcher(None, db_pinyin, tr_pinyin, autojunk=False)

    audio_file = AUDIO_PATH / system_key / f"day_{day_num}.mp3"

    gaps = []

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "delete":
            chunk_pinyin_len = sum(len(p) for p in db_pinyin[i1:i2])
            if chunk_pinyin_len < MIN_GAP_PINYIN_LEN:
                continue

            missing_stripped = "".join(db_chars[i1:i2])
            missing_text = _recover_punctuated_text(missing_stripped, db_text_cleaned)

            # 粗定位
            approx_time = _calc_approx_time(j1, seg_time_map, audio_duration)
            # 精定位：局部 Whisper 转录
            seg_entry = seg_time_map[min(j1, len(seg_time_map) - 1)]
            insert_time = _refine_insert_time(
                audio_file, approx_time, tr_chars, j1,
                seg_entry["seg_start"], seg_entry["seg_end"],
            )

            gaps.append({
                "missing_stripped": missing_stripped,
                "missing_text": missing_text,
                "insert_time": insert_time,
                "approx_time": approx_time,
            })

        elif tag == "replace":
            db_pl = sum(len(p) for p in db_pinyin[i1:i2])
            tr_pl = sum(len(p) for p in tr_pinyin[j1:j2])
            max_pl = max(db_pl, tr_pl)
            len_ratio = min(db_pl, tr_pl) / max_pl if max_pl > 0 else 1
            sub_sim = difflib.SequenceMatcher(
                None, db_pinyin[i1:i2], tr_pinyin[j1:j2]
            ).ratio()

            if sub_sim < 0.3 and len_ratio < 0.5 and db_pl > tr_pl:
                if (db_pl - tr_pl) >= MIN_GAP_PINYIN_LEN:
                    missing_stripped = "".join(db_chars[i1:i2])
                    missing_text = _recover_punctuated_text(missing_stripped, db_text_cleaned)

                    approx_time = _calc_approx_time(j2, seg_time_map, audio_duration)
                    seg_entry = seg_time_map[min(j2, len(seg_time_map) - 1)]
                    insert_time = _refine_insert_time(
                        audio_file, approx_time, tr_chars, j2,
                        seg_entry["seg_start"], seg_entry["seg_end"],
                    )

                    gaps.append({
                        "missing_stripped": missing_stripped,
                        "missing_text": missing_text,
                        "insert_time": insert_time,
                        "approx_time": approx_time,
                    })

    gaps.sort(key=lambda g: g["insert_time"])
    return gaps


def _calc_approx_time(tr_pos, seg_time_map, audio_duration):
    """段级线性估算：字符位置→大致时间（仅用作初始估算）"""
    if tr_pos == 0:
        return 0.0
    if tr_pos >= len(seg_time_map):
        return audio_duration
    return seg_time_map[tr_pos]["char_time"]


def _recover_punctuated_text(stripped, full_text):
    """将去标点的文本映射回原文中带标点的版本"""
    clean_full = strip_all(full_text)
    search_key = stripped[:min(20, len(stripped))]
    idx = clean_full.find(search_key)
    if idx < 0:
        return stripped

    # 找起始位置
    orig_start = 0
    count = 0
    for i, ch in enumerate(full_text):
        if re.match(r"[\u4e00-\u9fff\w]", ch):
            if count == idx:
                orig_start = i
                break
            count += 1

    # 找结束位置
    end_count = 0
    orig_end = orig_start
    for i in range(orig_start, len(full_text)):
        if re.match(r"[\u4e00-\u9fff\w]", full_text[i]):
            end_count += 1
            if end_count >= len(stripped):
                orig_end = i + 1
                break

    # 包含尾部标点
    while orig_end < len(full_text) and full_text[orig_end] in "，。！？…、；：""''":
        orig_end += 1

    return full_text[orig_start:orig_end].strip()


# ============================================================
# 2. TTS 语音生成
# ============================================================

def generate_tts(text, output_dir, name_prefix):
    """
    为文本生成TTS语音。长文本自动分段合成+合并。
    返回生成的mp3文件路径，失败返回None。
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    segments = _split_text_for_tts(text)

    if len(segments) == 1:
        result = tts_synthesize(
            segments[0],
            filename=name_prefix,
            speed_ratio=1.0,
            output_dir=str(output_dir),
        )
        return result

    # 多段：逐段合成后合并
    seg_files = []
    for i, seg in enumerate(segments):
        seg_name = f"{name_prefix}_p{i+1}"
        result = tts_synthesize(
            seg,
            filename=seg_name,
            speed_ratio=1.0,
            output_dir=str(output_dir),
        )
        if result:
            seg_files.append(result)
        else:
            print(f"      TTS 第{i+1}段失败: {seg[:30]}...")
            return None
        time.sleep(0.3)

    # 合并
    merged_path = str(output_dir / f"{name_prefix}.mp3")
    if _ffmpeg_concat(seg_files, merged_path):
        for f in seg_files:
            if os.path.exists(f) and f != merged_path:
                os.remove(f)
        return merged_path
    return None


def _split_text_for_tts(text, max_chars=TTS_MAX_CHARS):
    """按句子边界分割长文本，每段不超过max_chars"""
    if len(text) <= max_chars:
        return [text]

    segments = []
    current = ""

    sentences = re.split(r"(?<=[。！？…])", text)

    for sent in sentences:
        if not sent.strip():
            continue
        if len(current) + len(sent) <= max_chars:
            current += sent
        else:
            if current:
                segments.append(current.strip())
            if len(sent) > max_chars:
                # 超长句子按逗号分割
                parts = re.split(r"(?<=[，,；])", sent)
                current = ""
                for part in parts:
                    if len(current) + len(part) <= max_chars:
                        current += part
                    else:
                        if current:
                            segments.append(current.strip())
                        current = part
            else:
                current = sent

    if current.strip():
        segments.append(current.strip())

    return segments if segments else [text]


# ============================================================
# 3. 音频拼接
# ============================================================

def splice_audio(original_path, gaps, output_path):
    """
    将TTS片段拼接到原始音频的正确位置。
    gaps: [{"insert_time": float, "tts_path": str}, ...]（需按insert_time升序）
    """
    from pydub import AudioSegment

    audio = AudioSegment.from_mp3(str(original_path))

    result = AudioSegment.empty()
    prev_end_ms = 0

    for gap in gaps:
        insert_ms = int(gap["insert_time"] * 1000)
        insert_ms = max(prev_end_ms, min(insert_ms, len(audio)))

        # 原始音频到插入点
        result += audio[prev_end_ms:insert_ms]

        # 静音 + TTS + 静音
        silence = AudioSegment.silent(duration=SILENCE_PAD_MS, frame_rate=audio.frame_rate)
        tts_audio = AudioSegment.from_mp3(gap["tts_path"])
        result += silence + tts_audio + silence

        prev_end_ms = insert_ms

    # 剩余的原始音频
    result += audio[prev_end_ms:]

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    result.export(str(output_path), format="mp3", bitrate="128k")
    return True


# ============================================================
# 4. Supabase 上传
# ============================================================

def upload_to_supabase(local_path, storage_path):
    """上传文件到 Supabase Storage（覆盖已有），返回公开 URL"""
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
        print(f"      上传失败: {resp.status_code} {resp.text[:200]}")
        return None

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"
    return public_url


def get_storage_path_from_url(audio_url):
    """从 Supabase 公开 URL 提取存储路径"""
    prefix = f"/storage/v1/object/public/{STORAGE_BUCKET}/"
    idx = audio_url.find(prefix)
    if idx >= 0:
        return audio_url[idx + len(prefix):]
    return None


# ============================================================
# 5. 辅助函数
# ============================================================

def _ffmpeg_concat(file_list, output_path):
    """用 ffmpeg 合并多个 mp3 文件"""
    import subprocess

    if len(file_list) == 1:
        shutil.copy2(file_list[0], output_path)
        return True

    list_file = output_path + ".txt"
    with open(list_file, "w", encoding="utf-8") as f:
        for fp in file_list:
            f.write(f"file '{fp.replace(chr(92), '/')}'\n")

    try:
        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", list_file, "-c", "copy", output_path,
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=60)
        return result.returncode == 0
    finally:
        if os.path.exists(list_file):
            os.remove(list_file)


def format_time(seconds):
    """将秒数格式化为 mm:ss"""
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m}:{s:02d}"


# ============================================================
# 6. 全文TTS重录（覆盖率低时使用）
# ============================================================

def _parse_silence_duration(text):
    """从括号内容解析静音时长（秒）"""
    SILENCE_MAP = {
        "静默片刻": 5, "停顿片刻": 5, "长时间的静默": 10,
        "长时间静默": 10, "长久的静默": 10,
    }
    for key, seconds in SILENCE_MAP.items():
        if key in text:
            return seconds
    m = re.search(r'[停顿静默]\s*(\d+)\s*秒', text)
    if m:
        return int(m.group(1))
    m = re.search(r'(\d+)\s*秒', text)
    if m:
        return int(m.group(1))
    if any(k in text for k in ['停顿', '静默', '静止', '沉默', '安静']):
        return 5
    return 0


def _generate_silence(duration_sec, output_path):
    """用ffmpeg生成指定时长的静音mp3"""
    import subprocess
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-t", str(duration_sec),
        "-c:a", "libmp3lame", "-b:a", "128k",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, timeout=30)
    return result.returncode == 0


def _extract_guide_text(meditation_guide):
    """
    从 meditation_guide 提取引导语部分（用于全文TTS重录）。
    保留静默指令，去除主题/准备阶段/引导语标签/舞台指示。
    """
    text = meditation_guide

    # 去除主题行
    text = re.sub(r'\*{0,2}【[^】]*】\*{0,2}\s*', '', text)
    # 去除准备阶段（标题+内容，到引导语或双换行）
    text = re.sub(r'\*{0,2}准备阶段[：:]?\*{0,2}.*?(?=\*{0,2}引导语|\n\n)', '', text, flags=re.DOTALL)
    # 去除引导语标签
    text = re.sub(r'\*{0,2}引导语[：:]?\*{0,2}\s*', '', text)
    # 去除建议时长
    text = re.sub(r'（建议时长[^）]*）\s*', '', text)
    # 去除舞台指示（语速/语调描述），但不删除静默指令
    text = re.sub(r'（语[速调].*?）\s*', '', text)
    text = re.sub(r'（[^）]*?语[速调][^）]*?）\s*', '', text)
    text = re.sub(r'（[^）]*?营造[^）]*?）\s*', '', text)
    text = re.sub(r'（[^）]*?声音[^）]*?）\s*', '', text)
    text = re.sub(r'（[^）]*?带有[^）]*?感\s*）\s*', '', text)
    # 去除 Markdown 加粗
    text = re.sub(r'\*{2}', '', text)
    # 统一引号
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    # 清理多余空行
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = '\n'.join(line.strip() for line in text.split('\n'))
    return text.strip()


def _parse_text_and_silence(guide_text):
    """
    将引导语解析成 [("text", 文字), ("silence", 秒数)] 序列。
    按段落（双换行）分割，段落间插入2秒停顿；
    遇到显式静默指令（静默N秒）则使用指定时长。
    """
    elements = []

    # 先按段落分割
    paragraphs = re.split(r'\n\n+', guide_text.strip())

    for p_idx, para in enumerate(paragraphs):
        para = para.strip()
        if not para:
            continue

        # 在段落内检查是否有括号内的静默指令
        parts = re.split(r'(（[^）]*）)', para)

        for part in parts:
            if not part or not part.strip():
                continue
            bracket_match = re.match(r'（(.*)）', part.strip())
            if bracket_match:
                inner = bracket_match.group(1)
                duration = _parse_silence_duration(inner)
                if duration > 0:
                    elements.append(("silence", duration))
            else:
                text = part.strip()
                if not text:
                    continue
                # 如果文本只有标点（如括号后的"。"），合并到上一个文本元素
                if not re.search(r'[\u4e00-\u9fffA-Za-z0-9]', text):
                    for i in range(len(elements) - 1, -1, -1):
                        if elements[i][0] == "text":
                            elements[i] = ("text", elements[i][1] + text)
                            break
                else:
                    elements.append(("text", text))

        # 段落之间加2秒停顿（最后一段不加）
        if p_idx < len(paragraphs) - 1:
            elements.append(("silence", 2))

    return elements


def regenerate_full_tts(system_key, day_num, meditation_guide, audio_url,
                        do_upload=True):
    """
    全文TTS重录：将 meditation_guide 整段重新合成为语音。
    用于原始音频严重损坏（覆盖率<80%）的情况。
    """
    # 提取引导语+解析静默
    guide_text = _extract_guide_text(meditation_guide)
    elements = _parse_text_and_silence(guide_text)

    if not elements:
        print(f"    Day {day_num}: 引导语为空，跳过")
        return {"status": "empty", "mode": "regen"}

    # 统计
    text_count = sum(1 for t, v in elements if t == "text")
    silence_count = sum(1 for t, v in elements if t == "silence")
    total_chars = sum(len(v) for t, v in elements if t == "text")
    print(f"    Day {day_num}: 全文TTS重录 ({total_chars}字, {text_count}段文本, {silence_count}段静默)")

    # 工作目录
    day_tts_dir = FIX_TTS_DIR / system_key / f"day_{day_num}_regen"
    day_tts_dir.mkdir(parents=True, exist_ok=True)

    all_audio_files = []
    temp_silence_files = []
    text_seg_idx = 0

    for elem_type, elem_value in elements:
        if elem_type == "silence":
            silence_name = f"silence_{len(all_audio_files)}"
            silence_path = str(day_tts_dir / f"{silence_name}.mp3")
            if _generate_silence(elem_value, silence_path):
                all_audio_files.append(silence_path)
                temp_silence_files.append(silence_path)
            else:
                print(f"      静音生成失败: {elem_value}秒")

        elif elem_type == "text":
            # 分割长文本
            segments = _split_text_for_tts(elem_value)
            for seg in segments:
                text_seg_idx += 1
                seg_name = f"seg_{text_seg_idx:03d}"
                # TTS with retry for transient errors (SSL, network)
                result = None
                for attempt in range(3):
                    try:
                        result = tts_synthesize(
                            seg,
                            filename=seg_name,
                            speed_ratio=1.0,
                            output_dir=str(day_tts_dir),
                        )
                        if result:
                            break
                    except Exception as e:
                        print(f"      TTS异常(尝试{attempt+1}/3): {e}")
                        if attempt < 2:
                            time.sleep(2 * (attempt + 1))
                if result:
                    all_audio_files.append(result)
                else:
                    print(f"      TTS失败: {seg[:30]}...")
                    return {"status": "tts_failed", "mode": "regen"}
                time.sleep(0.3)

    if not all_audio_files:
        return {"status": "empty", "mode": "regen"}

    # 合并
    fixed_path = FIX_OUTPUT_DIR / system_key / f"day_{day_num}.mp3"
    fixed_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"      合并 {len(all_audio_files)} 个片段...")
    if not _ffmpeg_concat(all_audio_files, str(fixed_path)):
        return {"status": "merge_failed", "mode": "regen"}

    # 清理临时文件
    for f in temp_silence_files:
        if os.path.exists(f):
            os.remove(f)
    for f in all_audio_files:
        if os.path.exists(f) and str(f) != str(fixed_path):
            try:
                os.remove(f)
            except OSError:
                pass

    fixed_kb = fixed_path.stat().st_size // 1024
    print(f"      生成: {fixed_kb}KB")

    # 上传
    if do_upload and audio_url:
        storage_path = get_storage_path_from_url(audio_url)
        if storage_path:
            print(f"      上传: {storage_path}...")
            result_url = upload_to_supabase(str(fixed_path), storage_path)
            if result_url:
                print(f"      上传成功!")
                return {"status": "regen_done", "mode": "regen"}
            else:
                return {"status": "upload_failed", "mode": "regen"}
    elif not do_upload:
        print(f"      (跳过上传)")
    return {"status": "regen_local", "mode": "regen"}


def compute_coverage(db_text, transcription):
    """计算数据库文本与转录文本的覆盖率"""
    cleaned = clean_db_text(db_text)
    tr_text = transcription["text"].replace("\n", "")
    db_chars = flatten_to_chars(cleaned)
    tr_chars = flatten_to_chars(tr_text)
    if not db_chars:
        return 100.0
    db_py = chars_to_pinyin(db_chars)
    tr_py = chars_to_pinyin(tr_chars)
    sm = difflib.SequenceMatcher(None, db_py, tr_py)
    matched = sum(i2 - i1 for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag == "equal")
    return matched / len(db_chars) * 100


# ============================================================
# 主流程
# ============================================================

# 覆盖率阈值：低于此值使用全文TTS重录
REGEN_THRESHOLD = 80.0

def process_day(system_key, day_num, db_text, transcription, audio_url, do_fix=False, do_upload=True):
    """处理一天的音频修复，返回结果字典"""
    cleaned_db = clean_db_text(db_text)
    gaps = find_gaps_with_timestamps(cleaned_db, transcription, system_key, day_num)

    if not gaps:
        return {"status": "ok", "gaps": 0}

    print(f"  Day {day_num}: {len(gaps)} 处缺失")
    for i, g in enumerate(gaps):
        text_preview = g["missing_text"][:60]
        if len(g["missing_text"]) > 60:
            text_preview += "..."
        approx = g.get("approx_time", g["insert_time"])
        if abs(approx - g["insert_time"]) > 0.5:
            print(f"    [{i+1}] @{format_time(g['insert_time'])} (粗定位{format_time(approx)}→静默点{format_time(g['insert_time'])}): {text_preview}")
        else:
            print(f"    [{i+1}] @{format_time(g['insert_time'])}: {text_preview}")

    if not do_fix:
        return {"status": "needs_fix", "gaps": len(gaps)}

    # === 执行修复 ===
    day_tts_dir = FIX_TTS_DIR / system_key / f"day_{day_num}"
    day_tts_dir.mkdir(parents=True, exist_ok=True)

    # 生成 TTS
    for i, gap in enumerate(gaps):
        print(f"    [{i+1}/{len(gaps)}] 生成 TTS ({len(gap['missing_text'])}字)...")
        tts_path = generate_tts(
            gap["missing_text"],
            day_tts_dir,
            f"gap_{i+1}",
        )
        if tts_path:
            gap["tts_path"] = tts_path
        else:
            print(f"    !! TTS 生成失败，跳过此天")
            return {"status": "tts_failed", "gaps": len(gaps)}
        time.sleep(0.5)

    # 拼接音频
    original_audio = AUDIO_PATH / system_key / f"day_{day_num}.mp3"
    if not original_audio.exists():
        print(f"    !! 原始音频不存在: {original_audio}")
        return {"status": "no_audio", "gaps": len(gaps)}

    fixed_path = FIX_OUTPUT_DIR / system_key / f"day_{day_num}.mp3"
    print(f"    拼接音频...")
    splice_audio(original_audio, gaps, fixed_path)

    original_kb = original_audio.stat().st_size // 1024
    fixed_kb = fixed_path.stat().st_size // 1024
    print(f"    {original_kb}KB -> {fixed_kb}KB (+{fixed_kb - original_kb}KB)")

    # 上传
    if do_upload and audio_url:
        storage_path = get_storage_path_from_url(audio_url)
        if storage_path:
            print(f"    上传: {storage_path}...")
            result_url = upload_to_supabase(str(fixed_path), storage_path)
            if result_url:
                print(f"    上传成功!")
                return {"status": "fixed", "gaps": len(gaps)}
            else:
                return {"status": "upload_failed", "gaps": len(gaps)}
        else:
            print(f"    !! 无法解析存储路径，跳过上传")
            return {"status": "fixed_local", "gaps": len(gaps)}
    elif not do_upload:
        print(f"    (跳过上传)")
        return {"status": "fixed_local", "gaps": len(gaps)}
    else:
        print(f"    (无音频URL，跳过上传)")
        return {"status": "fixed_local", "gaps": len(gaps)}


def main():
    parser = argparse.ArgumentParser(description="修复冥想音频缺失内容")
    parser.add_argument("--fix", action="store_true",
                        help="执行修复（默认只显示修复计划）")
    parser.add_argument("--course", type=str,
                        help="指定课程 (dependency_freedom|desire_flame|wisdom_awakening|energy_alchemy)")
    parser.add_argument("--day", type=int,
                        help="指定天数（与 --course 配合使用）")
    parser.add_argument("--no-upload", action="store_true",
                        help="修复但不上传到Supabase")
    parser.add_argument("--mode", type=str, choices=["patch", "regen", "auto"],
                        default="auto",
                        help="修复模式: patch=补丁修复, regen=全文TTS重录, auto=覆盖率自动选择(默认)")
    args = parser.parse_args()

    if args.course:
        if args.course not in COURSES:
            print(f"未知课程: {args.course}")
            print(f"可选: {', '.join(COURSES.keys())}")
            return
        course_keys = [args.course]
    else:
        course_keys = list(COURSES.keys())

    FIX_DIR.mkdir(parents=True, exist_ok=True)
    FIX_TTS_DIR.mkdir(parents=True, exist_ok=True)
    FIX_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    total_patched = 0
    total_regen = 0
    total_failed = 0
    total_ok = 0

    mode_label = {"patch": "补丁修复", "regen": "全文TTS重录", "auto": "自动选择"}
    print(f"\n{'='*60}")
    print(f"冥想音频修复工具 - {'执行修复' if args.fix else '修复计划预览'} (模式: {mode_label[args.mode]})")
    print(f"{'='*60}")

    for system_key in course_keys:
        info = COURSES[system_key]
        print(f"\n--- {info['title']} ---")

        course_data = fetch_course_data(system_key)

        for item in course_data:
            day = item["sequence_number"]

            if args.day and day != args.day:
                continue

            if not item["meditation_guide"]:
                continue

            cache_file = CACHE_PATH / system_key / f"day_{day}.json"
            if not cache_file.exists():
                continue

            with open(cache_file, "r", encoding="utf-8") as f:
                transcription = json.load(f)

            # 决定使用哪种模式
            if args.mode == "regen":
                use_regen = True
            elif args.mode == "patch":
                use_regen = False
            else:  # auto
                coverage = compute_coverage(item["meditation_guide"], transcription)
                use_regen = coverage < REGEN_THRESHOLD
                if use_regen:
                    print(f"  Day {day}: 覆盖率 {coverage:.0f}% < {REGEN_THRESHOLD:.0f}% → 全文TTS重录")

            if use_regen:
                if not args.fix:
                    print(f"  Day {day}: [全文TTS重录]")
                    total_regen += 1
                else:
                    result = regenerate_full_tts(
                        system_key, day,
                        item["meditation_guide"],
                        item.get("audio_url"),
                        do_upload=not args.no_upload,
                    )
                    if result["status"] in ("regen_done", "regen_local"):
                        total_regen += 1
                    else:
                        total_failed += 1
            else:
                result = process_day(
                    system_key, day,
                    item["meditation_guide"],
                    transcription,
                    item.get("audio_url"),
                    do_fix=args.fix,
                    do_upload=not args.no_upload,
                )
                if result["gaps"] > 0:
                    total_patched += 1
                    if result["status"] in ("tts_failed", "upload_failed", "no_audio"):
                        total_failed += 1
                else:
                    total_ok += 1

    print(f"\n{'='*60}")
    print(f"汇总: 无需修改 {total_ok}天, 补丁修复 {total_patched}天, 全文重录 {total_regen}天, 失败 {total_failed}天")
    if not args.fix:
        print(f"\n运行以下命令执行修复:")
        print(f"  python fix_audio.py --fix                  # 自动模式(推荐)")
        print(f"  python fix_audio.py --fix --mode regen     # 全部强制重录")
        print(f"  python fix_audio.py --fix --mode patch     # 全部用补丁")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
