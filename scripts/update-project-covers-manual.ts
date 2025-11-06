/**
 * Manual update script for project cover images
 *
 * Use this script after manually uploading images to public/images/project-covers/
 * It will scan the directory and update the database with the correct paths
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
  project_cover_image: string | null;
}

async function main() {
  console.log("🖼️  Manual Project Cover Image Update Tool");
  console.log("=" .repeat(60));

  // Get the covers directory path
  const coversDir = path.join(process.cwd(), "public", "images", "project-covers");

  // Check if directory exists
  if (!fs.existsSync(coversDir)) {
    console.error("❌ Directory not found:", coversDir);
    console.log("\n💡 Please create the directory first:");
    console.log(`   mkdir -p "${coversDir}"`);
    return;
  }

  // Fetch all Icarus projects
  const { data: projects, error } = await supabase
    .from("course_contents")
    .select("id, title, project_cover_image")
    .eq("content_type", "icarus")
    .order("sequence_number");

  if (error || !projects) {
    console.error("❌ Failed to fetch projects:", error);
    return;
  }

  console.log(`\n📚 Found ${projects.length} Icarus projects`);
  console.log(`📁 Scanning directory: ${coversDir}\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  // Check each project for a corresponding image file
  for (const project of projects as Project[]) {
    const imageFileName = `${project.id}.png`;
    const imagePath = path.join(coversDir, imageFileName);
    const dbPath = `/images/project-covers/${imageFileName}`;

    console.log(`\n📋 ${project.title}`);
    console.log(`   ID: ${project.id}`);

    // Check if image file exists
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      console.log(`   ✅ Image found: ${imageFileName} (${Math.round(stats.size / 1024)} KB)`);

      // Check if database already has this path
      if (project.project_cover_image === dbPath) {
        console.log(`   ⏭️  Already set in database`);
        skippedCount++;
      } else {
        // Update database
        const { error: updateError } = await supabase
          .from("course_contents")
          .update({ project_cover_image: dbPath })
          .eq("id", project.id);

        if (updateError) {
          console.error(`   ❌ Failed to update database:`, updateError.message);
        } else {
          console.log(`   ✨ Database updated!`);
          updatedCount++;
        }
      }
    } else {
      console.log(`   ⚠️  Image not found: ${imageFileName}`);
      console.log(`   💡 Expected location: ${imagePath}`);
      notFoundCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Update Summary");
  console.log("=".repeat(60));
  console.log(`✨ Updated: ${updatedCount}`);
  console.log(`⏭️  Skipped (already set): ${skippedCount}`);
  console.log(`⚠️  Not found: ${notFoundCount}`);
  console.log(`📁 Total projects: ${projects.length}`);

  if (notFoundCount > 0) {
    console.log("\n💡 To add missing images:");
    console.log(`   1. Place PNG images in: ${coversDir}`);
    console.log(`   2. Name them as: {project-id}.png`);
    console.log(`   3. Run this script again`);
  }

  console.log("\n🎉 Done!");
}

// Run the script
main().catch(console.error);
