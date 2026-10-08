import { GoogleGenAI } from "@google/genai";

let gemini = null;

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
} else {
  console.warn(
    "⚠️ Warning: GEMINI_API_KEY is missing from environment variables. AI analysis will run in static-only mode.",
  );
}

export default gemini;

