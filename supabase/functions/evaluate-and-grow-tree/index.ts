import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface TreeStructure {
  roots: { growth_value: number; is_solid: boolean };
  trunk: { growth_value: number; is_solid: boolean };
  branches: { growth_value: number; is_solid: boolean };
  leaves: { growth_value: number; is_solid: boolean };
  fruits: { growth_value: number; is_solid: boolean };
}

interface EvaluationRequest {
  userId: string;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Edge Function: 意识进化树评估与生长
 *
 * 这是系统的"大脑"。读取用户的行为总结历史，进行深度AI推理，
 * 计算出"意识进化树"的最新生长参数，并更新到数据库。
 *
 * 采用 Fire-and-Forget 模式：立即返回200，后台继续执行AI计算。
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // 1. 鉴权 - 验证请求
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. 解析请求
    const { userId }: EvaluationRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[意识树评估] 收到请求 - 用户ID: ${userId}`);

    // 3. 立即返回 200 OK (Fire-and-Forget)
    // 告诉前端"计算已触发"，然后在后台继续执行
    const response = new Response(
      JSON.stringify({
        success: true,
        message: "意识树评估已启动，正在后台计算中...",
        userId
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

    // 4. 在后台异步执行实际的计算逻辑
    // 注意：这个promise不会阻塞response的返回
    executeTreeEvaluation(userId).catch(error => {
      console.error(`[意识树评估-后台错误] 用户${userId}:`, error);
    });

    return response;

  } catch (error) {
    console.error("[意识树评估-请求错误]", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * 后台异步执行的核心评估逻辑
 */
async function executeTreeEvaluation(userId: string): Promise<void> {
  const startTime = Date.now();
  console.log(`[后台计算] 开始为用户 ${userId} 进行意识树评估`);

  try {
    // 初始化 Supabase 客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 步骤1: 读取用户的历史行为总结（最近50条）
    console.log(`[读取数据] 获取用户 ${userId} 的历史总结...`);
    const { data: summaries, error: summaryError } = await supabase
      .from("student_summaries")
      .select("course_summaries, generated_at")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(50);

    if (summaryError) {
      console.error(`[读取错误] 无法读取总结:`, summaryError);
      throw summaryError;
    }

    if (!summaries || summaries.length === 0) {
      console.warn(`[警告] 用户 ${userId} 没有任何行为总结，跳过评估`);
      return;
    }

    console.log(`[读取成功] 获取到 ${summaries.length} 条历史总结`);

    // 步骤2: 读取当前的意识树状态（作为基准）
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("consciousness_tree_view")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error(`[读取错误] 无法读取用户档案:`, profileError);
      throw profileError;
    }

    const currentTree = profile?.consciousness_tree_view || null;
    console.log(`[当前树状态] ${currentTree ? "存在" : "不存在"}`);

    // 步骤3: 准备AI输入数据
    const summaryTexts = summaries.map((s, index) => {
      const cs = s.course_summaries;
      return {
        timestamp: s.generated_at,
        dialogue: cs?.dialogue?.summary || "无对话总结",
        coursework: cs?.coursework?.summary || "无作业总结",
        projects: cs?.projects?.summary || "无项目总结",
      };
    });

    // 步骤4: 调用OpenAI进行深度分析
    console.log(`[AI分析] 开始调用GPT-4o进行意识树评估...`);
    const newTreeData = await callTreeArchitectAI(summaryTexts, currentTree);

    if (!newTreeData) {
      console.error(`[AI错误] AI未能返回有效的树结构`);
      return;
    }

    console.log(`[AI成功] 新的意识树结构已生成`);

    // 步骤5: 更新数据库 - profiles表
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        consciousness_tree_view: newTreeData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error(`[更新错误] 无法更新profiles:`, updateError);
      throw updateError;
    }

    console.log(`[更新成功] profiles.consciousness_tree_view 已更新`);

    // 步骤6: 插入历史记录 (暂时跳过 - 表结构待更新)
    // TODO: consciousness_level_history 表需要添加 tree_state 字段才能存储意识树历史
    // const { error: historyError } = await supabase
    //   .from("consciousness_level_history")
    //   .insert({
    //     user_id: userId,
    //     tree_state: newTreeData,
    //     recorded_at: new Date().toISOString(),
    //   });
    console.log(`[跳过历史记录] consciousness_level_history表结构待更新`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[完成] 用户 ${userId} 的意识树评估完成，耗时 ${duration}秒`);

  } catch (error) {
    console.error(`[后台计算失败] 用户 ${userId}:`, error);
    throw error;
  }
}

/**
 * 调用OpenAI进行意识树架构分析
 * The Architect - 首席意识架构师
 */
