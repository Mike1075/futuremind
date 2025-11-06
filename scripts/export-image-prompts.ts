/**
 * Export image generation prompts to a file
 *
 * This script generates all prompts for the 12 Icarus projects
 * and exports them to a text file for manual use with AI image generators
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Project {
  id: string;
  title: string;
  project_intro: string;
  module_name: string;
  difficulty_level: string;
}

/**
 * Generate a creative image prompt based on project metadata
 */
function generateImagePrompt(project: Project): string {
  const difficultyThemes: Record<string, string> = {
    "基础探索": "bright, welcoming, gentle lighting, approachable",
    "进阶挑战": "dynamic, vibrant, intriguing atmosphere, medium complexity",
    "深度研究": "sophisticated, deep colors, mysterious, complex patterns",
    "创新实践": "futuristic, cutting-edge, innovative, bold design"
  };

  const moduleThemes: Record<string, string> = {
    "模块1：观察与感知": "sensory exploration, nature, awareness, mindfulness",
    "模块2：量子与意识": "quantum physics, consciousness, cosmic connections, particle effects",
    "模块3：集体意识": "interconnection, networks, global unity, shared consciousness"
  };

  const theme = difficultyThemes[project.difficulty_level] || "modern, creative";
  const moduleTheme = moduleThemes[project.module_name] || "scientific exploration";

  // Create a rich, detailed prompt
  const prompt = `Create a stunning, modern cover image for a science project titled "${project.title}".

The image should be:
- Style: ${theme}, professional, high-quality digital art
- Theme: ${moduleTheme}
- Mood: Inspiring, thought-provoking, educational yet fun
- Visual elements: Abstract scientific concepts blended with real-world elements
- Color palette: Vibrant but harmonious, suitable for students aged 12-18
- Composition: Centered focal point with dynamic background
- Quality: 4K, sharp, visually striking

The image should capture the essence of "${project.title}" while maintaining a balance between scientific accuracy and artistic creativity. Make it attractive and engaging for young learners interested in consciousness, quantum physics, and animal intelligence.

No text or words should appear in the image - pure visual storytelling only.`;

  return prompt;
}

async function main() {
  console.log("📝 Exporting Image Generation Prompts");
  console.log("=" .repeat(60));

  // Fetch all Icarus projects
  const { data: projects, error } = await supabase
    .from("course_contents")
    .select("id, title, project_intro, module_name, difficulty_level")
    .eq("content_type", "icarus")
    .order("sequence_number");

  if (error || !projects) {
    console.error("❌ Failed to fetch projects:", error);
    return;
  }

  console.log(`\n📚 Found ${projects.length} Icarus projects\n`);

  let output = "# 伊卡洛斯计划 - PBL项目封面图片生成Prompts\n\n";
  output += `生成日期: ${new Date().toLocaleString('zh-CN')}\n\n`;
  output += "## 使用说明\n\n";
  output += "1. 复制每个项目的prompt\n";
  output += "2. 粘贴到AI图片生成工具（Midjourney、DALL-E、Stable Diffusion等）\n";
  output += "3. 生成图片并下载\n";
  output += "4. 重命名为对应的项目ID.png\n";
  output += "5. 上传到 public/images/project-covers/\n";
  output += "6. 运行 `npx tsx scripts/update-project-covers-manual.ts` 更新数据库\n\n";
  output += "---\n\n";

  // Generate prompts for each project
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i] as Project;

    console.log(`[${i + 1}/${projects.length}] ${project.title}`);

    output += `## 项目 ${i + 1}: ${project.title}\n\n`;
    output += `**项目ID**: \`${project.id}\`\n\n`;
    output += `**模块**: ${project.module_name}\n\n`;
    output += `**难度**: ${project.difficulty_level}\n\n`;
    output += `**文件名**: \`${project.id}.png\`\n\n`;
    output += "### Prompt:\n\n";
    output += "```\n";
    output += generateImagePrompt(project);
    output += "\n```\n\n";
    output += "---\n\n";
  }

  // Add quick reference table
  output += "## 快速参考表\n\n";
  output += "| # | 项目标题 | 项目ID | 文件名 |\n";
  output += "|---|---------|--------|--------|\n";

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i] as Project;
    output += `| ${i + 1} | ${project.title} | \`${project.id}\` | \`${project.id}.png\` |\n`;
  }

  // Save to file
  const outputPath = path.join(process.cwd(), "scripts", "image-prompts.md");
  fs.writeFileSync(outputPath, output, "utf-8");

  console.log(`\n✅ Prompts exported to: ${outputPath}`);
  console.log(`\n📊 Total: ${projects.length} prompts generated`);
  console.log("\n🎉 Done!");
}

// Run the script
main().catch(console.error);
