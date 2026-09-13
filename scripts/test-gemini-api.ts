import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testAPI() {
  console.log("🧪 Testing Gemini API connection...");
  console.log(`API Key: ${process.env.GEMINI_API_KEY?.substring(0, 10)}...`);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    // Test 1: Simple text generation
    console.log("\n📝 Test 1: Simple text generation");
    const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const textResult = await textModel.generateContent("Say hello in 5 words");
    console.log("✅ Text generation works!");
    console.log("Response:", textResult.response.text());

    // Test 2: Image generation with gemini-2.0-flash-exp
    console.log("\n🎨 Test 2: Image generation");
    const imageModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["Image"],
      },
    });

    const imageResult = await imageModel.generateContent("A simple red circle");
    console.log("✅ Image generation works!");
    console.log("Candidates:", imageResult.response.candidates?.length);

    if (imageResult.response.candidates && imageResult.response.candidates[0].content.parts) {
      for (const part of imageResult.response.candidates[0].content.parts) {
        if (part.inlineData) {
          console.log("✅ Image data received! Size:", part.inlineData.data.length, "bytes");
        }
      }
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message || error);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
}

testAPI();
