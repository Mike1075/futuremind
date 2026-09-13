# -*- coding: utf-8 -*-
"""
检测音频开头是否包含DB文本括号内容（系统性语序bug）

原始TTS脚本可能把括号注释（如"（比如拖延、急躁）"）提取并放到音频开头。
本脚本通过检查音频前N段是否匹配DB文本中的括号内容来检测此问题。
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check_order import load_transcript_cache, fetch_course_contents, strip_punctuation
from config import COURSES


def extract_paren_content(text):
    """提取DB文本中所有括号内的内容"""
    # 中文括号 和 英文括号
    matches = re.findall(r'[（(]([^）)]{1,50})[）)]', text)
    return [strip_punctuation(m) for m in matches if len(strip_punctuation(m)) >= 2]


def extract_first_spoken_word(db_text):
    """找到DB文本中第一个实际朗读的词（去除标题标记后）"""
    lines = db_text.split('\n')
    for line in lines:
        s = line.strip()
        if not s:
            continue
        # 跳过标题、阶段标记
        if re.search(r'【冥想主题', s):
            continue
        if re.match(r'^[\*]*第[一二三四五六七八九十\d]+部分', s):
            continue
        if re.match(r'^\**准备阶段[：:]', s.replace('*', '')):
            continue
        if re.match(r'^\**引导语[：:]', s.replace('*', '')):
            continue
        # 清理
        s = re.sub(r'\*\*([^*]*)\*\*', r'\1', s)
        s = re.sub(r'\*\*', '', s)
        s = s.strip('""\u201c\u201d')
        s = strip_punctuation(s)
        if len(s) >= 2:
            return s[:20]
    return ""


def check_day(segments, db_text):
    """检查音频开头是否包含括号内容"""
    if not segments or not db_text:
        return None

    paren_contents = extract_paren_content(db_text)
    if not paren_contents:
        return None

    first_spoken = extract_first_spoken_word(db_text)

    # 取音频前10段的文本
    audio_start_segs = []
    for seg in segments[:10]:
        t = strip_punctuation(seg.get('text', ''))
        if len(t) >= 2:
            audio_start_segs.append(t)

    # 找音频中第一个匹配DB开头内容的段
    first_match_idx = -1
    for i, seg_text in enumerate(audio_start_segs):
        if first_spoken and seg_text[:6] in first_spoken[:15]:
            first_match_idx = i
            break

    # 检查在"第一个正文段"之前，是否有段匹配括号内容
    misplaced = []
    for i, seg_text in enumerate(audio_start_segs):
        if first_match_idx >= 0 and i >= first_match_idx:
            break  # 已经到了正文部分
        for pc in paren_contents:
            # 检查音频段是否包含在某个括号内容中，或括号内容包含在音频段中
            if len(seg_text) >= 3 and len(pc) >= 3:
                if seg_text[:6] in pc or pc[:6] in seg_text:
                    misplaced.append({
                        'seg_idx': i,
                        'seg_text': segments[i].get('text', ''),
                        'paren_text': pc,
                    })
                    break

    if misplaced:
        return {
            'first_spoken': first_spoken,
            'first_match_idx': first_match_idx,
            'misplaced': misplaced,
            'paren_contents': paren_contents,
        }

    # 也检查中间部分：括号内容是否在音频中出现在错误的位置
    # (比如6月Day9的中间段落颠倒)
    return None


def main():
    print("=" * 60)
    print("  检测括号内容语序错误")
    print("=" * 60)

    issues = []
    total_checked = 0

    for course_key, info in COURSES.items():
        title = info['title']
        print(f"\n--- {title} ---")

        db_guides = fetch_course_contents(info['system_id'])

        for day in range(1, info['days'] + 1):
            cache = load_transcript_cache(course_key, day)
            if not cache:
                continue
            db_text = db_guides.get(day, '')
            if not db_text:
                continue
            segments = cache.get('segments', [])
            if not segments:
                continue

            total_checked += 1
            result = check_day(segments, db_text)

            if result:
                issues.append({
                    'course': course_key,
                    'title': title,
                    'day': day,
                    **result,
                })
                mis_texts = [m['seg_text'][:15] for m in result['misplaced']]
                print(f"  Day {day:2d}: !!! 音频开头有括号内容: {', '.join(mis_texts)}")
            else:
                # 也打印有括号内容但音频OK的天
                paren = extract_paren_content(db_text)
                if paren:
                    print(f"  Day {day:2d}: OK (有{len(paren)}处括号)")
                else:
                    print(f"  Day {day:2d}: OK (无括号)")

    print(f"\n{'=' * 60}")
    print(f"  汇总：检查 {total_checked} 天，发现 {len(issues)} 天有括号内容语序错误")
    print(f"{'=' * 60}")

    if issues:
        for item in issues:
            print(f"\n  {item['title']} Day {item['day']}:")
            print(f"    DB文本正文开头: {item['first_spoken']}")
            print(f"    音频开头错误内容:")
            for m in item['misplaced']:
                print(f"      - \"{m['seg_text']}\" (来自括号: {m['paren_text']})")


if __name__ == '__main__':
    main()
