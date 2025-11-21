import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SummarizationRequest {
  userId: string;
  dimensions?: ("dialogue" | "coursework" | "projects")[];
  forceFullRefresh?: boolean;  // 测试模式：强制全量刷新，忽略last_summarized_at
}

/**
 * Edge Function: 用户学习行为总结
 *
 * 三个维度:
 * 1. 对话维度 (Dialogue) - 分析 gaia_conversations 和 chat_history
 * 2. 作业维度 (Coursework) - 分析 user_submissions 和 user_content_interactions
 * 3. 项目维度 (Projects) - 分析 user_selected_projects 和 pbl_project_enrollments
 *
 * 增量更新策略: 仅处理自 last_summarized_at 以来的新数据
 */

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // 1. 解析请求
    const { userId, dimensions = ["dialogue", "coursework", "projects"], forceFullRefresh = false }: SummarizationRequest =
      await req.json();

    console.log(`[开始总结] 用户ID: ${userId}, 维度: ${dimensions.join(", ")}, 强制全量刷新: ${forceFullRefresh ? '是' : '否'}`);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. 初始化 Supabase 客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. 获取现有的总结数据 (用于增量更新)
    const { data: existingSummary } = await supabase
      .from("student_summaries")
      .select("course_summaries")
      .eq("user_id", userId)
      .single();

    const courseSummaries = existingSummary?.course_summaries || {};
    console.log(`[现有总结] ${existingSummary ? "存在" : "不存在"}`);

    // 4. 处理各个维度
    const results: any = {
      dialogue: courseSummaries.dialogue || null,
      coursework: courseSummaries.coursework || null,
      projects: courseSummaries.projects || null,
    };

    // 5. 对话维度总结
    if (dimensions.includes("dialogue")) {
      console.log(`[对话维度] 开始处理...`);
      const lastSummarized = forceFullRefresh ? "1970-01-01" : (courseSummaries.dialogue?.last_summarized_at || "1970-01-01");

      // 5.1 查询盖亚对话数据 (gaia_conversations)
      const { data: gaiaConversations } = await supabase
        .from("gaia_conversations")
        .select("id, messages, created_at, updated_at, title, message_count")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gte("updated_at", lastSummarized)
        .order("updated_at", { ascending: false });

      // 5.2 查询聊天历史 (chat_history)
      const { data: chatHistory } = await supabase
        .from("chat_history")
        .select("id, content, role, agent_type, created_at")
        .eq("user_id", userId)
        .gte("created_at", lastSummarized)
        .order("created_at", { ascending: false })
        .limit(100);

      console.log(`[对话数据] 盖亚对话: ${gaiaConversations?.length || 0}条, 聊天历史: ${chatHistory?.length || 0}条`);

      // 5.3 使用 AI 生成对话总结
      if ((gaiaConversations && gaiaConversations.length > 0) || (chatHistory && chatHistory.length > 0)) {
        const dialogueSummary = await summarizeDialogue(gaiaConversations || [], chatHistory || []);
        results.dialogue = {
          summary: dialogueSummary,
          last_summarized_at: new Date().toISOString(),
          conversation_count: gaiaConversations?.length || 0,
          message_count: chatHistory?.length || 0,
        };
        console.log(`[对话总结] 完成, 长度: ${dialogueSummary.length}字`);
      } else {
        console.log(`[对话总结] 无新数据, 跳过`);
      }
    }

    // 6. 作业维度总结
    if (dimensions.includes("coursework")) {
      console.log(`[作业维度] 开始处理...`);
      const lastSummarized = forceFullRefresh ? "1970-01-01" : (courseSummaries.coursework?.last_summarized_at || "1970-01-01");

      // 6.1 查询用户提交的作业
      const { data: submissions } = await supabase
        .from("user_submissions")
        .select(`
          id,
          course_content_id,
          submission_type,
          content,
          submitted_at,
          status,
          score,
          feedback,
          consciousness_growth_points
        `)
        .eq("user_id", userId)
        .gte("submitted_at", lastSummarized)
        .order("submitted_at", { ascending: false });

      // 6.2 查询用户内容互动
      const { data: interactions } = await supabase
        .from("user_content_interactions")
        .select("id, content_id, interaction_type, created_at, metadata")
        .eq("user_id", userId)
        .gte("created_at", lastSummarized)
        .order("created_at", { ascending: false })
        .limit(200);

      console.log(`[作业数据] 提交: ${submissions?.length || 0}条, 互动: ${interactions?.length || 0}条`);

      // 6.3 使用 AI 生成作业总结
      if ((submissions && submissions.length > 0) || (interactions && interactions.length > 0)) {
        const courseworkSummary = await summarizeCoursework(submissions || [], interactions || []);
        results.coursework = {
          summary: courseworkSummary,
          last_summarized_at: new Date().toISOString(),
          submission_count: submissions?.length || 0,
          interaction_count: interactions?.length || 0,
        };
        console.log(`[作业总结] 完成, 长度: ${courseworkSummary.length}字`);
      } else {
        console.log(`[作业总结] 无新数据, 跳过`);
      }
    }

    // 7. 项目维度总结
    if (dimensions.includes("projects")) {
      console.log(`[项目维度] 开始处理...`);
      const lastSummarized = forceFullRefresh ? "1970-01-01" : (courseSummaries.projects?.last_summarized_at || "1970-01-01");

      // 7.1 查询用户选择的项目
      const { data: selectedProjects } = await supabase
        .from("user_selected_projects")
        .select(`
          id,
          project_id,
          selected_at,
          status,
          progress,
          last_activity_at,
          completion_percentage,
          course_contents:project_id (
            title,
            subtitle,
            module_name,
            difficulty_level
          )
        `)
        .eq("user_id", userId)
        .gte("last_activity_at", lastSummarized)
        .order("last_activity_at", { ascending: false });

      // 7.2 查询PBL项目注册
      const { data: pblEnrollments } = await supabase
        .from("pbl_project_enrollments")
        .select(`
          id,
          project_id,
          enrolled_at,
          status,
          progress,
          course_contents:project_id (
            title,
            subtitle
          )
        `)
        .eq("student_id", userId)
        .gte("updated_at", lastSummarized)
        .order("updated_at", { ascending: false });

      console.log(`[项目数据] 选择项目: ${selectedProjects?.length || 0}个, PBL注册: ${pblEnrollments?.length || 0}个`);

      // 7.3 使用 AI 生成项目总结
      if ((selectedProjects && selectedProjects.length > 0) || (pblEnrollments && pblEnrollments.length > 0)) {
        const projectsSummary = await summarizeProjects(selectedProjects || [], pblEnrollments || []);
        results.projects = {
          summary: projectsSummary,
          last_summarized_at: new Date().toISOString(),
          active_project_count: selectedProjects?.filter(p => p.status === "active").length || 0,
          total_project_count: (selectedProjects?.length || 0) + (pblEnrollments?.length || 0),
        };
        console.log(`[项目总结] 完成, 长度: ${projectsSummary.length}字`);
      } else {
        console.log(`[项目总结] 无新数据, 跳过`);
      }
    }

    // 8. 保存总结到数据库
    const updatedCourseSummaries = {
      ...results,
      last_full_update: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("student_summaries")
      .upsert({
        user_id: userId,
        course_summaries: updatedCourseSummaries,
        generated_by: "edge_function",
        generated_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后过期
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error(`[保存失败]`, upsertError);
      throw upsertError;
    }

    console.log(`[总结完成] 用户ID: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        dimensions,
        results: updatedCourseSummaries,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Connection": "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("[错误]", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * 对话维度 AI 总结
 */
async function summarizeDialogue(
  gaiaConversations: any[],
  chatHistory: any[]
): Promise<string> {
  const systemPrompt = `你是一位资深的教育心理学家和对话分析专家。

**任务**: 分析学生的对话记录，总结其在对话中展现的特点。

**分析维度**:
1. **思维深度**: 学生是否提出深刻的问题？是否能进行抽象思考？
2. **情感表达**: 学生如何表达情感？是否开放、真诚？
3. **好奇心**: 学生对哪些主题特别感兴趣？探索的广度和深度如何？
4. **反思能力**: 学生是否能够自我反思和成长？

**输出要求**:
- 200-300字的总结
- 客观、具体，避免空洞的评价
- 用第三人称描述 (如"该学生...")
- 重点关注亮点和特色，而非缺点

请基于以下对话数据进行分析:`;

  const conversationData = {
    gaia_conversations: gaiaConversations.map(conv => ({
      title: conv.title,
      message_count: conv.message_count,
      created_at: conv.created_at,
      sample_messages: Array.isArray(conv.messages) ? conv.messages.slice(-5) : [],
    })),
    chat_history: chatHistory.map(chat => ({
      role: chat.role,
      content: chat.content?.substring(0, 200),
      agent_type: chat.agent_type,
      created_at: chat.created_at,
    })),
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",  // GPT-4o Mini - 稳定版本，已验证可用
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(conversationData, null, 2) },
      ],
      max_tokens: 800,  // GPT-4o使用max_tokens
      temperature: 0.7,
    }),
  });

  console.log(`[对话总结-OpenAI] HTTP状态码: ${response.status}`);

  const result = await response.json();
  console.log(`[对话总结-OpenAI] 完整响应: ${JSON.stringify(result, null, 2)}`);

  // 检查响应状态
  if (!response.ok) {
    const errorMsg = `OpenAI API错误 (${response.status}): ${result.error?.message || result.error?.code || JSON.stringify(result)}`;
    console.error(`[对话总结-OpenAI错误] ${errorMsg}`);
    return `无法生成总结: ${errorMsg}`;
  }

  // 检查响应格式
  if (!result.choices || !result.choices[0]) {
    console.error(`[对话总结-OpenAI错误] 响应中没有choices数组: ${JSON.stringify(result)}`);
    return "无法生成总结: API返回格式异常";
  }

  const summary = result.choices[0]?.message?.content;
  if (!summary) {
    console.error(`[对话总结-OpenAI错误] 响应中没有content: ${JSON.stringify(result.choices[0])}`);
    return "无法生成总结: API未返回内容";
  }

  console.log(`[对话总结-OpenAI成功] 总结长度: ${summary.length}字`);
  return summary;
}

/**
 * 作业维度 AI 总结
 */
async function summarizeCoursework(
  submissions: any[],
  interactions: any[]
): Promise<string> {
  const systemPrompt = `你是一位资深的教育评估专家。

**任务**: 分析学生的作业提交和课程互动情况，总结其学习表现。

**分析维度**:
1. **学习态度**: 提交频率、完成质量、是否认真对待作业
2. **内容深度**: 作业内容是否深入？是否有独特见解？
3. **学习习惯**: 互动频率、浏览深度、是否主动探索
4. **成长轨迹**: 从早期到近期，是否有明显进步？

**输出要求**:
- 200-300字的总结
- 客观、具体，基于数据说话
- 用第三人称描述 (如"该学生...")
- 既要肯定优点，也要指出成长空间

请基于以下数据进行分析:`;

  const courseworkData = {
    submissions: submissions.map(sub => ({
      submission_type: sub.submission_type,
      content_preview: sub.content?.substring(0, 200),
      submitted_at: sub.submitted_at,
      status: sub.status,
      score: sub.score,
      feedback_preview: sub.feedback?.substring(0, 100),
      consciousness_growth_points: sub.consciousness_growth_points,
    })),
    interactions: interactions.map(int => ({
      interaction_type: int.interaction_type,
      created_at: int.created_at,
      metadata: int.metadata,
    })),
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",  // GPT-4o Mini - 稳定版本，已验证可用
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(courseworkData, null, 2) },
      ],
      max_tokens: 800,  // GPT-4o使用max_tokens
      temperature: 0.7,
    }),
  });

  console.log(`[作业总结-OpenAI] HTTP状态码: ${response.status}`);

  const result = await response.json();
  console.log(`[作业总结-OpenAI] 完整响应: ${JSON.stringify(result, null, 2)}`);

  // 检查响应状态
  if (!response.ok) {
    const errorMsg = `OpenAI API错误 (${response.status}): ${result.error?.message || result.error?.code || JSON.stringify(result)}`;
    console.error(`[作业总结-OpenAI错误] ${errorMsg}`);
    return `无法生成总结: ${errorMsg}`;
  }

  // 检查响应格式
  if (!result.choices || !result.choices[0]) {
    console.error(`[作业总结-OpenAI错误] 响应中没有choices数组: ${JSON.stringify(result)}`);
    return "无法生成总结: API返回格式异常";
  }

  const summary = result.choices[0]?.message?.content;
  if (!summary) {
    console.error(`[作业总结-OpenAI错误] 响应中没有content: ${JSON.stringify(result.choices[0])}`);
    return "无法生成总结: API未返回内容";
  }

  console.log(`[作业总结-OpenAI成功] 总结长度: ${summary.length}字`);
  return summary;
}

/**
 * 项目维度 AI 总结
 */
async function summarizeProjects(
  selectedProjects: any[],
  pblEnrollments: any[]
): Promise<string> {
  const systemPrompt = `你是一位资深的PBL项目导师和教育评估专家。

**任务**: 分析学生的PBL项目参与情况，总结其项目学习表现。

**分析维度**:
1. **项目选择**: 学生选择了哪些类型的项目？是否多样化？
2. **参与深度**: 项目进度如何？是否持续投入？
3. **完成质量**: 已完成项目的质量和成果如何？
4. **学习策略**: 是否同时参与多个项目？是否专注于某个领域？

**输出要求**:
- 200-300字的总结
- 客观、具体，基于数据说话
- 用第三人称描述 (如"该学生...")
- 重点关注项目学习带来的成长

请基于以下数据进行分析:`;

  const projectData = {
    selected_projects: selectedProjects.map(proj => ({
      project_name: proj.course_contents?.title,
      subtitle: proj.course_contents?.subtitle,
      module: proj.course_contents?.module_name,
      difficulty: proj.course_contents?.difficulty_level,
      status: proj.status,
      completion_percentage: proj.completion_percentage,
      selected_at: proj.selected_at,
      last_activity: proj.last_activity_at,
    })),
    pbl_enrollments: pblEnrollments.map(enr => ({
      project_name: enr.course_contents?.title,
      status: enr.status,
      enrolled_at: enr.enrolled_at,
      progress: enr.progress,
    })),
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",  // GPT-4o Mini - 稳定版本，已验证可用
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(projectData, null, 2) },
      ],
      max_tokens: 800,  // GPT-4o使用max_tokens
      temperature: 0.7,
    }),
  });

  console.log(`[项目总结-OpenAI] HTTP状态码: ${response.status}`);

  const result = await response.json();
  console.log(`[项目总结-OpenAI] 完整响应: ${JSON.stringify(result, null, 2)}`);

  // 检查响应状态
  if (!response.ok) {
    const errorMsg = `OpenAI API错误 (${response.status}): ${result.error?.message || result.error?.code || JSON.stringify(result)}`;
    console.error(`[项目总结-OpenAI错误] ${errorMsg}`);
    return `无法生成总结: ${errorMsg}`;
  }

  // 检查响应格式
  if (!result.choices || !result.choices[0]) {
    console.error(`[项目总结-OpenAI错误] 响应中没有choices数组: ${JSON.stringify(result)}`);
    return "无法生成总结: API返回格式异常";
  }

  const summary = result.choices[0]?.message?.content;
  if (!summary) {
    console.error(`[项目总结-OpenAI错误] 响应中没有content: ${JSON.stringify(result.choices[0])}`);
    return "无法生成总结: API未返回内容";
  }

  console.log(`[项目总结-OpenAI成功] 总结长度: ${summary.length}字`);
  return summary;
}
