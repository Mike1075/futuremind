"""
检测冥想音频中的重复朗读/多余内容

与 fix_audio.py 互补：
- fix_audio.py 检测"缺失"（DB有但音频没有）
- 本脚本检测"多余"（音频有但DB没有），如：读错后重读、重复朗读

用法:
  python detect_reread.py                        # 扫描 3.28 之后 + 4-6月全部
  python detect_reread.py --course desire_flame   # 指定课程
  python detect_reread.py --day 28                # 指定天数
"""

import json
import re
import sys
import difflib
import argparse
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

from config import COURSES
from main import fetch_course_data, clean_db_text, CACHE_PATH
from analyze import strip_all, flatten_to_chars, chars_to_pinyin, MIN_GAP_PINYIN_LEN


def detect_extra_content(db_text, transcription):
    """
    检测音频中比DB文本多出的内容（可能是重复朗读/读错重读）。
    返回 [(extra_text, context_before, context_after, approx_position_ratio), ...]
    """
    cleaned = clean_db_text(db_text)
    tr_text = transcription["text"].replace("\n", "")

    db_chars = flatten_to_chars(cleaned)
    tr_chars = flatten_to_chars(tr_text)

    if not db_chars or not tr_chars:
        return [], 0, 0

    db_pinyin = chars_to_pinyin(db_chars)
    tr_pinyin = chars_to_pinyin(tr_chars)

    sm = difflib.SequenceMatcher(None, db_pinyin, tr_pinyin, autojunk=False)

    extras = []

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'insert':
            # 音频有但DB没有
            chunk_chars = tr_chars[j1:j2]
            chunk_text = ''.join(chunk_chars)
            chunk_pinyin_len = sum(len(p) for p in tr_pinyin[j1:j2])

            # 至少3个汉字才报告（过滤噪声）
            if len(chunk_chars) < 3:
                continue

            # 获取上下文
            ctx_before = ''.join(tr_chars[max(0, j1-8):j1])
            ctx_after = ''.join(tr_chars[j2:min(len(tr_chars), j2+8)])
            position_ratio = j1 / len(tr_chars) if tr_chars else 0

            # 估算在音频中的大致时间
            segments = transcription.get("segments", [])
            approx_time = _estimate_time(j1, tr_chars, segments)

            extras.append({
                "extra_text": chunk_text,
                "char_count": len(chunk_chars),
                "pinyin_len": chunk_pinyin_len,
                "context_before": ctx_before,
                "context_after": ctx_after,
                "position_ratio": position_ratio,
                "approx_time": approx_time,
            })

        elif tag == 'replace':
            # 替换块：检查音频侧是否明显更长
            db_chunk = db_chars[i1:i2]
            tr_chunk = tr_chars[j1:j2]
            db_pl = sum(len(p) for p in db_pinyin[i1:i2])
            tr_pl = sum(len(p) for p in tr_pinyin[j1:j2])

            if tr_pl <= db_pl:
                continue

            extra_chars = len(tr_chunk) - len(db_chunk)
            if extra_chars < 3:
                continue

            # 检查相似度 - 如果很相似说明只是用词差异，不是重复
            sub_sim = difflib.SequenceMatcher(
                None, db_pinyin[i1:i2], tr_pinyin[j1:j2]
            ).ratio()

            # 放宽条件：只要音频比DB多5个以上字符，且相似度不太高
            if sub_sim > 0.8:
                continue

            extra_text = ''.join(tr_chunk)
            db_text_chunk = ''.join(db_chunk)
            ctx_before = ''.join(tr_chars[max(0, j1-8):j1])
            ctx_after = ''.join(tr_chars[j2:min(len(tr_chars), j2+8)])

            segments = transcription.get("segments", [])
            approx_time = _estimate_time(j1, tr_chars, segments)

            extras.append({
                "extra_text": extra_text,
                "db_text": db_text_chunk,
                "char_count": extra_chars,
                "pinyin_len": tr_pl - db_pl,
                "context_before": ctx_before,
                "context_after": ctx_after,
                "position_ratio": j1 / len(tr_chars) if tr_chars else 0,
                "approx_time": approx_time,
                "type": "replace",
                "similarity": sub_sim,
            })

    # 额外检测：检查转录中是否有连续重复的短语（直接重复朗读）
    tr_text_clean = strip_all(tr_text)
    for length in range(6, 20):  # 检查6-20字符的重复
        for i in range(len(tr_text_clean) - length * 2):
            phrase = tr_text_clean[i:i+length]
            next_start = i + length
            next_phrase = tr_text_clean[next_start:next_start+length]
            if phrase == next_phrase:
                # 检查这个短语在DB中是否只出现一次
                db_clean = strip_all(cleaned)
                db_count = db_clean.count(phrase)
                tr_count = tr_text_clean.count(phrase)
                if tr_count > db_count and db_count >= 1:
                    # 确认是重复：音频中出现次数 > DB中出现次数
                    # 避免重复报告
                    already_reported = False
                    for e in extras:
                        if phrase in e.get("extra_text", "") or phrase in e.get("context_before", "") + e.get("context_after", ""):
                            already_reported = True
                            break
                    if not already_reported:
                        segments = transcription.get("segments", [])
                        approx_time = _estimate_time(i, list(tr_text_clean), segments)
                        extras.append({
                            "extra_text": f"[重复] {phrase} (音频{tr_count}次 vs DB{db_count}次)",
                            "char_count": length,
                            "context_before": tr_text_clean[max(0,i-8):i],
                            "context_after": tr_text_clean[i+length*2:i+length*2+8],
                            "position_ratio": i / len(tr_text_clean),
                            "approx_time": approx_time,
                            "type": "duplicate",
                        })
                        break  # 只报告一次这个位置

    return extras, len(db_chars), len(tr_chars)


