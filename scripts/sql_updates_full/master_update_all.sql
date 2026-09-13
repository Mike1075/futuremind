-- ============================================================
-- 伊卡洛斯计划 - 完整内容更新主脚本
-- Icarus Full Content Update Master Script
-- ============================================================
-- 总项目数: 11
-- 总周数: 92
-- 总活动数: 202
-- ============================================================

-- 说明：
-- 此文件包含所有11个项目的UPDATE语句
-- 由于文件较大，建议分批执行：
-- 方法1: 在Supabase Dashboard SQL Editor中逐个执行单独的SQL文件
-- 方法2: 使用本master脚本一次性执行所有更新（需要足够的内存）


-- 执行项目 1: 第一阶段：宠物侦探
\i scripts/sql_updates_full/update_project_01_第一阶段_宠物侦探.sql

-- 执行项目 2: 第二阶段：杰提计划
\i scripts/sql_updates_full/update_project_02_第二阶段_杰提计划.sql

-- 执行项目 3: 第三阶段：贝尔不等式与生命系统
\i scripts/sql_updates_full/update_project_03_第三阶段_贝尔不等式与生命系统.sql

-- 执行项目 4: 第一阶段：植物的悄悄话
\i scripts/sql_updates_full/update_project_04_第一阶段_植物的悄悄话.sql

-- 执行项目 5: 第二阶段：远程蚁巢
\i scripts/sql_updates_full/update_project_05_第二阶段_远程蚁巢.sql

-- 执行项目 6: 第三阶段：记忆的水实验
\i scripts/sql_updates_full/update_project_06_第三阶段_记忆的水实验.sql

-- 执行项目 7: 第四阶段：意识地理学
\i scripts/sql_updates_full/update_project_07_第四阶段_意识地理学.sql

-- 执行项目 8: 第一阶段：情绪的颜色
\i scripts/sql_updates_full/update_project_08_第一阶段_情绪的颜色.sql

-- 执行项目 9: 第二阶段：跨越距离的凝视
\i scripts/sql_updates_full/update_project_09_第二阶段_跨越距离的凝视.sql

-- 执行项目 10: 第三阶段：意念撼动概率
\i scripts/sql_updates_full/update_project_10_第三阶段_意念撼动概率.sql

-- 执行项目 11: 第四阶段：幻肢与纠缠
\i scripts/sql_updates_full/update_project_11_第四阶段_幻肢与纠缠.sql

-- ============================================================
-- 完整验证查询
-- ============================================================
SELECT
  sequence_number,
  title,
  jsonb_array_length(week_plan) as weeks_count,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(week_plan) w,
         jsonb_array_elements(w->'activities') a
  ) as activities_count
FROM course_contents
WHERE system_id = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid
ORDER BY sequence_number;
