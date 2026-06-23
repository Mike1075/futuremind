"""
scan_anomalies.py - 全面扫描音频异常

检测类型：
1. 重复短语：音频中某个短语重复出现但源文本只有一次
2. 短缺失：1-7个字的缺失（低于之前的检测阈值）
3. 音频多余内容：音频中有但源文本没有的内容
4. 可疑替换：非同音字的字词替换

用法: python scan_anomalies.py
"""

import json
import re
import difflib
import sys
from pathlib import Path
from collections import Counter

from config import COURSES
from main import fetch_course_data, clean_db_text, CACHE_PATH
from analyze import strip_all, flatten_to_chars, chars_to_pinyin

SCRIPT_DIR = Path(__file__).parent

# 同音字对（Whisper 常混淆的，不算真正的错误）
HOMOPHONES = {
    ('他', '它'), ('它', '他'), ('她', '他'), ('他', '她'),
    ('的', '地'), ('地', '的'), ('的', '得'), ('得', '的'),
    ('脱', '拖'), ('拖', '脱'),
    ('在', '再'), ('再', '在'),
    ('做', '作'), ('作', '做'),
    ('那', '哪'), ('哪', '那'),
    ('象', '像'), ('像', '象'),
    ('带', '待'), ('待', '带'),
    ('以', '已'), ('已', '以'),
    ('即', '既'), ('既', '即'),
    ('坐', '座'), ('座', '坐'),
    ('为', '喂'), ('喂', '为'),  # Day 4 的情况
}

# 异体字/同义（不算错误）
VARIANTS = {
    ('著', '着'), ('着', '著'),
    ('虑', '慮'),
}


def is_homophone_pair(c1, c2):
    """检查两个字是否是同音字对"""
    return (c1, c2) in HOMOPHONES or (c2, c1) in HOMOPHONES


def is_variant_pair(c1, c2):
    """检查两个字是否是异体字"""
    return (c1, c2) in VARIANTS or (c2, c1) in VARIANTS


def find_repeated_phrases(transcription_text, source_text, min_len=3, max_len=10):
    """
    在转录文本中查找重复短语，但这些短语在源文本中只出现一次。
    返回: [{"phrase": str, "count_trans": int, "count_source": int}, ...]
    """
    clean_trans = re.sub(r'[^\u4e00-\u9fff]', '', transcription_text)
    clean_source = re.sub(r'[^\u4e00-\u9fff]', '', source_text)

    results = []
    checked = set()

    for length in range(min_len, max_len + 1):
        for i in range(len(clean_trans) - length + 1):
            phrase = clean_trans[i:i + length]
            if phrase in checked:
                continue
            checked.add(phrase)

            count_trans = clean_trans.count(phrase)
            count_source = clean_source.count(phrase)

            # 在转录中出现次数比源文本多
            if count_trans > count_source and count_trans >= 2 and count_source <= 1:
                # 排除子串（如果更长的短语已经被记录了）
                is_substring = False
                for r in results:
                    if phrase in r["phrase"] and len(r["phrase"]) > len(phrase):
                        is_substring = True
                        break
                if not is_substring:
                    # 也排除太常见的短重复（如"的"重复）
                    if length >= 3:
                        results.append({
                            "phrase": phrase,
                            "count_trans": count_trans,
                            "count_source": count_source,
                            "extra": count_trans - count_source,
                        })

    # 去除被更长短语覆盖的结果
    final = []
    for r in sorted(results, key=lambda x: len(x["phrase"]), reverse=True):
        is_covered = False
        for f in final:
            if r["phrase"] in f["phrase"]:
                is_covered = True
                break
        if not is_covered:
            final.append(r)

    return final