def _estimate_time(char_pos, tr_chars, segments):
    """根据字符位置估算音频时间"""
    if not segments:
        return 0.0

    total_duration = segments[-1]["end"]
    total_chars = sum(len(strip_all(s["text"])) for s in segments)

    if total_chars == 0:
        return 0.0

    # 线性估算
    ratio = min(char_pos / total_chars, 1.0) if total_chars > 0 else 0
    return ratio * total_duration


def format_time(seconds):
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m}:{s:02d}"


def main():
    parser = argparse.ArgumentParser(description="检测冥想音频中的重复朗读")
    parser.add_argument("--course", type=str)
    parser.add_argument("--day", type=int)
    parser.add_argument("--all-days", action="store_true",
                        help="扫描全部天数（默认只扫描3.28之后+4-6月全部）")
    args = parser.parse_args()

    if args.course:
        course_keys = [args.course]
    else:
        course_keys = list(COURSES.keys())

    suspicious = []

    for system_key in course_keys:
        info = COURSES[system_key]
        print(f"\n--- {info['title']} ---")

        course_data = fetch_course_data(system_key)

        for item in course_data:
            day = item["sequence_number"]

            # 默认范围：3月从28开始，4-6月全部
            if not args.all_days and not args.day:
                if system_key == "dependency_freedom" and day < 28:
                    continue

            if args.day and day != args.day:
                continue

            if not item["meditation_guide"]:
                continue

            # 读取缓存
            cache_file = CACHE_PATH / system_key / f"day_{day}.json"
            if not cache_file.exists():
                print(f"  Day {day}: 无缓存，跳过")
                continue

            with open(cache_file, "r", encoding="utf-8") as f:
                transcription = json.load(f)

            extras, db_len, tr_len = detect_extra_content(
                item["meditation_guide"], transcription
            )

            len_diff = tr_len - db_len
            len_ratio = tr_len / db_len * 100 if db_len > 0 else 100

            if extras:
                print(f"  Day {day}: ⚠️  发现 {len(extras)} 处多余内容 (DB:{db_len}字 vs 音频:{tr_len}字, {len_ratio:.0f}%)")
                for i, e in enumerate(extras):
                    time_str = format_time(e["approx_time"])
                    etype = e.get("type", "insert")
                    if etype == "duplicate":
                        print(f"    [{i+1}] @{time_str}: {e['extra_text']}")
                    elif etype == "replace":
                        print(f"    [{i+1}] @{time_str}: 音频「{e['extra_text']}」vs DB「{e.get('db_text','')}」(相似度{e.get('similarity',0):.0%}, 多{e['char_count']}字)")
                    else:
                        print(f"    [{i+1}] @{time_str}: 多出「{e['extra_text']}」(前文:...{e['context_before']}| 后文:{e['context_after']}...)")

                suspicious.append({
                    "course": system_key,
                    "day": day,
                    "extras": extras,
                    "db_len": db_len,
                    "tr_len": tr_len,
                })
            else:
                if len_diff > 10:
                    print(f"  Day {day}: ✅ 无显著多余 (但音频多{len_diff}字: DB:{db_len} vs 音频:{tr_len})")
                else:
                    print(f"  Day {day}: ✅")

    print(f"\n{'='*60}")
    print(f"扫描完成: {len(suspicious)} 天有可疑多余内容")
    if suspicious:
        print(f"\n可疑天数列表:")
        for s in suspicious:
            course_title = COURSES[s['course']]['title']
            print(f"  - {course_title} Day {s['day']}: {len(s['extras'])} 处")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
