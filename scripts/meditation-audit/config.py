"""冥想音频-文本对照审核系统 - 配置"""

SUPABASE_URL = "https://lvjezsnwesyblnlkkirz.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzQyOTUsImV4cCI6MjA3MjAxMDI5NX0.sxXXFRlGutfdhYU0r-1o8Osf98JJgii9hPdFyFWlHgU"

# 课程系统 ID 映射
COURSES = {
    "dependency_freedom": {
        "system_id": "157403fe-d7c7-4f56-a106-2e23dfa5029e",
        "title": "3月：无惧：直面恐惧",
        "month": 3,
        "days": 31,
    },
    "desire_flame": {
        "system_id": "0787feff-b91e-41ac-94d0-bbd961926928",
        "title": "4月：热情：转化欲望",
        "month": 4,
        "days": 30,
    },
    "wisdom_awakening": {
        "system_id": "bfc1d431-b9fb-4065-8433-c0d7a5fe3f1c",
        "title": "5月：智慧：智力升华",
        "month": 5,
        "days": 31,
    },
    "energy_alchemy": {
        "system_id": "411526c1-1912-4891-ac21-3e27f2448b95",
        "title": "6月：放下：驾驭能量",
        "month": 6,
        "days": 30,
    },
}

# Whisper 模型配置
WHISPER_MODEL = "large-v3"
WHISPER_DEVICE = "cuda"
WHISPER_COMPUTE_TYPE = "float16"

# 相似度分级阈值
THRESHOLD_MATCH = 0.95      # >= 匹配
THRESHOLD_MINOR = 0.80      # >= 小差异
THRESHOLD_MAJOR = 0.60      # >= 大差异
# < 0.60 = 不匹配

# 目录
AUDIO_DIR = "audio"
CACHE_DIR = "cache"
OUTPUT_DIR = "output"