def find_short_anomalies(db_text_cleaned, transcription_text):
    """
    查找短缺失、短多余、可疑替换。
    返回分类后的异常列表。
    """
    tr_text = transcription_text.replace("\n", "")
    db_chars = flatten_to_chars(db_text_cleaned)
    tr_chars = flatten_to_chars(tr_text)

    if not db_chars or not tr_chars:
        return []

    db_pinyin = chars_to_pinyin(db_chars)
    tr_pinyin = chars_to_pinyin(tr_chars)

    sm = difflib.SequenceMatcher(None, db_pinyin, tr_pinyin, autojunk=False)

    anomalies = []

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue

        db_chunk = "".join(db_chars[i1:i2])
        tr_chunk = "".join(tr_chars[j1:j2])

        # 上下文
        ctx_before_db = "".join(db_chars[max(0, i1-5):i1])
        ctx_after_db = "".join(db_chars[i2:i2+5])
        ctx_before_tr = "".join(tr_chars[max(0, j1-5):j1])
        ctx_after_tr = "".join(tr_chars[j2:j2+5])

        if tag == "delete":
            # 源文本有但音频没有（缺失）
            char_len = len(db_chunk)
            if char_len >= 1 and char_len <= 7:
                anomalies.append({
                    "type": "short_missing",
                    "chars": db_chunk,
                    "char_len": char_len,
                    "context": f"...{ctx_before_db}[{db_chunk}]{ctx_after_db}...",
                    "context_tr": f"...{ctx_before_tr}_{ctx_after_tr}...",
                })

        elif tag == "insert":
            # 音频有但源文本没有（多余）
            char_len = len(tr_chunk)
            if char_len >= 2 and char_len <= 20:
                anomalies.append({
                    "type": "extra_content",
                    "chars": tr_chunk,
                    "char_len": char_len,
                    "context_db": f"...{ctx_before_db}_{ctx_after_db}...",
                    "context_tr": f"...{ctx_before_tr}[{tr_chunk}]{ctx_after_tr}...",
                })

        elif tag == "replace":
            db_len = len(db_chunk)
            tr_len = len(tr_chunk)

            # 跳过太长的替换（可能是大段差异/缓存问题）
            if db_len > 15 or tr_len > 15:
                continue

            # 逐字检查是否全是同音字
            if db_len == tr_len:
                all_homo = True
                non_homo_pairs = []
                for c1, c2 in zip(db_chunk, tr_chunk):
                    if c1 != c2 and not is_homophone_pair(c1, c2) and not is_variant_pair(c1, c2):
                        all_homo = False
                        non_homo_pairs.append((c1, c2))
                if all_homo:
                    continue  # 全是同音字，跳过

                if non_homo_pairs:
                    anomalies.append({
                        "type": "suspicious_replace",
                        "db_text": db_chunk,
                        "tr_text": tr_chunk,
                        "non_homo": non_homo_pairs,
                        "context": f"...{ctx_before_db}[{db_chunk}→{tr_chunk}]{ctx_after_db}...",
                    })
            else:
                # 长度不同的替换
                if abs(db_len - tr_len) <= 5:
                    anomalies.append({
                        "type": "len_mismatch_replace",
                        "db_text": db_chunk,
                        "tr_text": tr_chunk,
                        "context": f"源:{ctx_before_db}[{db_chunk}]{ctx_after_db} 音:{ctx_before_tr}[{tr_chunk}]{ctx_after_tr}",
                    })

    return anomalies


