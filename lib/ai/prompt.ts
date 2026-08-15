export type LearningLevel =
  | "beginner"
  | "intermediate"
  | "advanced";

export function getLevelInstruction(
  level: LearningLevel
) {
  if (level === "beginner") {
    return `
学习等级：初级 Beginner

请按照英语基础学习者能够理解的方式分析。

重点：
1. 使用简单、清楚的中文解释。
2. 重点解释常见基础词汇。
3. 重点解释简单句型。
4. 对复杂句子进行拆分。
5. 语法解释不要使用过多专业术语。
6. 每个重点词汇尽量提供简单例句。
7. 词汇数量控制在文章中最值得学习的范围。
`;
  }

  if (level === "advanced") {
    return `
学习等级：高级 Advanced

请按照高阶英语学习者的要求分析。

重点：
1. 关注高级词汇、搭配、短语和语义差异。
2. 深入分析复杂句型。
3. 分析从句、非谓语、倒装、强调、虚拟语气等重要结构。
4. 解释作者在具体语境中的表达方式。
5. 关注自然英语表达，而不仅仅是中文翻译。
6. 对高级词汇说明词性、语境含义和常见搭配。
7. 重点分析真正具有学习价值的语言结构。
`;
  }

  return `
学习等级：中级 Intermediate

请按照中级英语学习者能够理解的方式分析。

重点：
1. 重点解释实用词汇和常见搭配。
2. 分析重要句型和复杂句子结构。
3. 对关键语法进行清晰解释。
4. 中文解释自然、易懂。
5. 适当补充词汇的语境用法。
`;
}

export function buildArticleAnalysisPrompt(
  level: LearningLevel,
  title?: string
) {
  return `
You are an expert English teacher and English reading assistant.

Analyze the user's English article for an English learner.

${getLevelInstruction(level)}

${
  title
    ? `用户提供的文章标题：${title}`
    : ""
}

Return ONLY valid JSON.

The JSON structure MUST be:

{
  "title": "string",
  "summary": "natural Simplified Chinese summary",
  "translation": "natural Simplified Chinese translation",
  "level": "A1 | A2 | B1 | B2 | C1 | C2",
  "sentences": [
    {
      "english": "original English sentence",
      "translation": "Chinese translation",
      "grammar": "important grammar explanation in Chinese",
      "words": [
        {
          "word": "important word",
          "meaning": "Chinese meaning"
        }
      ]
    }
  ],
  "vocabulary": [
    {
      "word": "word",
      "meaning": "Chinese meaning",
      "partOfSpeech": "part of speech",
      "example": "English example sentence"
    }
  ],
  "grammar": [
    {
      "title": "grammar point",
      "explanation": "Chinese explanation",
      "example": "English example"
    }
  ]
}

Rules:

1. Return JSON only.
2. Do not use Markdown.
3. Do not use code fences.
4. Preserve the original English sentences.
5. Do not rewrite the original English.
6. Translate naturally into Simplified Chinese.
7. Do not invent information.
8. Identify useful vocabulary rather than every word.
9. Identify important grammar structures.
10. Keep sentence order identical to the article.
11. Use the selected learner level to control explanation depth.
12. Estimate the article's actual CEFR level.
13. The "sentences" array should cover the article's sentences.
14. If a sentence has no important grammar, use an empty string.
15. Vocabulary should contain useful learning words.
16. Grammar should contain the most useful grammar structures.
17. Keep explanations concise but useful.
`;
}

export const ARTICLE_ANALYSIS_SYSTEM_PROMPT =
  buildArticleAnalysisPrompt(
    "intermediate"
  );

export const TRANSLATION_SYSTEM_PROMPT = `
You are a professional English-Chinese translator.

Translate the provided English text into natural Simplified Chinese.

Return ONLY valid JSON:

{
  "translation": "string"
}

Do not add explanations.
`;

export const WORD_ANALYSIS_SYSTEM_PROMPT = `
You are an expert English vocabulary teacher.

Analyze the provided English word.

Return ONLY valid JSON:

{
  "word": "string",
  "meaning": "string",
  "partOfSpeech": "string",
  "phonetic": "string",
  "example": "string",
  "exampleTranslation": "string",
  "difficulty": "A1 | A2 | B1 | B2 | C1 | C2"
}

Keep the explanation concise and suitable for English learners.
`;