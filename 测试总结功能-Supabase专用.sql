-- ===========================================
-- 用户总结功能测试 - Supabase SQL Editor 专用
-- Edge Function: summarize-user-activity
-- AI模型: GPT-5 Mini
-- ===========================================

-- 第一步：查找有数据的测试用户
-- 执行以下查询，找到一个有对话/作业数据的用户

SELECT
  p.id as user_id,
  p.full_name,
  p.email,
  -- 统计对话数
  (SELECT COUNT(*) FROM gaia_conversations WHERE user_id = p.id AND is_active = true) as conversation_count,
  -- 统计作业数
  (SELECT COUNT(*) FROM user_submissions WHERE user_id = p.id) as submission_count,
  -- 统计项目数
  (SELECT COUNT(*) FROM user_selected_projects WHERE user_id = p.id) as project_count
FROM profiles p
WHERE p.role = 'student'
ORDER BY conversation_count DESC, submission_count DESC
LIMIT 5;

-- 推荐测试用户ID（根据上面的查询结果）：
-- b9a9ab9d-2978-4918-80e0-d12422e24cb2 (陶子 - 1个对话，2个作业)


-- ===========================================
-- 第二步：调用 Edge Function 进行测试
-- ===========================================

-- 方法A：测试单个维度（推荐先用这个）
SELECT
  extensions.http((
    'POST',
    'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/summarize-user-activity',
    ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTU1MjgsImV4cCI6MjA3Mjk5MTUyOH0.jMmrvWwHMBo10bvWPU3vYcwp-2D5S5JTQmkvOr4qFIA')
    ],
    'application/json',
    jsonb_build_object(
      'userId', 'b9a9ab9d-2978-4918-80e0-d12422e24cb2',
      'dimensions', ARRAY['dialogue']::text[]
    )::text
  ))::jsonb as response;

-- 方法B：测试全部三个维度
SELECT
  extensions.http((
    'POST',
    'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/summarize-user-activity',
    ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTU1MjgsImV4cCI6MjA3Mjk5MTUyOH0.jMmrvWwHMBo10bvWPU3vYcwp-2D5S5JTQmkvOr4qFIA')
    ],
    'application/json',
    jsonb_build_object(
      'userId', 'b9a9ab9d-2978-4918-80e0-d12422e24cb2',
      'dimensions', ARRAY['dialogue', 'coursework', 'projects']::text[]
    )::text
  ))::jsonb as response;


-- ===========================================
-- 第三步：查看生成的总结数据
-- ===========================================

SELECT
  user_id,
  course_summaries,
  generated_at,
  valid_until,
  generated_by
FROM student_summaries
WHERE user_id = 'b9a9ab9d-2978-4918-80e0-d12422e24cb2';


-- ===========================================
-- 第四步：查看详细的总结内容（格式化显示）
-- ===========================================

SELECT
  user_id,

  -- 对话维度总结
  course_summaries->'dialogue'->>'summary' as "对话维度总结",
  (course_summaries->'dialogue'->>'conversation_count')::int as "对话数",
  (course_summaries->'dialogue'->>'message_count')::int as "消息数",

  -- 作业维度总结
  course_summaries->'coursework'->>'summary' as "作业维度总结",
  (course_summaries->'coursework'->>'submission_count')::int as "作业提交数",
  (course_summaries->'coursework'->>'interaction_count')::int as "互动次数",

  -- 项目维度总结
  course_summaries->'projects'->>'summary' as "项目维度总结",
  (course_summaries->'projects'->>'active_project_count')::int as "活跃项目数",
  (course_summaries->'projects'->>'total_project_count')::int as "总项目数",

  generated_at as "生成时间"
FROM student_summaries
WHERE user_id = 'b9a9ab9d-2978-4918-80e0-d12422e24cb2';


-- ===========================================
-- 可选：查看 Edge Function 执行日志
-- ===========================================

-- 请前往 Supabase Dashboard 查看日志：
-- Functions → summarize-user-activity → Logs
-- 可以看到详细的执行过程和AI生成的总结


-- ===========================================
-- 常见问题排查
-- ===========================================

-- Q1: 如果返回 "error": "Missing userId parameter"
-- A1: 检查 userId 是否正确，确保使用单引号包裹

-- Q2: 如果某个维度没有总结
-- A2: 该用户可能没有该维度的数据，使用上面的第一步查询找有数据的用户

-- Q3: 如果返回 OpenAI API 错误
-- A3: 检查 OPENAI_API_KEY 环境变量是否正确配置

-- Q4: 如果想测试其他用户
-- A4: 将上面SQL中的 user_id 替换为其他用户ID即可
