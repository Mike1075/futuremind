import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// 新的累积生长型树结构
interface TreeStructure {
  roots: {
    count: number;          // 涉及的领域数量
    depth_level: number;    // 平均探索深度 (1-10)
    is_solid: boolean;      // 有根则实
  };
  trunk: {
    thickness: number;      // 觉察力/定力 (0-50)
    height_level: number;   // 坚持练习的时长 (0-100)
    is_solid: boolean;      // 依赖于roots AND thickness > 0
  };
  branches: {
    count: number;          // 项目里程碑/深度探究次数
    avg_length: number;     // 洞见的平均精辟程度 (0-10)
    is_solid: boolean;      // 依赖于trunk
  };
  leaves: {
    count: number;          // Aha Moments总数
    is_solid: boolean;      // 依赖于branches
  };
  fruits: {
    count: number;          // 完成项目/贡献总数
    is_solid: boolean;      // 依赖于branches
  };
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
 * Edge Function: 意识进化树评估与生长 (累积制)
 *
 * The Gardener - 维护一棵持续生长的意识树
 * 根据新的行为总结，累积增加树的参数，树只会长大不会缩小
 *
 * 采用 Fire-and-Forget 模式：立即返回200，后台继续执行AI计算
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

    console.log(`[意识树生长] 收到请求 - 用户ID: ${userId}`);

