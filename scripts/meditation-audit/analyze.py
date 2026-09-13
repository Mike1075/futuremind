"""
智能分析：基于全文拼音 diff 识别缺失/多余内容
用法: python analyze.py
"""

import json
import re
import difflib
from pathlib import Path
from datetime import datetime
from pypinyin import lazy_pinyin

from config import COURSES
from main import fetch_course_data, clean_db_text, CACHE_PATH

SCRIPT_DIR = Path(__file__).parent
OUTPUT_PATH = SCRIPT_DIR / "output"

# 最小差异长度（拼音字符数），低于此长度视为用词/标点微调，忽略
# 注意：之前设为15漏掉了4字短语（如"只有声音"=14拼音），降低到8（约3个汉字）
MIN_GAP_PINYIN_LEN = 8


def to_pinyin_str(text: str) -> str:
    """中文转拼音空格分隔"""
    return ' '.join(lazy_pinyin(text))


def strip_all(text: str) -> str:
    """去除所有标点和空白，只留汉字和字母数字"""
    return re.sub(r'[^\u4e00-\u9fff\w]', '', text)


def flatten_to_chars(text: str) -> list[str]:
    """将文本展平为字符列表（去标点空白）"""
    return list(strip_all(text))


def chars_to_pinyin(chars: list[str]) -> list[str]:
    """字符列表转拼音列表"""
    return [lazy_pinyin(c)[0] if '\u4e00' <= c <= '\u9fff' else c for c in chars]


def find_content_gaps(db_text: str, tr_text: str) -> dict:
    """
    全文拼音 diff，找出缺失和多余的内容块。
    返回 {missing_from_audio: [str], extra_in_audio: [str], similarity: float}
    """
    # 去标点，拆字符
    db_chars = flatten_to_chars(db_text)
    tr_chars = flatten_to_chars(tr_text)

    if not db_chars and not tr_chars:
        return {"missing_from_audio": [], "extra_in_audio": [], "similarity": 1.0}

    # 转拼音
    db_pinyin = chars_to_pinyin(db_chars)
    tr_pinyin = chars_to_pinyin(tr_chars)

    # 用 SequenceMatcher 对拼音序列做 diff（关闭 autojunk 防止常见音节被忽略）
    sm = difflib.SequenceMatcher(None, db_pinyin, tr_pinyin, autojunk=False)
    similarity = sm.ratio()

    missing_from_audio = []  # DB 有 TR 没有
    extra_in_audio = []      # TR 有 DB 没有

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'delete':
            # DB 有但 TR 没有
            chunk_chars = db_chars[i1:i2]
            chunk_pinyin_len = sum(len(p) for p in db_pinyin[i1:i2])
            if chunk_pinyin_len >= MIN_GAP_PINYIN_LEN:
                missing_from_audio.append(''.join(chunk_chars))
        elif tag == 'insert':
            # TR 有但 DB 没有（仅报告短块，长块多为对齐偏移误报）
            chunk_chars = tr_chars[j1:j2]
            chunk_pinyin_len = sum(len(p) for p in tr_pinyin[j1:j2])
            char_count = j2 - j1
            if chunk_pinyin_len >= MIN_GAP_PINYIN_LEN and char_count <= 80:
                extra_in_audio.append(''.join(chunk_chars))
        elif tag == 'replace':
            # 替换：分别检查两侧是否是大块差异
            db_chunk = db_chars[i1:i2]
            tr_chunk = tr_chars[j1:j2]
            db_pl = sum(len(p) for p in db_pinyin[i1:i2])
            tr_pl = sum(len(p) for p in tr_pinyin[j1:j2])

            # replace 块：只有双方长度差异很大时才视为缺失/多余
            # （长度接近说明是用词差异，非缺失）
            len_ratio = min(db_pl, tr_pl) / max(db_pl, tr_pl) if max(db_pl, tr_pl) > 0 else 1
            sub_sim = difflib.SequenceMatcher(None, db_pinyin[i1:i2], tr_pinyin[j1:j2]).ratio()
            if sub_sim < 0.3 and len_ratio < 0.5:
                # 真正大块差异：一侧明显多于另一侧
                if db_pl > tr_pl and (db_pl - tr_pl) >= MIN_GAP_PINYIN_LEN:
                    missing_from_audio.append(''.join(db_chunk))
                if tr_pl > db_pl and (tr_pl - db_pl) >= MIN_GAP_PINYIN_LEN:
                    extra_in_audio.append(''.join(tr_chunk))

    return {
        "missing_from_audio": missing_from_audio,
        "extra_in_audio": extra_in_audio,
        "similarity": similarity,
    }


