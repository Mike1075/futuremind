"""
冥想音频-文本自动对照审核系统
用法: python main.py [--skip-download] [--skip-transcribe] [--course dependency_freedom]
"""

import os
import re
import json
import sys
import time
import difflib
import argparse
from pathlib import Path
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import URLError
import ssl

# 脚本根目录
SCRIPT_DIR = Path(__file__).parent

# ============================================================
# 配置
# ============================================================
from config import (
    SUPABASE_URL, SUPABASE_ANON_KEY, COURSES,
    WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE,
    THRESHOLD_MATCH, THRESHOLD_MINOR, THRESHOLD_MAJOR,
    AUDIO_DIR, CACHE_DIR, OUTPUT_DIR,
)

AUDIO_PATH = SCRIPT_DIR / AUDIO_DIR
CACHE_PATH = SCRIPT_DIR / CACHE_DIR
OUTPUT_PATH = SCRIPT_DIR / OUTPUT_DIR

# SSL 上下文（兼容 Windows）
SSL_CTX = ssl.create_default_context()


def http_get(url: str, headers: dict = None, retries: int = 3) -> bytes:
    """带重试的 HTTP GET"""
    for attempt in range(retries):
        try:
            req = Request(url, headers=headers or {})
            with urlopen(req, context=SSL_CTX, timeout=30) as resp:
                return resp.read()
        except (URLError, ssl.SSLError, TimeoutError) as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise


# ============================================================
# 1. 从 Supabase 获取数据（批量查询）
# ============================================================
def fetch_course_data(system_key: str) -> list[dict]:
    """获取指定课程的所有内容及音频 URL（两次查询，不逐条）"""
    info = COURSES[system_key]
    system_id = info["system_id"]
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    # 查询 course_contents
    url = (
        f"{SUPABASE_URL}/rest/v1/course_contents"
        f"?system_id=eq.{system_id}"
        f"&select=id,sequence_number,title,meditation_guide"
        f"&order=sequence_number.asc"
    )
    data = http_get(url, headers)
    contents = json.loads(data.decode())

    # 批量查询所有音频资源（用 course_content_id.in_ 过滤）
    content_ids = [c["id"] for c in contents]
    ids_param = ",".join(content_ids)
    mr_url = (
        f"{SUPABASE_URL}/rest/v1/media_resources"
        f"?course_content_id=in.({ids_param})"
        f"&resource_type=eq.audio"
        f"&select=course_content_id,file_url"
        f"&order=file_url.desc"
    )
    mr_data = http_get(mr_url, headers)
    all_audios = json.loads(mr_data.decode())

    # 建立 content_id -> audio_url 映射（每天取第一个）
    audio_map = {}
    for a in all_audios:
        cid = a["course_content_id"]
        if cid not in audio_map:
            audio_map[cid] = a["file_url"]

    results = []
    for content in contents:
        results.append({
            "content_id": content["id"],
            "sequence_number": content["sequence_number"],
            "title": content["title"],
            "meditation_guide": content["meditation_guide"] or "",
            "audio_url": audio_map.get(content["id"]),
        })

    return results


# ============================================================
# 2. 下载音频
# ============================================================
def download_audio(course_data: list[dict], system_key: str) -> None:
    """下载音频文件到本地"""
    course_dir = AUDIO_PATH / system_key
    course_dir.mkdir(parents=True, exist_ok=True)

    for item in course_data:
        if not item["audio_url"]:
            print(f"  [跳过] Day {item['sequence_number']}: 无音频 URL")
            continue

        filename = f"day_{item['sequence_number']}.mp3"
        filepath = course_dir / filename

        if filepath.exists():
            continue

        print(f"  下载 Day {item['sequence_number']}: {item['title']}...")
        try:
            data = http_get(item["audio_url"])
            filepath.write_bytes(data)
        except Exception as e:
            print(f"  [错误] Day {item['sequence_number']}: {e}")


# ============================================================
# 3. 语音转文字 (faster-whisper)
# ============================================================
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print(f"加载 Whisper 模型: {WHISPER_MODEL} ({WHISPER_DEVICE}, {WHISPER_COMPUTE_TYPE})...")
        _whisper_model = WhisperModel(
            WHISPER_MODEL,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
        )
        print("模型加载完成")
    return _whisper_model


