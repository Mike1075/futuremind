"""
冥想音频顺序检测脚本 v3

检测音频转录与数据库文本之间的顺序差异：
1. 音频开头的内容是否对应DB文本的开头（而非中间/末尾）
2. 音频各段是否按DB文本的正向顺序排列（不跳回）

核心算法：使用 n-gram 滑动窗口进行模糊定位。
对于重复短语（如"它在说什么"出现3次），使用前向一致性选择最佳匹配位置。
"""

import json
import os
import re
import sys
import urllib.request
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import SUPABASE_URL, SUPABASE_ANON_KEY, COURSES

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")


# ============================================================
# 文本清理
# ============================================================

def clean_db_text(text: str) -> str:
    """
    清理数据库冥想引导文本，只保留实际朗读内容。
    """
    if not text:
        return ""

    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # 跳过标题行: **【冥想主题：...】**  或 【冥想主题：...】
        if re.search(r'【冥想主题[：:].*】', stripped):
            continue

        # 跳过 "第二部分：冥想练习与引导**" 等章节标题
        if re.match(r'^[\*]*第[一二三四五六七八九十\d]+部分[：:]', stripped):
            continue

        # 跳过纯阶段标记行
        stage_keywords = (
            '准备阶段', '引导语', '深化阶段', '收束阶段', '觉察阶段',
            '探索阶段', '回归阶段', '转化阶段', '整合阶段', '静默阶段',
            '开场', '尾声', '结束语', '结束'
        )
        is_stage_line = False
        for kw in stage_keywords:
            if re.match(rf'^\**{kw}[：:]\**\s*$', stripped.replace('*', '')):
                is_stage_line = True
                break
        if is_stage_line:
            continue

        # 跳过纯舞台指示行
        if re.match(r'^[（(].*[）)]$', stripped):
            continue

        cleaned_lines.append(stripped)

    text = '\n'.join(cleaned_lines)

    # 移除 **加粗标记**
    text = re.sub(r'\*\*([^*]*)\*\*', r'\1', text)
    text = re.sub(r'\*\*', '', text)  # 残余的 **

    # 移除行内括号指示: （静默30秒）、（语速缓慢...）、（寻找爱）、（学习）等
    text = re.sub(r'[（(][^）)]{0,30}[）)]', '', text)

    # 移除引号
    text = text.replace('\\"', '').replace('"', '').replace('\u201c', '').replace('\u201d', '')
    text = text.replace("'", '').replace('\u2018', '').replace('\u2019', '')

    # 移除编号如 "1. " "2. "
    text = re.sub(r'\d+\.\s*', '', text)

    # 移除省略号
    text = text.replace('……', '').replace('...', '').replace('\u2026', '')

    # 合并空白
    text = re.sub(r'[\s\n]+', '', text)

    return text


def strip_punctuation(text: str) -> str:
    """移除所有标点和空白，只留汉字和字母数字"""
    return re.sub(r'[^\u4e00-\u9fff\w]', '', text)


# ============================================================
# 模糊定位算法
# ============================================================

def build_ngram_index(text: str, n: int = 3) -> dict:
    """构建 n-gram 到位置列表的索引"""
    index = {}
    for i in range(len(text) - n + 1):
        gram = text[i:i + n]
        if gram not in index:
            index[gram] = []
        index[gram].append(i)
    return index


def fuzzy_locate_all(query: str, target: str, ngram_index: dict, n: int = 3) -> list:
    """
    使用 n-gram 投票法在 target 中定位 query 的所有候选位置。

    返回: [(pct, vote_count), ...] 按得票数降序排列，空列表表示找不到
    """
    if len(query) < n or len(target) < n:
        return []

    query_clean = strip_punctuation(query)
    if len(query_clean) < n:
        return []

    # 对 query 的每个 n-gram，在 target 中找位置
    votes = {}  # bucket -> vote_count
    for qi in range(len(query_clean) - n + 1):
        gram = query_clean[qi:qi + n]
        if gram in ngram_index:
            for ti in ngram_index[gram]:
                start_pos = ti - qi
                bucket = start_pos // 3 * 3
                votes[bucket] = votes.get(bucket, 0) + 1

    if not votes:
        return []

    total_grams = len(query_clean) - n + 1
    min_votes = max(2, total_grams * 0.25)

    # 筛选有效候选
    candidates = []
    for bucket, count in sorted(votes.items(), key=lambda x: -x[1]):
        if count >= min_votes:
            pos = max(0, bucket)
            pct = int(pos / len(target) * 100) if len(target) > 0 else 0
            pct = min(pct, 100)
            candidates.append((pct, count))

    return candidates


def fuzzy_locate(query: str, target: str, ngram_index: dict, n: int = 3) -> int:
    """返回最佳匹配的百分比位置，找不到返回 -1"""
    candidates = fuzzy_locate_all(query, target, ngram_index, n)
    return candidates[0][0] if candidates else -1


# ============================================================
# 顺序检测（含重复短语处理）
# ============================================================

