"""
check_quote_errors.py - 检查音频中引号附近的TTS误读

对比 Whisper 转录和源文本，在引号附近找单字级差异。
TTS 引擎容易在引号边界处吞字或错位。

用法: python check_quote_errors.py
"""

import json
import re
import difflib
from pathlib import Path
from config import COURSES
from main import fetch_course_data, CACHE_PATH
from analyze import strip_all, flatten_to_chars, chars_to_pinyin

SCRIPT_DIR = Path(__file__).parent


def extract_quoted_phrases(text):
    """提取所有单引号包围的短语及其位置"""
    # 匹配 'xxx' 或 'xxx' 或 'xxx' 格式
    patterns = [
        r"[''']([^''']+)[''']",  # 智能引号
        r"'([^']+)'",  # ASCII 单引号
    ]
    results = []
    for pat in patterns:
        for m in re.finditer(pat, text):
            results.append({
                "phrase": m.group(1),
                "full_match": m.group(0),
                "start": m.start(),
                "end": m.end(),
            })
    return results


def clean_for_compare(text):
    """清理文本用于对比：去标点，保留汉字"""
    # 去掉所有非汉字字符
    return re.sub(r'[^\u4e00-\u9fff]', '', text)


def find_context_in_transcription(source_text, quoted_phrase, transcription_text, context_chars=8):
    """
    在转录文本中查找引号短语，检查是否完整出现。
    返回: {"found": bool, "expected": str, "actual": str, "issue": str}
    """
    clean_source = clean_for_compare(source_text)
    clean_trans = clean_for_compare(transcription_text)
    clean_phrase = clean_for_compare(quoted_phrase)

    if not clean_phrase:
        return None

    # 找引号短语在清理后源文本中的位置
    phrase_pos = clean_source.find(clean_phrase)
    if phrase_pos == -1:
        return None

    # 取引号短语前后的上下文（用于在转录中定位）
    ctx_before = clean_source[max(0, phrase_pos - context_chars):phrase_pos]
    ctx_after = clean_source[phrase_pos + len(clean_phrase):phrase_pos + len(clean_phrase) + context_chars]

    # 完整上下文（含引号短语）
    expected_segment = ctx_before + clean_phrase + ctx_after

    # 在转录中查找这个上下文
    # 先试完全匹配
    if expected_segment in clean_trans:
        return {"found": True, "issue": None}

    # 如果完全匹配失败，用前后文定位转录中的对应片段
    # 找前文在转录中的位置
    before_pos = clean_trans.find(ctx_before)
    if before_pos == -1 and len(ctx_before) > 3:
        # 缩短前文再找
        ctx_before = ctx_before[-4:]
        before_pos = clean_trans.find(ctx_before)

    if before_pos == -1:
        return None  # 无法定位

    # 从前文结束位置开始，取与expected_segment等长的转录片段
    trans_start = before_pos
    expected_len = len(expected_segment)
    actual_segment = clean_trans[trans_start:trans_start + expected_len + 2]  # 多取几个字

    if not actual_segment:
        return None

    # 对比预期和实际
    if clean_phrase in actual_segment:
        return {"found": True, "issue": None}

    # 找具体差异
    # 用 difflib 比对
    expected_phrase_region = ctx_before + clean_phrase
    actual_phrase_region = actual_segment[:len(expected_phrase_region) + 2]

    sm = difflib.SequenceMatcher(None, expected_phrase_region, actual_phrase_region)
    ops = sm.get_opcodes()

    issues = []
    for op, i1, i2, j1, j2 in ops:
        if op == 'delete':
            deleted = expected_phrase_region[i1:i2]
            # 检查删除的字是否在引号短语范围内
            if i1 >= len(ctx_before) and i1 < len(ctx_before) + len(clean_phrase):
                issues.append(f"缺'{deleted}'")
        elif op == 'insert':
            inserted = actual_phrase_region[j1:j2]
            if i1 >= len(ctx_before) - 1 and i1 <= len(ctx_before) + len(clean_phrase):
                issues.append(f"多'{inserted}'")
        elif op == 'replace':
            old = expected_phrase_region[i1:i2]
            new = actual_phrase_region[j1:j2]
            if i1 >= len(ctx_before) - 1 and i1 <= len(ctx_before) + len(clean_phrase):
                issues.append(f"'{old}'→'{new}'")

    if issues:
        return {
            "found": False,
            "expected": expected_phrase_region,
            "actual": actual_phrase_region,
            "issue": "；".join(issues),
        }

    return {"found": True, "issue": None}


def main():
    print("=" * 60)
    print("引号附近 TTS 误读检查")
    print("=" * 60)

    all_issues = []

    for system_key in COURSES:
        info = COURSES[system_key]
        print(f"\n--- {info['title']} ---")

        course_data = fetch_course_data(system_key)

        for item in course_data:
            day = item["sequence_number"]
            guide = item.get("meditation_guide") or ""
            if not guide:
                continue

            # 加载转录缓存
            cache_file = CACHE_PATH / system_key / f"day_{day}.json"
            if not cache_file.exists():
                continue

            with open(cache_file, "r", encoding="utf-8") as f:
                transcription = json.load(f)

            trans_text = transcription.get("text", "")

            # 提取引号短语
            quoted = extract_quoted_phrases(guide)
            if not quoted:
                continue

            for q in quoted:
                result = find_context_in_transcription(
                    guide, q["phrase"], trans_text
                )
                if result and not result["found"] and result.get("issue"):
                    issue_info = {
                        "course": system_key,
                        "day": day,
                        "quoted_phrase": q["phrase"],
                        "full_match": q["full_match"],
                        "issue": result["issue"],
                        "expected": result.get("expected", ""),
                        "actual": result.get("actual", ""),
                    }
                    all_issues.append(issue_info)
                    print(f"  Day {day}: '{q['phrase']}' → {result['issue']}")

    print(f"\n{'=' * 60}")
    print(f"共发现 {len(all_issues)} 处引号附近疑似误读")
    print(f"{'=' * 60}")

    if all_issues:
        # 保存报告
        report_path = SCRIPT_DIR / "output" / "quote_errors_report.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(all_issues, f, ensure_ascii=False, indent=2)
        print(f"报告已保存: {report_path}")

        print(f"\n详细列表:")
        for item in all_issues:
            print(f"  {item['course']} Day {item['day']}: "
                  f"'{item['quoted_phrase']}' - {item['issue']}")
            print(f"    预期: {item['expected']}")
            print(f"    实际: {item['actual']}")


if __name__ == "__main__":
    main()
