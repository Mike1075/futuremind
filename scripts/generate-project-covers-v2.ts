/**
 * Generate cover images for Icarus PBL projects using Gemini 2.5 Flash Image
 * Based on official documentation
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize clients - GoogleGenAI will automatically use GEMINI_API_KEY from env
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

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
    "模块3：集体意识": "interconnection, networks, collective behavior, emergent patterns"
  };

  const difficultyTheme = difficultyThemes[project.difficulty_level] || "modern, professional";
  const moduleTheme = moduleThemes[project.module_name] || "scientific exploration";

  return `Create a stunning, modern cover image for a science project titled "${project.title}".

The image should be:
- Style: ${difficultyTheme}, professional, high-quality digital art
- Theme: ${moduleTheme}
- Mood: Inspiring, thought-provoking, educational yet fun
- Visual elements: Abstract scientific concepts blended with real-world elements
- Color palette: Vibrant but harmonious, suitable for students aged 12-18
- Composition: Centered focal point with dynamic background
- Quality: 4K, sharp, visually striking

No text or words should appear in the image - pure visual storytelling only.`;
}

/**
 * Generate an image using Gemini 2.5 Flash Image API
 */
async function generateImage(prompt: string, projectId: string): Promise<string | null> {
  try {
    console.log(`\n🎨 Generating image for project ${projectId}...`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    // Extract image data from response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");

        // Ensure directory exists
        const coverDir = path.join(process.cwd(), "public", "images", "project-covers");
        if (!fs.existsSync(coverDir)) {
          fs.mkdirSync(coverDir, { recursive: true });
        }

        // Save image to file
        const fileName = `${projectId}.png`;
        const filePath = path.join(coverDir, fileName);

        fs.writeFileSync(filePath, buffer);
        console.log(`✅ Image saved: ${fileName}`);

        return `/images/project-covers/${fileName}`;
      }
    }

    console.log("⚠️ No image data in response");
    return null;
  } catch (error: any) {
    console.error(`❌ Error generating image:`, error.message || error);
    return null;
  }
}

/**
 * Update database with generated image path
 */
async function updateProjectCover(projectId: string, imagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("course_contents")
      .update({ project_cover_image: imagePath })
      .eq("id", projectId);

    if (error) {
      console.error(`Failed to update database for project ${projectId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating database:`, error);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting Icarus Project Cover Image Generation");
  console.log("============================================================\n");

  // Get Icarus system ID
  const { data: systemData, error: systemError } = await supabase
    .from("course_systems")
    .select("id")
    .eq("system_key", "icarus")
    .single();

  if (systemError || !systemData) {
    console.error("Failed to get Icarus system:", systemError);
    return;
  }

  // Fetch all Icarus projects
  const { data: projects, error: projectsError } = await supabase
    .from("course_contents")
    .select("id, title, project_intro, module_name, difficulty_level")
    .eq("system_id", systemData.id)
    .eq("content_type", "icarus")
    .order("sequence_number");

  if (projectsError || !projects) {
    console.error("Failed to fetch projects:", projectsError);
    return;
  }

  console.log(`📚 Found ${projects.length} Icarus projects\n`);

  let successCount = 0;
  let failCount = 0;

  // Generate images for each project
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i] as Project;

    console.log(`\n[${i + 1}/${projects.length}] Processing: ${project.title}`);
    console.log(`Module: ${project.module_name}`);
    console.log(`Difficulty: ${project.difficulty_level}`);

    const prompt = generateImagePrompt(project);
    const imagePath = await generateImage(prompt, project.id);

    if (imagePath) {
      const updated = await updateProjectCover(project.id, imagePath);
      if (updated) {
        successCount++;
        console.log(`✅ Successfully updated database with image path`);
      } else {
        failCount++;
      }
    } else {
      failCount++;
    }

    // Wait to avoid rate limiting
    if (i < projects.length - 1) {
      console.log(`⏳ Waiting 5 seconds before next generation...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log("\n============================================================");
  console.log("📊 Generation Summary");
  console.log("============================================================");
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Images saved to: public/images/project-covers/`);
  console.log("\n🎉 Done!");
}

main().catch(console.error);