    // 3. 立即返回 200 OK (Fire-and-Forget)
    const response = new Response(
      JSON.stringify({
        success: true,
        message: "意识树生长已启动，正在后台计算中...",
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
    executeTreeGrowth(userId).catch(error => {
      console.error(`[意识树生长-后台错误] 用户${userId}:`, error);
    });

    return response;

  } catch (error) {
    console.error("[意识树生长-请求错误]", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * 后台异步执行的核心生长逻辑
 */
async function executeTreeGrowth(userId: string): Promise<void> {
  const startTime = Date.now();
  console.log(`[后台计算] 开始为用户 ${userId} 计算意识树生长`);

  try {
    // 初始化 Supabase 客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 步骤1: 读取当前的树状态（旧树）
    console.log(`[读取旧树] 获取用户 ${userId} 的当前意识树状态...`);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("consciousness_tree_view")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error(`[读取错误] 无法读取用户档案:`, profileError);
      throw profileError;
    }

    // 如果树为null，初始化为"种子"状态
    const currentTree: TreeStructure = profile?.consciousness_tree_view || {
      roots: { count: 0, depth_level: 0, is_solid: false },
      trunk: { thickness: 0, height_level: 0, is_solid: false },
      branches: { count: 0, avg_length: 0, is_solid: false },
      leaves: { count: 0, is_solid: false },
      fruits: { count: 0, is_solid: false }
    };

    console.log(`[当前树状态] ${profile?.consciousness_tree_view ? "已存在" : "初始化为种子"}`);

    // 步骤2: 读取新的养分（未处理的行为总结）
    // 这里简化处理：读取最近5条总结作为"新养分"
    console.log(`[读取新养分] 获取用户 ${userId} 的最近行为总结...`);
    const { data: summaries, error: summaryError } = await supabase
      .from("student_summaries")
      .select("course_summaries, generated_at")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(5);

    if (summaryError) {
      console.error(`[读取错误] 无法读取总结:`, summaryError);
      throw summaryError;
    }

    if (!summaries || summaries.length === 0) {
      console.warn(`[警告] 用户 ${userId} 没有任何行为总结，跳过生长`);
      return;
    }

    console.log(`[读取成功] 获取到 ${summaries.length} 条新养分（行为总结）`);

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

    // 步骤4: 调用AI园丁进行增量计算
    console.log(`[AI园丁] 开始调用GPT-4o-mini计算生长增量...`);
    const newTreeData = await callGardenerAI(currentTree, summaryTexts);

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

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[完成] 用户 ${userId} 的意识树生长完成，耗时 ${duration}秒`);

  } catch (error) {
    console.error(`[后台计算失败] 用户 ${userId}:`, error);
    throw error;
  }
}

/**
 * 调用OpenAI进行意识树生长计算
 * The Gardener - 首席园丁
 */
async function callGardenerAI(
  currentTree: TreeStructure,
  newSummaries: any[]
): Promise<TreeStructure | null> {

  const systemPrompt = `### Role
你是"未来心灵学院"的首席园丁。你维护着一棵代表学员意识状态的"进化树"。
你的工作不是打分，而是根据学员最近的行为（养分），计算树的生长增量。

### Input Data
- Current Tree State: 学员当前的树参数（JSON）
- New Summaries: 学员最近的行为总结（对话、作业、项目）

### 核心生长法则 (The Growth Physics)

你需要分析"New Summaries"，提取增量，加到"Current Tree State"上，并根据严格的依赖链判断虚实。

**1. 根 (Roots) - 知识领域**
- 逻辑：分析总结中出现了多少个不同的知识领域（如量子力学、冥想、艺术、生物）
- 计算：
  - count = 旧count + 新发现的领域数量
  - depth_level = 根据新内容对知识探讨的深度，适当增加（每次深入探讨+0.5，上限10）
- 虚实：只要 count > 0，则 is_solid = true。否则 false

**2. 树干 (Trunk) - 觉察与定力**
- 逻辑：寻找关于"冥想"、"内省"、"情绪稳定"、"自我觉察"的描述
- 计算：
  - thickness (粗度)：每次发现有深刻的自我觉察或冥想练习，+2。如果没有体现，保持不变
  - height_level (高度)：只要有持续的学习/练习行为，+1
- 虚实依赖：
  - 只有当 roots.is_solid 为 true 且 thickness > 0 (有觉察力) 时，trunk.is_solid 才为 true
  - 否则为 false (虚线)

**3. 枝 (Branches) - 探究里程碑**
- 逻辑：寻找"完成了实验设计"、"获得了关键数据"、"进行了深刻讨论"等项目里程碑
- 计算：
  - count = 旧count + 新识别的里程碑数量
  - avg_length = 根据新里程碑的精彩程度微调
- 虚实依赖：只有当 trunk.is_solid 为 true 且 count > 0 时，is_solid 为 true。否则为 false

**4. 叶 (Leaves) - 顿悟时刻**
- 逻辑：寻找"提出了深度问题"或"产生了 Aha Moment (顿悟)"
- 计算：count = 旧count + 新发现的顿悟数量
- 虚实依赖：只有当 branches.is_solid 为 true 时，is_solid 为 true

**5. 果 (Fruits) - 创造与贡献**
- 逻辑：寻找"完成了完整项目"或"对他人的重大贡献/启发"
- 计算：count = 旧count + 新发现的贡献数量
- 虚实依赖：只有当 branches.is_solid 为 true 时，is_solid 为 true

### 特殊指令
- **只增不减**：除非数据重置，否则数值不应减少
- **虚线连锁**：如果树干变虚，上面的枝叶果必须强制变虚（即使它们有数量）
- **畸形允许**：允许 roots.count 很大（博学）但 trunk.thickness 很小（无定力）

请输出更新后的完整 JSON。不要包含 Markdown 格式。`;

  const userPrompt = `当前树状态（旧树）：
${JSON.stringify(currentTree, null, 2)}

最近的行为总结（新养分）：
${newSummaries.map((s, i) => `
=== 总结 ${i + 1} (${s.timestamp}) ===

【对话维度】
${s.dialogue}

【作业维度】
${s.coursework}

【项目维度】
${s.projects}
`).join('\n')}

请分析以上新养分，计算增量，输出更新后的意识树JSON结构。`;

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
        max_tokens: 1500,
        response_format: { type: "json_object" },
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
 * 验证新的累积型意识树结构
 */
function validateTreeStructure(tree: any): tree is TreeStructure {
  // 验证roots
  if (!tree.roots ||
      typeof tree.roots.count !== "number" ||
      typeof tree.roots.depth_level !== "number" ||
      typeof tree.roots.is_solid !== "boolean" ||
      tree.roots.count < 0 ||
      tree.roots.depth_level < 0 || tree.roots.depth_level > 10) {
    console.error(`[验证] roots 结构不正确`);
    return false;
  }

  // 验证trunk
  if (!tree.trunk ||
      typeof tree.trunk.thickness !== "number" ||
      typeof tree.trunk.height_level !== "number" ||
      typeof tree.trunk.is_solid !== "boolean" ||
      tree.trunk.thickness < 0 || tree.trunk.thickness > 50 ||
      tree.trunk.height_level < 0 || tree.trunk.height_level > 100) {
    console.error(`[验证] trunk 结构不正确`);
    return false;
  }

  // 验证branches
  if (!tree.branches ||
      typeof tree.branches.count !== "number" ||
      typeof tree.branches.avg_length !== "number" ||
      typeof tree.branches.is_solid !== "boolean" ||
      tree.branches.count < 0 ||
      tree.branches.avg_length < 0 || tree.branches.avg_length > 10) {
    console.error(`[验证] branches 结构不正确`);
    return false;
  }

  // 验证leaves
  if (!tree.leaves ||
      typeof tree.leaves.count !== "number" ||
      typeof tree.leaves.is_solid !== "boolean" ||
      tree.leaves.count < 0) {
    console.error(`[验证] leaves 结构不正确`);
    return false;
  }

  // 验证fruits
  if (!tree.fruits ||
      typeof tree.fruits.count !== "number" ||
      typeof tree.fruits.is_solid !== "boolean" ||
      tree.fruits.count < 0) {
    console.error(`[验证] fruits 结构不正确`);
    return false;
  }

  return true;
}