def transcribe_audio(filepath: Path, cache_file: Path) -> dict:
    """转录单个音频文件，返回 {text, segments}"""
    if cache_file.exists():
        with open(cache_file, "r", encoding="utf-8") as f:
            return json.load(f)

    model = get_whisper_model()
    segments_iter, info = model.transcribe(
        str(filepath),
        language="zh",
        vad_filter=True,
        vad_parameters=dict(
            min_silence_duration_ms=500,
        ),
        beam_size=5,
        word_timestamps=False,
    )

    segments = []
    full_text_parts = []
    for seg in segments_iter:
        segments.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
        full_text_parts.append(seg.text.strip())

    result = {
        "text": "\n".join(full_text_parts),
        "segments": segments,
        "duration": round(info.duration, 1),
    }

    cache_file.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return result


def transcribe_course(course_data: list[dict], system_key: str) -> dict[int, dict]:
    """转录整个课程的音频，返回 {day: transcription}"""
    course_audio_dir = AUDIO_PATH / system_key
    course_cache_dir = CACHE_PATH / system_key
    course_cache_dir.mkdir(parents=True, exist_ok=True)

    transcriptions = {}
    total = len(course_data)

    for i, item in enumerate(course_data):
        day = item["sequence_number"]
        audio_file = course_audio_dir / f"day_{day}.mp3"
        cache_file = course_cache_dir / f"day_{day}.json"

        if not audio_file.exists():
            print(f"  [{i+1}/{total}] Day {day}: 音频文件不存在，跳过")
            continue

        cached = cache_file.exists()
        if not cached:
            print(f"  [{i+1}/{total}] Day {day}: 转录中...", end="", flush=True)

        t0 = time.time()
        transcriptions[day] = transcribe_audio(audio_file, cache_file)
        elapsed = time.time() - t0

        if not cached:
            print(f" ({elapsed:.1f}s)")

    return transcriptions


# ============================================================
# 4. 文本清理与对比
# ============================================================

# 需要从数据库文本中去除的非朗读标记
DB_CLEANUP_PATTERNS = [
    # 部分标题（如"第二部分：冥想练习与引导"）
    r'第[一二三四五六七八九十]+部分[：:][^\n]*\n*',
    # 冥想主题标题行（含【深度冥想：xxx】等变体）
    r'\*{0,2}【[^】]*】\*{0,2}\s*',
    # 准备阶段标题及内容（到引导语标题或双换行）
    r'\*{0,2}准备阶段[：:]\*{0,2}.*?(?=\*{0,2}引导语|\n\n)',
    # 引导语标题
    r'\*{0,2}引导语[：:]\*{0,2}\s*',
    # 建议时长
    r'（建议时长[^）]*）\s*',
    # 括号内的舞台指示
    r'（语[速调].*?）\s*',
    r'（[^）]*?语[速调][^）]*?）\s*',
    # 静默指示
    r'（静默\d*.*?）\s*',
    r'（长时间的?静默\d*.*?）\s*',
    r'（静默片刻）\s*',
    r'（停顿\d*.*?）\s*',
    r'（长停顿.*?）\s*',
    # 其他舞台指示
    r'（[^）]*?营造[^）]*?）\s*',
    r'（[^）]*?声音[^）]*?）\s*',
    # Markdown 加粗
    r'\*{2}',
]

def clean_db_text(text: str) -> str:
    """清理数据库文本，去除非朗读标记"""
    if not text:
        return ""

    cleaned = text
    for pattern in DB_CLEANUP_PATTERNS:
        cleaned = re.sub(pattern, '', cleaned, flags=re.DOTALL)

    # 统一引号
    cleaned = cleaned.replace('\\"', '"')
    cleaned = cleaned.replace('\u201c', '"').replace('\u201d', '"')
    cleaned = cleaned.replace('\u2018', "'").replace('\u2019', "'")

    # 去除多余空行
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    cleaned = '\n'.join(line.strip() for line in cleaned.split('\n'))
    return cleaned.strip()


