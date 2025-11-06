/**
 * Generate cover images for Icarus PBL projects using Gemini 2.5 Flash Image (REST API version)
 *
 * This version uses direct REST API calls to bypass potential network issues with the SDK
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import fetch from "node-fetch";

// Load environment variables
dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

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

/**
 * Generate an image using Gemini REST API
 */
async function generateImage(prompt: string, projectId: string): Promise<string | null> {
  try {
    console.log(`\n🎨 Generating image for project ${projectId}...`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    // Use gemini-2.0-flash-exp with image generation
    const url = `${GEMINI_API_URL}/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseModalities: ["Image"],
        responseMimeType: "image/png"
      }
    };

    console.log(`📡 Calling API: ${url.substring(0, 80)}...`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return null;
    }

    const data: any = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      console.log("⚠️ No candidates in response");
      return null;
    }

    // Extract image data from response
    for (const candidate of data.candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            const buffer = Buffer.from(imageData, "base64");

            // Save image to file
            const fileName = `${projectId}.png`;
            const filePath = path.join(process.cwd(), "public", "images", "project-covers", fileName);

            fs.writeFileSync(filePath, buffer);
            console.log(`✅ Image saved: ${fileName} (${buffer.length} bytes)`);

            return `/images/project-covers/${fileName}`;
          }
        }
      }
    }

    console.log("⚠️ No image data in response");
    return null;
  } catch (error: any) {
    console.error(`❌ Error generating image:`, error.message || error);
    if (error.cause) {
      console.error(`   Cause:`, error.cause.message || error.cause);
    }
    return null;
  }
}

/**
 * Update database with generated image path
 */
async function updateProjectCoverImage(projectId: string, imagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("course_contents")
      .update({ project_cover_image: imagePath })
      .eq("id", projectId);

    if (error) {
      console.error(`❌ Database update failed:`, error);
      return false;
    }

    console.log(`✅ Database updated for project ${projectId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating database:`, error);
    return false;
  }
}

/**
 * Add delay to avoid rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution function
 */
async function main() {
  console.log("🚀 Starting Icarus Project Cover Image Generation (REST API)");
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

  let successCount = 0;
  let failCount = 0;

  // Process each project
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i] as Project;

    console.log(`\n[${ i + 1}/${projects.length}] Processing: ${project.title}`);
    console.log(`Module: ${project.module_name}`);
    console.log(`Difficulty: ${project.difficulty_level}`);

    // Generate prompt
    const prompt = generateImagePrompt(project);

    // Generate image
    const imagePath = await generateImage(prompt, project.id);

    if (imagePath) {
      // Update database
      const updated = await updateProjectCoverImage(project.id, imagePath);
      if (updated) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      failCount++;
    }

    // Add delay to avoid rate limiting (except for last item)
    if (i < projects.length - 1) {
      console.log("⏳ Waiting 10 seconds before next generation...");
      await delay(10000);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Generation Summary");
  console.log("=".repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Images saved to: public/images/project-covers/`);
  console.log("\n🎉 Done!");
}

// Run the script
main().catch(console.error);
