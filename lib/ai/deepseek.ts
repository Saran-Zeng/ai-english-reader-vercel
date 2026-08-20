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

/**
 * 清理 AI 返回的 JSON。
 */
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

/**
 * 分析一篇文章的一个区块。
 *
 * 旧版本：
 * 5000 词 → 一次 API 请求
 *
 * 新版本：
 * 5000 词 → 多个约 600～700 词区块
 */
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

      response_format: {
        type: "json_object",
      },

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

/**
 * 将长文章切成适合 AI 分析的小区块。
 *
 * 目标：
 * 每区块约 600～700 个英文单词。
 *
 * 尽量按照完整句子切割，
 * 避免把一个句子从中间截断。
 */
export function splitArticleIntoChunks(
  content: string,
  maxWords = 700
): string[] {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  let currentParts: string[] = [];
  let currentWords = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords =
      paragraph.split(/\s+/).filter(Boolean);

    /**
     * 如果一个段落本身已经超过 maxWords，
     * 再按照句子拆。
     */
    if (paragraphWords.length > maxWords) {
      const sentences =
        paragraph.match(
          /[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g
        ) || [paragraph];

      for (const sentence of sentences) {
        const sentenceText =
          sentence.trim();

        if (!sentenceText) continue;

        const sentenceWords =
          sentenceText
            .split(/\s+/)
            .filter(Boolean);

        if (
          currentWords > 0 &&
          currentWords + sentenceWords.length >
            maxWords
        ) {
          chunks.push(
            currentParts.join("\n\n")
          );

          currentParts = [];
          currentWords = 0;
        }

        currentParts.push(sentenceText);
        currentWords +=
          sentenceWords.length;
      }

      continue;
    }

    /**
     * 普通段落。
     */
    if (
      currentWords > 0 &&
      currentWords + paragraphWords.length >
        maxWords
    ) {
      chunks.push(
        currentParts.join("\n\n")
      );

      currentParts = [];
      currentWords = 0;
    }

    currentParts.push(paragraph);
    currentWords += paragraphWords.length;
  }

  if (currentParts.length > 0) {
    chunks.push(
      currentParts.join("\n\n")
    );
  }

  /**
   * 极端情况下，如果仍然出现超长区块，
   * 再进行最后一次硬切。
   */
  const finalChunks: string[] = [];

  for (const chunk of chunks) {
    const words = chunk
      .split(/\s+/)
      .filter(Boolean);

    if (words.length <= maxWords * 1.2) {
      finalChunks.push(chunk);
      continue;
    }

    for (
      let i = 0;
      i < words.length;
      i += maxWords
    ) {
      finalChunks.push(
        words.slice(i, i + maxWords).join(" ")
      );
    }
  }

  return finalChunks;
}

/**
 * 对长文章进行分批分析。
 *
 * 为避免一次性请求过多，
 * 每次最多并发 3 个区块。
 */
export async function analyzeLongArticle(
  content: string,
  level: LearningLevel = "intermediate",
  title = ""
) {
  const chunks =
    splitArticleIntoChunks(content, 700);

  if (chunks.length === 0) {
    throw new Error(
      "文章内容为空，无法分析。"
    );
  }

  console.log(
    `Long article split into ${chunks.length} chunks`
  );

  const results: any[] = [];

  const batchSize = 3;

  for (
    let start = 0;
    start < chunks.length;
    start += batchSize
  ) {
    const batch =
      chunks.slice(
        start,
        start + batchSize
      );

    console.log(
      `Analyzing chunks ${start + 1}-${Math.min(
        start + batchSize,
        chunks.length
      )} of ${chunks.length}`
    );

    const batchResults =
      await Promise.all(
        batch.map((chunk) =>
          analyzeEnglishArticle(
            chunk,
            level,
            title
          )
        )
      );

    results.push(...batchResults);
  }

  const merged = {
    title:
      title ||
      results[0]?.title ||
      "Untitled Article",

    summary: results
      .map((item) => item?.summary)
      .filter(Boolean)
      .join("\n\n"),

    translation: results
      .map((item) => item?.translation)
      .filter(Boolean)
      .join("\n\n"),

    level:
      results.find((item) => item?.level)
        ?.level || "B1",

    sentences: results.flatMap(
      (item) =>
        Array.isArray(item?.sentences)
          ? item.sentences
          : []
    ),

    vocabulary: results.flatMap(
      (item) =>
        Array.isArray(item?.vocabulary)
          ? item.vocabulary
          : []
    ),

    grammar: results.flatMap(
      (item) =>
        Array.isArray(item?.grammar)
          ? item.grammar
          : []
    ),
  };

  /**
   * 去除重复词汇。
   */
  const vocabularyMap =
    new Map<string, any>();

  for (const item of merged.vocabulary) {
    if (!item?.word) continue;

    const key = String(item.word)
      .trim()
      .toLowerCase();

    if (!vocabularyMap.has(key)) {
      vocabularyMap.set(key, item);
    }
  }

  merged.vocabulary = Array.from(
    vocabularyMap.values()
  );

  /**
   * 去除重复语法。
   */
  const grammarMap =
    new Map<string, any>();

  for (const item of merged.grammar) {
    if (!item?.title) continue;

    const key = String(item.title)
      .trim()
      .toLowerCase();

    if (!grammarMap.has(key)) {
      grammarMap.set(key, item);
    }
  }

  merged.grammar = Array.from(
    grammarMap.values()
  );

  return merged;
}