async function callTreeArchitectAI(
  summaries: any[],
  currentTree: TreeStructure | null
): Promise<TreeStructure | null> {

  const systemPrompt = `### Role
你是"未来心灵学院"的首席意识架构师。你的任务是根据学员的行为总结，重构他的精神外化形态——"意识进化树"。
这**不是**一个线性积分系统。你必须像一位严厉而充满智慧的禅师，透过现象看本质。

### Input Data
你将收到一系列关于该学员的"对话总结"、"作业总结"和"项目总结"。

### Output Structure (JSON)
你需要返回以下 JSON 结构（不要包含 Markdown 格式）：
{
  "roots": { "growth_value": 0-100, "is_solid": boolean },
  "trunk": { "growth_value": 0-100, "is_solid": boolean },
  "branches": { "growth_value": 0-100, "is_solid": boolean },
  "leaves": { "growth_value": 0-100, "is_solid": boolean },
  "fruits": { "growth_value": 0-100, "is_solid": boolean }
}

### 核心评分法则 ( The Laws of Growth )

**1. 根 (Roots) - 广度与连接**
- **判断标准**：学员是否涉猎了多个不同领域的知识（如物理、哲学、艺术、生物）？是否有跨学科的思考？
- **评分**：领域越广，分值越高。
- **虚实**：只有当他能够将至少两个不同领域的知识关联起来讨论时，才为 true (Solid)。单纯的看书只是虚线。

**2. 树干 (Trunk) - 觉察与定力**
- **判断标准**：看"作业总结"中的冥想/内省部分。他是否诚实面对自己？情绪是否趋于稳定？
- **评分**：觉察越深，分值越高（决定树干粗细）。
- **虚实 (Dependency Rule)**：**死板规则**——如果 roots.is_solid 为 false，则 trunk.is_solid **必须** 为 false（根基不稳，定力皆虚）。如果根是实心的，且他的作业显示出持续的专注，则为 true。

**3. 枝干 (Branches) - 探索深度**
- **判断标准**：看"对话总结"和"项目总结"。他是否在某个特定问题上持续追问？是否在很多个项目中浅尝辄止（多分叉但短）还是在一个项目中深入挖掘（少分叉但长）？
- **评分**：好奇心越强，分值越高。
- **虚实 (Dependency Rule)**：如果 trunk.is_solid 为 false，则 branches.is_solid **必须** 为 false。

**4. 叶 (Leaves) - 洞见 (Insight)**
- **判断标准**：寻找总结中的"Aha Moment"、"顿悟"、"深刻理解"。
- **评分**：洞见越多，分值越高。
- **虚实**：如果 branches.is_solid 为 false，则叶子为虚。

**5. 果 (Fruits) - 创造与利他**
- **判断标准**：看"项目总结"。他是否产出了具体的作品？是否帮助了同学？是否发起了项目？
- **评分**：贡献越大，分值越高。
- **虚实**：如果 branches.is_solid 为 false，则果实为虚。

### 特殊形态允许 (Deformity Allowed)
- 允许**畸形生长**。例如：一个学员可能读了很多书（根极发达），但完全无法静心（树干细且虚），导致上面的枝叶果全部是虚的。这没问题，请如实反映。
- 允许**天才型生长**：一个学员可能根系一般，但对某个单一问题钻研极深（单根主枝极长），且结出了果实。

请基于输入数据，进行深度定性分析，然后输出 JSON。`;

  const userPrompt = `以下是该学员的历史行为总结（从最新到最旧）：

${summaries.map((s, i) => `
=== 总结 ${i + 1} (${s.timestamp}) ===

【对话维度】
${s.dialogue}

【作业维度】
${s.coursework}

【项目维度】
${s.projects}
`).join('\n')}

${currentTree ? `\n当前的意识树状态（作为参考）：\n${JSON.stringify(currentTree, null, 2)}\n` : ''}

请分析以上所有数据，输出新的意识树JSON结构。`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }, // 强制JSON输出
      }),
    });

    console.log(`[AI-OpenAI] HTTP状态码: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[AI错误] OpenAI API错误:`, errorData);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      console.error(`[AI错误] OpenAI未返回内容`);
      return null;
    }

    console.log(`[AI原始输出]\n${content}`);

    // 尝试解析JSON
    try {
      const treeData = JSON.parse(content) as TreeStructure;

      // 验证结构
      if (!validateTreeStructure(treeData)) {
        console.error(`[验证失败] AI返回的JSON结构不符合要求`);
        return null;
      }

      console.log(`[验证通过] 意识树结构有效`);
      return treeData;

    } catch (parseError) {
      console.error(`[解析错误] 无法解析AI返回的JSON:`, parseError);
      console.error(`[原始内容] ${content}`);
      return null;
    }

  } catch (error) {
    console.error(`[AI调用失败]`, error);
    return null;
  }
}

/**
 * 验证意识树结构的完整性
 */
function validateTreeStructure(tree: any): tree is TreeStructure {
  const requiredParts = ["roots", "trunk", "branches", "leaves", "fruits"];

  for (const part of requiredParts) {
    if (!tree[part]) {
      console.error(`[验证] 缺少部分: ${part}`);
      return false;
    }

    const node = tree[part];
    if (
      typeof node.growth_value !== "number" ||
      typeof node.is_solid !== "boolean" ||
      node.growth_value < 0 ||
      node.growth_value > 100
    ) {
      console.error(`[验证] 部分 ${part} 的数据格式不正确`);
      return false;
    }
  }

  return true;
}