def resolve_positions_with_forward_preference(
    segments: list, db_flat: str, ngram_idx: dict, n: int = 3
) -> list:
    """
    对每个段进行定位，处理重复短语时优先选择保持前向一致性的位置。

    算法：
    1. 先对每段获取所有候选位置
    2. 使用动态规划选择整体最优的前向路径
    3. 对无法保持前向的段标记为真正的回跳
    """
    # 第一步：获取所有段的候选位置
    seg_candidates = []  # [(seg_idx, [(pct, votes), ...]), ...]

    for i, seg in enumerate(segments):
        seg_text = strip_punctuation(seg.get("text", ""))
        if len(seg_text) < n:
            seg_candidates.append((i, []))
            continue
        query = seg_text[:30]
        candidates = fuzzy_locate_all(query, db_flat, ngram_idx, n)
        seg_candidates.append((i, candidates))

    # 第二步：贪心前向选择
    # 维护当前位置，对每个段选择 >= 当前位置的最小候选
    # 如果所有候选都 < 当前位置，则选择得票最高的（标记为潜在回跳）
    resolved = []  # [(seg_idx, pct, is_forward)]
    current_pct = -1

    for seg_idx, candidates in seg_candidates:
        if not candidates:
            continue

        # 找 >= current_pct 且得票足够的候选
        forward_candidates = [(pct, v) for pct, v in candidates if pct >= current_pct - 5]
        # 在 forward 候选中，选得票最高的
        # 如果有多个得票相同的，选最接近 current_pct 的（最小的前向位置）
        if forward_candidates:
            # 先按得票降序，再按位置升序
            forward_candidates.sort(key=lambda x: (-x[1], x[0]))
            chosen_pct = forward_candidates[0][0]
            resolved.append((seg_idx, chosen_pct, True))
            current_pct = chosen_pct
        else:
            # 所有候选都在当前位置之前 => 真正的回跳
            best_pct = candidates[0][0]  # 得票最高的
            resolved.append((seg_idx, best_pct, False))
            # 不更新 current_pct，保持之前的高水位

    return resolved


def analyze_day(segments: list, db_text: str) -> dict:
    """
    分析一天的音频顺序。
    """
    db_clean = clean_db_text(db_text)
    db_flat = strip_punctuation(db_clean)

    if not db_flat or not segments:
        return {
            "start_pct": -1, "positions": [], "backward_jumps": [],
            "order_score": 1.0, "matched": 0, "total": len(segments),
            "first_audio": "", "first_db": db_clean[:40],
            "issues": []
        }

    N = 3
    ngram_idx = build_ngram_index(db_flat, N)

    # 使用前向一致性解析定位
    resolved = resolve_positions_with_forward_preference(segments, db_flat, ngram_idx, N)

    # 转为简单 positions 列表
    positions = [(seg_idx, pct) for seg_idx, pct, _ in resolved]

    # 首段定位（拼接前几段获取更长文本）
    first_audio_text = strip_punctuation(segments[0].get("text", "")) if segments else ""
    start_pct = -1
    if first_audio_text:
        combined_start = ""
        for seg in segments[:5]:
            combined_start += strip_punctuation(seg.get("text", ""))
            if len(combined_start) >= 40:
                break
        start_pct = fuzzy_locate(combined_start[:50], db_flat, ngram_idx, N)

    # 检测回跳：找到实际跳回点（从 forward 变 non-forward 的转折处）
    # 连续的 non-forward 段属于同一次跳回事件，只记录第一个
    backward_jumps = []
    in_backward_region = False
    for i, (seg_idx, pct, is_forward) in enumerate(resolved):
        if not is_forward and i > 0:
            if not in_backward_region:
                # 这是一个新的回跳事件的起点
                in_backward_region = True
                # 找之前最近的 forward 高水位点
                prev_forward = None
                for j in range(i - 1, -1, -1):
                    if resolved[j][2]:  # is_forward
                        prev_forward = resolved[j]
                        break
                if prev_forward is None:
                    prev_forward = resolved[i - 1]

                prev_seg_idx, prev_pct, _ = prev_forward
                backward_jumps.append({
                    "from_seg": prev_seg_idx,
                    "to_seg": seg_idx,
                    "from_pct": prev_pct,
                    "to_pct": pct,
                    "from_text": segments[prev_seg_idx]["text"][:20],
                    "to_text": segments[seg_idx]["text"][:20],
                })
            # else: still in same backward region, skip
        else:
            in_backward_region = False

    # 顺序得分
    forward_count = sum(1 for _, _, f in resolved if f)
    order_score = forward_count / len(resolved) if resolved else 1.0

    # 汇总问题
    issues = []

    if start_pct > 15:
        issues.append(f"开头错位: 音频开头对应DB文本 {start_pct}% 处")

    if backward_jumps:
        for bj in backward_jumps:
            issues.append(
                f"回跳: 段{bj['from_seg']}({bj['from_pct']}%) -> "
                f"段{bj['to_seg']}({bj['to_pct']}%) "
                f"[{bj['from_text']}] -> [{bj['to_text']}]"
            )

    if order_score < 0.85 and len(resolved) >= 5:
        issues.append(f"顺序得分低: {order_score:.2f}")

    return {
        "start_pct": start_pct,
        "positions": positions,
        "backward_jumps": backward_jumps,
        "order_score": order_score,
        "matched": len(resolved),
        "total": len(segments),
        "first_audio": first_audio_text[:40],
        "first_db": db_flat[:40],
        "issues": issues,
    }