def add_punctuation_context(gap_text: str, full_text: str) -> str:
    """在原文中找到差异块的位置，补上前后标点使其可读（限制上下文范围）"""
    clean_full = strip_all(full_text)
    search_key = gap_text[:min(20, len(gap_text))]
    idx = clean_full.find(search_key)
    if idx < 0:
        return gap_text

    # 在原文中找到对应位置
    orig_idx = 0
    char_count = 0
    for i, ch in enumerate(full_text):
        if re.match(r'[\u4e00-\u9fff\w]', ch):
            if char_count == idx:
                orig_idx = i
                break
            char_count += 1

    # 向后找到 gap 结束位置
    end_count = 0
    end_idx = orig_idx
    target_len = len(gap_text)
    for i in range(orig_idx, len(full_text)):
        ch = full_text[i]
        if re.match(r'[\u4e00-\u9fff\w]', ch):
            end_count += 1
            if end_count >= target_len:
                end_idx = i + 1
                break

    # 扩展到最近的句尾（最多扩展 30 字符）
    max_extend = 30
    ext = 0
    while end_idx < len(full_text) and full_text[end_idx] not in '。！？…\n' and ext < max_extend:
        end_idx += 1
        ext += 1
    if end_idx < len(full_text) and full_text[end_idx] in '。！？…':
        end_idx += 1

    # 扩展到最近的句首（最多回溯 30 字符）
    start_idx = orig_idx
    ext = 0
    while start_idx > 0 and full_text[start_idx - 1] not in '。！？…\n' and ext < max_extend:
        start_idx -= 1
        ext += 1

    return full_text[start_idx:end_idx].strip()


def analyze_day(db_text: str, transcription: dict) -> dict:
    """分析一天的差异"""
    cleaned_db = clean_db_text(db_text)
    tr_text = transcription["text"].replace('\n', '')

    gaps = find_content_gaps(cleaned_db, tr_text)

    # 给缺失内容加上标点上下文
    db_flat = strip_all(cleaned_db)
    tr_flat = strip_all(tr_text)

    missing_readable = []
    for m in gaps["missing_from_audio"]:
        readable = add_punctuation_context(m, cleaned_db)
        missing_readable.append(readable)

    extra_readable = []
    for e in gaps["extra_in_audio"]:
        # 验证：如果"多余"内容在 DB 中也能找到大部分，则是对齐误报，跳过
        overlap = difflib.SequenceMatcher(None, e, db_flat).ratio()
        if overlap > 0.5:
            continue
        readable = add_punctuation_context(e, tr_text)
        extra_readable.append(readable)

    return {
        "similarity": gaps["similarity"],
        "missing_from_audio": missing_readable,
        "extra_in_audio": extra_readable,
        "missing_raw": gaps["missing_from_audio"],
        "extra_raw": gaps["extra_in_audio"],
    }


# ============================================================
# 主流程
# ============================================================
def main():
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

    all_issues = {}
    total_missing = 0
    total_extra = 0
    total_days_with_issues = 0

    for system_key, info in COURSES.items():
        print(f"\n分析: {info['title']}...")
        course_data = fetch_course_data(system_key)
        course_cache_dir = CACHE_PATH / system_key

        day_issues = []
        for item in course_data:
            day = item["sequence_number"]
            cache_file = course_cache_dir / f"day_{day}.json"
            if not cache_file.exists():
                continue

            with open(cache_file, "r", encoding="utf-8") as f:
                tr = json.load(f)

            analysis = analyze_day(item["meditation_guide"], tr)
            has_issues = len(analysis["missing_from_audio"]) > 0 or len(analysis["extra_in_audio"]) > 0

            if has_issues:
                total_days_with_issues += 1
                total_missing += len(analysis["missing_from_audio"])
                total_extra += len(analysis["extra_in_audio"])

            day_issues.append({
                "day": day,
                "title": item["title"],
                "content_id": item["content_id"],
                "analysis": analysis,
                "has_issues": has_issues,
            })

        all_issues[system_key] = day_issues

    # 生成报告
    html = generate_html_report(all_issues, total_missing, total_extra, total_days_with_issues)
    html_file = OUTPUT_PATH / "missing_sentences_report.html"
    html_file.write_text(html, encoding="utf-8")
    print(f"\nHTML 报告: {html_file}")
    print(f"汇总: {total_days_with_issues} 天有问题, {total_missing} 处缺失, {total_extra} 处多余")