def clean_transcribed_text(text: str) -> str:
    """清理转录文本"""
    if not text:
        return ""
    cleaned = text
    cleaned = cleaned.replace('\u201c', '"').replace('\u201d', '"')
    cleaned = cleaned.replace('\u2018', "'").replace('\u2019', "'")
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    cleaned = '\n'.join(line.strip() for line in cleaned.split('\n'))
    return cleaned.strip()


def flatten_text(text: str) -> str:
    """将文本展平为连续字符串（用于整体比较）"""
    # 把所有空白（换行、多余空格）压缩为单个空格
    return re.sub(r'\s+', '', text)


def compute_similarity(a: str, b: str) -> float:
    """计算两段文本的相似度 (0~1)"""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def classify_similarity(sim: float) -> str:
    if sim >= THRESHOLD_MATCH:
        return "match"
    elif sim >= THRESHOLD_MINOR:
        return "minor_diff"
    elif sim >= THRESHOLD_MAJOR:
        return "major_diff"
    else:
        return "mismatch"


def compare_day(db_text: str, transcription: dict) -> dict:
    """对比一天的数据库文本和转录文本（全文对比）"""
    cleaned_db = clean_db_text(db_text)
    cleaned_tr = clean_transcribed_text(transcription["text"])

    # 展平后比较（去除空白差异影响）
    flat_db = flatten_text(cleaned_db)
    flat_tr = flatten_text(cleaned_tr)
    overall_sim = compute_similarity(flat_db, flat_tr)

    return {
        "overall_similarity": overall_sim,
        "overall_status": classify_similarity(overall_sim),
        "cleaned_db_text": cleaned_db,
        "cleaned_tr_text": cleaned_tr,
        "flat_db": flat_db,
        "flat_tr": flat_tr,
        "duration": transcription.get("duration", 0),
    }


# ============================================================
# 5. 生成 HTML 报告
# ============================================================

def generate_diff_html(text_a: str, text_b: str) -> tuple[str, str]:
    """对两段展平文本生成带颜色标注的差异 HTML"""
    if not text_a and not text_b:
        return "", ""

    sm = difflib.SequenceMatcher(None, text_a, text_b)
    html_a_parts = []
    html_b_parts = []

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        chunk_a = text_a[i1:i2].replace('&', '&amp;').replace('<', '&lt;')
        chunk_b = text_b[j1:j2].replace('&', '&amp;').replace('<', '&lt;')

        if tag == 'equal':
            html_a_parts.append(chunk_a)
            html_b_parts.append(chunk_b)
        elif tag == 'delete':
            html_a_parts.append(f'<span class="diff-delete">{chunk_a}</span>')
        elif tag == 'insert':
            html_b_parts.append(f'<span class="diff-insert">{chunk_b}</span>')
        elif tag == 'replace':
            html_a_parts.append(f'<span class="diff-replace">{chunk_a}</span>')
            html_b_parts.append(f'<span class="diff-replace-tr">{chunk_b}</span>')

    return ''.join(html_a_parts), ''.join(html_b_parts)


def insert_line_breaks(html: str, interval: int = 40) -> str:
    """在纯文本中每隔 N 个可见字符插入 <wbr> 以便换行"""
    result = []
    visible_count = 0
    in_tag = False
    for ch in html:
        if ch == '<':
            in_tag = True
        elif ch == '>':
            in_tag = False
            result.append(ch)
            continue
        if not in_tag:
            visible_count += 1
            if visible_count >= interval and ch in '，。！？；、,.:;!? ':
                result.append(ch)
                result.append('<br>')
                visible_count = 0
                continue
        result.append(ch)
    return ''.join(result)


def status_color(status: str) -> str:
    return {
        "match": "#22c55e",
        "minor_diff": "#eab308",
        "major_diff": "#f97316",
        "mismatch": "#ef4444",
    }.get(status, "#888")


def status_label(status: str) -> str:
    return {
        "match": "匹配",
        "minor_diff": "小差异",
        "major_diff": "大差异",
        "mismatch": "不匹配",
    }.get(status, status)