# ============================================================
# 数据获取
# ============================================================

def fetch_course_contents(system_id: str) -> dict:
    """从 Supabase REST API 获取课程的所有 meditation_guide"""
    url = f"{SUPABASE_URL}/rest/v1/course_contents"
    params = urllib.parse.urlencode({
        "select": "sequence_number,meditation_guide",
        "system_id": f"eq.{system_id}",
        "order": "sequence_number.asc",
    })
    full_url = f"{url}?{params}"

    req = urllib.request.Request(full_url, headers={
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    })

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    result = {}
    for row in data:
        seq = row["sequence_number"]
        guide = row.get("meditation_guide", "")
        if guide:
            result[seq] = guide
    return result


def load_transcript_cache(course_key: str, day: int):
    """加载转录缓存"""
    path = os.path.join(CACHE_DIR, course_key, f"day_{day}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ============================================================
# 主逻辑
# ============================================================

def analyze_course(course_key: str, course_info: dict) -> list:
    """分析一个课程"""
    title = course_info["title"]
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")

    system_id = course_info["system_id"]
    total_days = course_info["days"]

    print(f"  从数据库获取冥想引导文本...")
    db_guides = fetch_course_contents(system_id)
    print(f"  获取到 {len(db_guides)} 天")

    issues_list = []

    for day in range(1, total_days + 1):
        cache = load_transcript_cache(course_key, day)
        if not cache:
            continue

        db_text = db_guides.get(day, "")
        if not db_text:
            print(f"  Day {day:2d}: [跳过] DB无文本")
            continue

        segments = cache.get("segments", [])
        if not segments:
            continue

        result = analyze_day(segments, db_text)

        if result["issues"]:
            issues_list.append({
                "course": course_key,
                "course_title": title,
                "day": day,
                **result,
            })
            marker = "!!!"
            short_issues = " | ".join(result["issues"])
            print(f"  Day {day:2d}: {marker} {short_issues}")
        else:
            print(f"  Day {day:2d}: OK  (pos={result['start_pct']:3d}%  order={result['order_score']:.2f}  matched={result['matched']}/{result['total']})")

    return issues_list


def main():
    print("=" * 60)
    print("  冥想音频顺序检测 v3")
    print("  n-gram 模糊匹配 + 前向一致性消歧 + 回跳检测")
    print("=" * 60)

    all_issues = []

    for course_key, course_info in COURSES.items():
        issues = analyze_course(course_key, course_info)
        all_issues.extend(issues)

    # ---- 汇总报告 ----
    print(f"\n\n{'=' * 60}")
    print(f"  汇总报告")
    print(f"{'=' * 60}")

    if not all_issues:
        print("\n  未检测到顺序问题。所有音频内容顺序与数据库文本一致。")
    else:
        print(f"\n  共检测到 {len(all_issues)} 天存在潜在顺序问题:\n")

        # 分类
        start_issues = [x for x in all_issues if x["start_pct"] > 15]
        jump_issues = [x for x in all_issues if x["backward_jumps"]]

        if start_issues:
            print(f"  --- 开头错位 ({len(start_issues)} 天) ---")
            print(f"  (音频开头不是DB文本的开头，可能缺失了开头部分)")
            for item in start_issues:
                print(f"\n    [{item['course_title']}] Day {item['day']}")
                print(f"      音频开头位于DB文本 {item['start_pct']}% 处")
                print(f"      音频开头: {item['first_audio'][:35]}")
                print(f"      DB开头:   {item['first_db'][:35]}")

        if jump_issues:
            print(f"\n  --- 顺序回跳 ({len(jump_issues)} 天) ---")
            print(f"  (音频中间出现了属于更早位置的内容)")
            for item in jump_issues:
                print(f"\n    [{item['course_title']}] Day {item['day']}")
                for bj in item["backward_jumps"]:
                    print(f"      段{bj['from_seg']}({bj['from_pct']}%) -> 段{bj['to_seg']}({bj['to_pct']}%)")
                    print(f"        [{bj['from_text']}] -> [{bj['to_text']}]")

    # 保存 JSON 报告
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "order_check_report.json")

    report = []
    for item in all_issues:
        report.append({
            "course": item["course"],
            "course_title": item["course_title"],
            "day": item["day"],
            "start_pct": item["start_pct"],
            "order_score": item["order_score"],
            "backward_jumps": item["backward_jumps"],
            "matched": item["matched"],
            "total": item["total"],
            "first_audio": item["first_audio"],
            "first_db": item["first_db"],
            "issues": item["issues"],
        })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n  详细报告已保存: {output_path}")


if __name__ == "__main__":
    main()