def main():
    sys.stdout.reconfigure(encoding='utf-8')

    print("=" * 60)
    print("全面音频异常扫描")
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

            cache_file = CACHE_PATH / system_key / f"day_{day}.json"
            if not cache_file.exists():
                continue

            with open(cache_file, "r", encoding="utf-8") as f:
                transcription = json.load(f)

            trans_text = transcription.get("text", "")
            cleaned_db = clean_db_text(guide)

            # 1. 查找重复短语
            repeats = find_repeated_phrases(trans_text, cleaned_db)
            for r in repeats:
                issue = {
                    "course": system_key,
                    "day": day,
                    "type": "repeat",
                    "desc": f"'{r['phrase']}' 音频{r['count_trans']}次/源文本{r['count_source']}次",
                    "detail": r,
                }
                all_issues.append(issue)
                print(f"  Day {day}: [重复] '{r['phrase']}' (音频{r['count_trans']}次, 源文本{r['count_source']}次)")

            # 2. 查找短异常
            anomalies = find_short_anomalies(cleaned_db, trans_text)
            for a in anomalies:
                if a["type"] == "short_missing":
                    # 只报告2字以上的短缺失（1字太多噪音）
                    if a["char_len"] >= 2:
                        issue = {
                            "course": system_key,
                            "day": day,
                            "type": "short_missing",
                            "desc": f"缺'{a['chars']}' ({a['char_len']}字)",
                            "detail": a,
                        }
                        all_issues.append(issue)
                        print(f"  Day {day}: [短缺失] '{a['chars']}' {a['context']}")

                elif a["type"] == "extra_content":
                    if a["char_len"] >= 3:
                        issue = {
                            "course": system_key,
                            "day": day,
                            "type": "extra",
                            "desc": f"多'{a['chars']}' ({a['char_len']}字)",
                            "detail": a,
                        }
                        all_issues.append(issue)
                        print(f"  Day {day}: [多余] '{a['chars']}' {a['context_tr']}")

                elif a["type"] == "suspicious_replace":
                    issue = {
                        "course": system_key,
                        "day": day,
                        "type": "replace",
                        "desc": f"'{a['db_text']}'→'{a['tr_text']}' (非同音)",
                        "detail": a,
                    }
                    all_issues.append(issue)
                    print(f"  Day {day}: [可疑替换] {a['context']}")

                elif a["type"] == "len_mismatch_replace":
                    issue = {
                        "course": system_key,
                        "day": day,
                        "type": "mismatch",
                        "desc": f"'{a['db_text']}'→'{a['tr_text']}'",
                        "detail": a,
                    }
                    all_issues.append(issue)
                    print(f"  Day {day}: [长度不匹] {a['context']}")

    # 汇总
    print(f"\n{'=' * 60}")
    print(f"扫描完成，共 {len(all_issues)} 处异常")
    print(f"{'=' * 60}")

    # 按类型统计
    type_counts = Counter(i["type"] for i in all_issues)
    for t, c in type_counts.most_common():
        labels = {
            "repeat": "重复短语",
            "short_missing": "短缺失(2-7字)",
            "extra": "多余内容",
            "replace": "可疑替换",
            "mismatch": "长度不匹配",
        }
        print(f"  {labels.get(t, t)}: {c} 处")

    # 保存报告
    report_path = SCRIPT_DIR / "output" / "anomaly_scan.txt"
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=== 音频异常全面扫描报告 ===\n\n")

        # 按课程和天排序
        sorted_issues = sorted(all_issues, key=lambda x: (x["course"], x["day"]))

        # 过滤出需要人工听辨的（排除已知的、重复度低的）
        human_check = []
        for issue in sorted_issues:
            # 跳过已知已修复的
            if issue["course"] == "dependency_freedom" and issue["day"] == 20:
                continue
            if issue["course"] == "energy_alchemy" and issue["day"] == 14:
                continue
            human_check.append(issue)

        f.write(f"需要人工听辨的可疑项: {len(human_check)} 处\n\n")

        current_course = None
        for issue in human_check:
            if issue["course"] != current_course:
                current_course = issue["course"]
                f.write(f"\n--- {COURSES[current_course]['title']} ---\n")

            f.write(f"  Day {issue['day']}: [{issue['type']}] {issue['desc']}\n")
            detail = issue.get("detail", {})
            if "context" in detail:
                f.write(f"    上下文: {detail['context']}\n")
            if "context_tr" in detail:
                f.write(f"    转录: {detail['context_tr']}\n")
            if "context_db" in detail:
                f.write(f"    源文本: {detail['context_db']}\n")

    print(f"\n报告已保存: {report_path}")

    # 也保存JSON格式
    json_path = SCRIPT_DIR / "output" / "anomaly_scan.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_issues, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