def generate_html_report(all_results: dict[str, list[dict]]) -> str:
    """生成完整 HTML 报告"""

    # 统计汇总
    summary_rows = []
    for system_key, days in all_results.items():
        info = COURSES[system_key]
        counts = {"match": 0, "minor_diff": 0, "major_diff": 0, "mismatch": 0, "no_audio": 0}
        for d in days:
            if d.get("no_audio"):
                counts["no_audio"] += 1
            else:
                s = d["comparison"]["overall_status"]
                counts[s] = counts.get(s, 0) + 1
        summary_rows.append((info["title"], info["month"], counts, len(days)))

    # 生成 HTML
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    html_parts = [HTML_HEAD]

    # 汇总面板
    html_parts.append('<div class="summary">')
    html_parts.append('<h2>汇总</h2>')
    html_parts.append('<table class="summary-table"><tr>'
                      '<th>课程</th><th>总天数</th>'
                      '<th style="color:#22c55e">匹配</th>'
                      '<th style="color:#eab308">小差异</th>'
                      '<th style="color:#f97316">大差异</th>'
                      '<th style="color:#ef4444">不匹配</th>'
                      '<th style="color:#888">无音频</th></tr>')
    for title, month, counts, total in summary_rows:
        html_parts.append(
            f'<tr><td>{title}</td><td>{total}</td>'
            f'<td>{counts["match"]}</td>'
            f'<td>{counts["minor_diff"]}</td>'
            f'<td>{counts["major_diff"]}</td>'
            f'<td>{counts["mismatch"]}</td>'
            f'<td>{counts["no_audio"]}</td></tr>'
        )
    html_parts.append('</table>')
    html_parts.append('<div class="legend">'
                      '<span><span class="swatch" style="background:#ef444440;color:#fca5a5">删除线</span> 文本有但音频没读</span>'
                      '<span><span class="swatch" style="background:#3b82f640;color:#93c5fd">蓝色</span> 音频有但文本缺失</span>'
                      '<span><span class="swatch" style="background:#f9731640;color:#fdba74">橙色</span> 用词差异（文本侧）</span>'
                      '<span><span class="swatch" style="background:#eab30840;color:#fde047">黄色</span> 用词差异（音频侧）</span>'
                      '</div>')
    html_parts.append('</div>')

    # 每个课程的详细结果
    for system_key, days in all_results.items():
        info = COURSES[system_key]
        html_parts.append(f'<h2 class="course-title">{info["title"]}</h2>')

        for d in days:
            day_num = d["sequence_number"]
            title = d["title"]

            if d.get("no_audio"):
                html_parts.append(
                    f'<div class="day-card" data-status="no_audio">'
                    f'<div class="day-header" onclick="toggle(this)">'
                    f'<span class="day-num">Day {day_num}</span>'
                    f'<span class="day-title">{title}</span>'
                    f'<span class="badge" style="background:#888">无音频</span>'
                    f'</div></div>'
                )
                continue

            comp = d["comparison"]
            sim = comp["overall_similarity"]
            status = comp["overall_status"]
            color = status_color(status)
            label = status_label(status)
            duration = comp.get("duration", 0)
            dur_str = f"{int(duration//60)}:{int(duration%60):02d}" if duration else "?"

            # 生成差异 HTML
            db_diff_html, tr_diff_html = generate_diff_html(comp["flat_db"], comp["flat_tr"])
            db_diff_html = insert_line_breaks(db_diff_html)
            tr_diff_html = insert_line_breaks(tr_diff_html)

            html_parts.append(
                f'<div class="day-card" data-status="{status}">'
                f'<div class="day-header" onclick="toggle(this)">'
                f'<span class="day-num">Day {day_num}</span>'
                f'<span class="day-title">{title}</span>'
                f'<span class="day-meta">时长 {dur_str}</span>'
                f'<span class="badge" style="background:{color}">{label} {sim:.0%}</span>'
                f'<span class="expand-icon">▼</span>'
                f'</div>'
                f'<div class="day-body">'
                f'<div class="diff-container">'
                f'<div class="diff-col"><div class="diff-label">数据库文本</div><div class="diff-content">{db_diff_html}</div></div>'
                f'<div class="diff-col"><div class="diff-label">音频转录</div><div class="diff-content">{tr_diff_html}</div></div>'
                f'</div>'
                f'</div>'
                f'</div>'
            )

    html_parts.append(f'<div class="gen-time">报告生成时间: {now_str}</div>')
    html_parts.append(HTML_FOOT)
    return '\n'.join(html_parts)


