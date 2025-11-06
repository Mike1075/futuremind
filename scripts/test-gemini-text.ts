import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testGeminiText() {
  console.log("🧪 Testing Gemini API - Text Generation\n");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  try {
    console.log("📝 Testing text generation with gemini-pro...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Say hello in Chinese");
    const text = result.response.text();
    console.log("✅ Text generation SUCCESS!");
    console.log(`Response: ${text}\n`);

    console.log("Now testing image model availability...");
    const imageModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: {
        responseModalities: ["Image"],
        responseMimeType: "image/png",
      }
    });
    const imageResult = await imageModel.generateContent("A simple red circle");
    console.log("✅ Image model accessible!");

  } catch (error: any) {
    console.error("❌ Error:", error.message || error);
  }
}

testGeminiText();