def generate_html_report(all_issues, total_missing, total_extra, total_days_with_issues):
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    total_days = sum(len(v) for v in all_issues.values())
    ok_days = total_days - total_days_with_issues

    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>缺失内容分析报告</title>
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: -apple-system, "Microsoft YaHei", sans-serif; background:#1a1a2e; color:#e0e0e0; padding:20px; max-width:1200px; margin:0 auto; }}
h1 {{ text-align:center; color:#fff; margin:20px 0; }}
.subtitle {{ text-align:center; color:#888; margin-bottom:20px; }}
.summary {{ background:#ffffff0a; border-radius:12px; padding:20px; margin:20px 0; display:flex; gap:30px; justify-content:center; flex-wrap:wrap; }}
.stat {{ text-align:center; }}
.stat .num {{ font-size:2em; font-weight:bold; }}
.stat .label {{ color:#888; font-size:0.85em; }}
.stat.warn .num {{ color:#f97316; }}
.stat.ok .num {{ color:#22c55e; }}
.stat.info .num {{ color:#3b82f6; }}
h2 {{ color:#a78bfa; margin:30px 0 15px; padding:10px; border-bottom:2px solid #a78bfa33; }}
.day-card {{ background:#ffffff08; border-radius:8px; margin:8px 0; }}
.day-header {{ display:flex; align-items:center; gap:12px; padding:12px 16px; cursor:pointer; }}
.day-header:hover {{ background:#ffffff10; }}
.day-num {{ font-weight:bold; color:#a78bfa; min-width:60px; }}
.day-title {{ flex:1; color:#ccc; }}
.badge {{ padding:3px 10px; border-radius:12px; color:#fff; font-size:0.8em; font-weight:bold; white-space:nowrap; }}
.badge-missing {{ background:#ef4444; }}
.badge-extra {{ background:#3b82f6; }}
.badge-ok {{ background:#22c55e; }}
.sim {{ color:#888; font-size:0.85em; margin-right:8px; }}
.day-body {{ display:none; padding:16px; border-top:1px solid #ffffff10; }}
.day-card.open .day-body {{ display:block; }}
.section-title {{ font-weight:bold; margin:12px 0 6px; }}
.section-title.missing {{ color:#ef4444; }}
.section-title.extra {{ color:#3b82f6; }}
.gap-item {{ padding:8px 12px; margin:4px 0; background:#ffffff08; border-radius:4px; line-height:1.8; font-size:0.92em; }}
.gap-item.missing {{ border-left:3px solid #ef4444; }}
.gap-item.extra {{ border-left:3px solid #3b82f6; }}
.expand-icon {{ color:#666; transition:transform 0.2s; }}
.day-card.open .expand-icon {{ transform:rotate(180deg); }}
.gen-time {{ text-align:center; color:#666; margin:20px 0; font-size:0.85em; }}
.content-id {{ color:#555; font-size:0.75em; font-family:monospace; }}
</style>
</head>
<body>
<h1>缺失内容分析报告</h1>
<p class="subtitle">基于全文拼音对比 · 同音字视为一致 · 标点/用词微调忽略 · 仅显示>=5字的内容差异</p>
<div class="summary">
  <div class="stat ok"><div class="num">{ok_days}</div><div class="label">天OK</div></div>
  <div class="stat warn"><div class="num">{total_days_with_issues}</div><div class="label">天有问题</div></div>
  <div class="stat warn"><div class="num">{total_missing}</div><div class="label">处音频缺失</div></div>
  <div class="stat info"><div class="num">{total_extra}</div><div class="label">处音频多余</div></div>
</div>
"""

    for system_key, day_issues in all_issues.items():
        info = COURSES[system_key]
        issue_days = [d for d in day_issues if d["has_issues"]]
        ok_count = len(day_issues) - len(issue_days)

        html += f'<h2>{info["title"]}（{len(issue_days)} 天需处理 / {ok_count} 天OK）</h2>\n'

        for d in day_issues:
            a = d["analysis"]
            mc = len(a["missing_from_audio"])
            ec = len(a["extra_in_audio"])
            sim_pct = f'{a["similarity"]:.0%}'

            if not d["has_issues"]:
                html += (
                    f'<div class="day-card">'
                    f'<div class="day-header">'
                    f'<span class="day-num">Day {d["day"]}</span>'
                    f'<span class="day-title">{d["title"]}</span>'
                    f'<span class="sim">{sim_pct}</span>'
                    f'<span class="badge badge-ok">OK</span>'
                    f'</div></div>\n'
                )
                continue

            badges = ""
            if mc:
                badges += f'<span class="badge badge-missing">缺失 {mc} 处</span> '
            if ec:
                badges += f'<span class="badge badge-extra">多余 {ec} 处</span> '

            html += f'<div class="day-card">'
            html += (
                f'<div class="day-header" onclick="this.parentElement.classList.toggle(\'open\')">'
                f'<span class="day-num">Day {d["day"]}</span>'
                f'<span class="day-title">{d["title"]}</span>'
                f'<span class="sim">{sim_pct}</span>'
                f'{badges}'
                f'<span class="expand-icon">▼</span>'
                f'</div>'
            )
            html += f'<div class="day-body">'
            html += f'<span class="content-id">{d["content_id"]}</span>'

            if mc:
                html += f'<div class="section-title missing">音频缺失（{mc} 处，需补录）：</div>'
                for s in a["missing_from_audio"]:
                    esc = s.replace('&', '&amp;').replace('<', '&lt;')
                    html += f'<div class="gap-item missing">{esc}</div>'

            if ec:
                html += f'<div class="section-title extra">音频多余（{ec} 处，文本未收录）：</div>'
                for s in a["extra_in_audio"]:
                    esc = s.replace('&', '&amp;').replace('<', '&lt;')
                    html += f'<div class="gap-item extra">{esc}</div>'

            html += '</div></div>\n'

    html += f'<div class="gen-time">报告生成时间: {now_str}</div>\n'
    html += """<script>
document.querySelectorAll('.badge-missing,.badge-extra').forEach(b => {
  b.closest('.day-card')?.classList.add('open');
});
</script></body></html>"""
    return html


if __name__ == "__main__":
    main()