HTML_HEAD = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>冥想音频-文本对照报告</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: -apple-system, "Microsoft YaHei", sans-serif; background:#1a1a2e; color:#e0e0e0; padding:20px; max-width:1400px; margin:0 auto; }
h1 { text-align:center; color:#fff; margin:20px 0; font-size:1.8em; }
h2.course-title { color:#a78bfa; margin:30px 0 15px; padding:10px; border-bottom:2px solid #a78bfa33; }
.summary { background:#ffffff0a; border-radius:12px; padding:20px; margin:20px 0; }
.summary h2 { color:#a78bfa; margin-bottom:15px; }
.summary-table { width:100%; border-collapse:collapse; margin-bottom:15px; }
.summary-table th, .summary-table td { padding:8px 12px; text-align:center; border-bottom:1px solid #ffffff15; }
.summary-table th { color:#a78bfa; }
.legend { display:flex; gap:20px; flex-wrap:wrap; justify-content:center; padding:10px; }
.legend span { display:flex; align-items:center; gap:6px; font-size:0.85em; color:#aaa; }
.swatch { padding:2px 8px; border-radius:3px; font-size:0.85em; }
.day-card { background:#ffffff08; border-radius:8px; margin:8px 0; overflow:hidden; }
.day-header { display:flex; align-items:center; gap:12px; padding:12px 16px; cursor:pointer; user-select:none; }
.day-header:hover { background:#ffffff10; }
.day-num { font-weight:bold; color:#a78bfa; min-width:60px; }
.day-title { flex:1; color:#ccc; }
.day-meta { color:#888; font-size:0.85em; }
.badge { padding:3px 10px; border-radius:12px; color:#fff; font-size:0.8em; font-weight:bold; white-space:nowrap; }
.expand-icon { color:#666; transition:transform 0.2s; }
.day-card.open .expand-icon { transform:rotate(180deg); }
.day-body { display:none; padding:16px; border-top:1px solid #ffffff10; }
.day-card.open .day-body { display:block; }
.diff-container { display:flex; gap:12px; }
.diff-col { flex:1; min-width:0; }
.diff-label { font-weight:bold; color:#a78bfa; text-align:center; padding:8px; font-size:0.9em; }
.diff-content { background:#ffffff08; border-radius:6px; padding:12px; line-height:2; font-size:0.88em; word-break:break-all; max-height:600px; overflow-y:auto; }
.diff-delete { background:#ef444440; color:#fca5a5; text-decoration:line-through; padding:1px 2px; border-radius:2px; }
.diff-insert { background:#3b82f640; color:#93c5fd; padding:1px 2px; border-radius:2px; }
.diff-replace { background:#f9731640; color:#fdba74; padding:1px 2px; border-radius:2px; }
.diff-replace-tr { background:#eab30840; color:#fde047; padding:1px 2px; border-radius:2px; }
.filter-bar { text-align:center; margin:15px 0; }
.filter-btn { background:#ffffff15; border:1px solid #ffffff20; color:#ccc; padding:6px 16px; margin:0 4px; border-radius:20px; cursor:pointer; font-size:0.9em; }
.filter-btn:hover, .filter-btn.active { background:#a78bfa40; color:#fff; border-color:#a78bfa; }
.gen-time { text-align:center; color:#666; margin:20px 0; font-size:0.85em; }
@media (max-width:768px) {
  .diff-container { flex-direction:column; }
}
</style>
</head>
<body>
<h1>冥想音频-文本对照审核报告</h1>
<div class="filter-bar">
  <button class="filter-btn active" onclick="filterDays('all')">全部</button>
  <button class="filter-btn" onclick="filterDays('match')">匹配</button>
  <button class="filter-btn" onclick="filterDays('minor_diff')">小差异</button>
  <button class="filter-btn" onclick="filterDays('major_diff')">大差异</button>
  <button class="filter-btn" onclick="filterDays('mismatch')">不匹配</button>
</div>
"""

HTML_FOOT = """
<script>
function toggle(header) {
  header.parentElement.classList.toggle('open');
}
function filterDays(status) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.day-card').forEach(card => {
    if (status === 'all') { card.style.display = ''; return; }
    card.style.display = card.dataset.status === status ? '' : 'none';
  });
}
</script>
</body>
</html>
"""


# ============================================================
# 主流程
# ============================================================
def main():
    parser = argparse.ArgumentParser(description="冥想音频-文本对照审核")
    parser.add_argument("--skip-download", action="store_true", help="跳过下载步骤")
    parser.add_argument("--skip-transcribe", action="store_true", help="跳过转录步骤（使用缓存）")
    parser.add_argument("--course", type=str, default=None,
                        help="只处理指定课程 (dependency_freedom|desire_flame|wisdom_awakening|energy_alchemy)")
    parser.add_argument("--output", type=str, default=None, help="输出文件名")
    args = parser.parse_args()

    # 确定要处理的课程
    if args.course:
        if args.course not in COURSES:
            print(f"错误: 未知课程 '{args.course}'")
            print(f"可选: {', '.join(COURSES.keys())}")
            sys.exit(1)
        course_keys = [args.course]
    else:
        course_keys = list(COURSES.keys())

    all_results = {}

    for system_key in course_keys:
        info = COURSES[system_key]
        print(f"\n{'='*60}")
        print(f"处理课程: {info['title']}")
        print(f"{'='*60}")

        # Step 1: 获取数据
        print("\n[1/4] 获取课程数据...")
        course_data = fetch_course_data(system_key)
        print(f"  获取到 {len(course_data)} 天的内容")

        no_guide = sum(1 for d in course_data if not d["meditation_guide"])
        no_audio = sum(1 for d in course_data if not d["audio_url"])
        if no_guide:
            print(f"  ! {no_guide} 天无冥想引导词文本")
        if no_audio:
            print(f"  ! {no_audio} 天无音频 URL")

        # Step 2: 下载音频
        if not args.skip_download:
            print("\n[2/4] 下载音频文件...")
            download_audio(course_data, system_key)
            print("  下载完成")
        else:
            print("\n[2/4] 跳过下载")

        # Step 3: 转录
        if not args.skip_transcribe:
            print("\n[3/4] 转录音频...")
            transcriptions = transcribe_course(course_data, system_key)
            print(f"  转录完成: {len(transcriptions)} 天")
        else:
            print("\n[3/4] 使用缓存转录结果...")
            transcriptions = {}
            course_cache_dir = CACHE_PATH / system_key
            for item in course_data:
                day = item["sequence_number"]
                cache_file = course_cache_dir / f"day_{day}.json"
                if cache_file.exists():
                    with open(cache_file, "r", encoding="utf-8") as f:
                        transcriptions[day] = json.load(f)
            print(f"  加载了 {len(transcriptions)} 天的缓存")

        # Step 4: 对比
        print("\n[4/4] 对比文本...")
        day_results = []
        for item in course_data:
            day = item["sequence_number"]
            result = {
                "sequence_number": day,
                "title": item["title"],
                "content_id": item["content_id"],
            }

            if day not in transcriptions:
                result["no_audio"] = True
            else:
                result["comparison"] = compare_day(
                    item["meditation_guide"],
                    transcriptions[day],
                )

            day_results.append(result)

        all_results[system_key] = day_results

        # 统计
        has_comp = [d for d in day_results if not d.get("no_audio")]
        match_count = sum(1 for d in has_comp if d["comparison"]["overall_status"] == "match")
        minor_count = sum(1 for d in has_comp if d["comparison"]["overall_status"] == "minor_diff")
        major_count = sum(1 for d in has_comp if d["comparison"]["overall_status"] == "major_diff")
        mismatch_count = sum(1 for d in has_comp if d["comparison"]["overall_status"] == "mismatch")
        print(f"  结果: 匹配={match_count} 小差异={minor_count} 大差异={major_count} 不匹配={mismatch_count}")

    # 生成报告
    print(f"\n{'='*60}")
    print("生成 HTML 报告...")
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

    output_name = args.output or f"audit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    if not output_name.endswith('.html'):
        output_name += '.html'
    output_file = OUTPUT_PATH / output_name

    html = generate_html_report(all_results)
    output_file.write_text(html, encoding="utf-8")
    print(f"报告已保存: {output_file}")
    print(f"\n用浏览器打开查看: file:///{output_file.resolve()}")


if __name__ == "__main__":
    main()
