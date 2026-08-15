import OpenAI from "openai";
import {
  buildArticleAnalysisPrompt,
  type LearningLevel,
} from "./prompt";

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  throw new Error(
    "DEEPSEEK_API_KEY is not configured"
  );
}

export const deepseek = new OpenAI({
  apiKey,
  baseURL: "https://api.deepseek.com",
});

export const DEEPSEEK_MODEL =
  process.env.DEEPSEEK_MODEL ||
  "deepseek-chat";

function cleanJsonText(text: string) {
  let result = text.trim();

  if (result.startsWith("```")) {
    result = result
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  return result;
}

export async function analyzeEnglishArticle(
  content: string,
  level: LearningLevel = "intermediate",
  title = ""
) {
  const systemPrompt =
    buildArticleAnalysisPrompt(
      level,
      title
    );

  const completion =
    await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content,
        },
      ],
    });

  const result =
    completion.choices[0]?.message?.content;

  if (!result) {
    throw new Error(
      "DeepSeek returned an empty response"
    );
  }

  const cleaned = cleanJsonText(result);

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error(
      "DeepSeek invalid JSON:",
      cleaned
    );

    throw new Error(
      "AI 返回的数据格式异常，请重新分析一次。"
    );
  }
}