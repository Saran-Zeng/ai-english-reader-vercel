import { NextResponse } from "next/server";
import {
  deepseek,
  DEEPSEEK_MODEL,
} from "@/lib/ai/deepseek";

const BASIC_WORDS: Record<
  string,
  {
    meaning: string;
    partOfSpeech: string;
    difficulty: string;
  }
> = {
  a: {
    meaning: "一个；一件",
    partOfSpeech: "冠词",
    difficulty: "A1",
  },
  an: {
    meaning: "一个；一件",
    partOfSpeech: "冠词",
    difficulty: "A1",
  },
  the: {
    meaning:
      "这；这个；这些；那个；那些",
    partOfSpeech: "冠词",
    difficulty: "A1",
  },
  am: {
    meaning: "是",
    partOfSpeech: "be 动词",
    difficulty: "A1",
  },
  is: {
    meaning: "是",
    partOfSpeech: "be 动词",
    difficulty: "A1",
  },
  are: {
    meaning: "是",
    partOfSpeech: "be 动词",
    difficulty: "A1",
  },
  was: {
    meaning: "是；曾经是",
    partOfSpeech: "be 动词",
    difficulty: "A1",
  },
  were: {
    meaning: "是；曾经是",
    partOfSpeech: "be 动词",
    difficulty: "A1",
  },
  be: {
    meaning: "是；成为",
    partOfSpeech: "be 动词",
    difficulty: "A1",
  },
  been: {
    meaning: "是；曾经是",
    partOfSpeech: "be 动词",
    difficulty: "A1",
  },
  i: {
    meaning: "我",
    partOfSpeech: "代词",
    difficulty: "A1",
  },
  you: {
    meaning: "你；你们",
    partOfSpeech: "代词",
    difficulty: "A1",
  },
  he: {
    meaning: "他",
    partOfSpeech: "代词",
    difficulty: "A1",
  },
  she: {
    meaning: "她",
    partOfSpeech: "代词",
    difficulty: "A1",
  },
  it: {
    meaning: "它；这",
    partOfSpeech: "代词",
    difficulty: "A1",
  },
  we: {
    meaning: "我们",
    partOfSpeech: "代词",
    difficulty: "A1",
  },
  they: {
    meaning:
      "他们；她们；它们",
    partOfSpeech: "代词",
    difficulty: "A1",
  },
  and: {
    meaning: "和；以及",
    partOfSpeech: "连词",
    difficulty: "A1",
  },
  or: {
    meaning: "或者；还是",
    partOfSpeech: "连词",
    difficulty: "A1",
  },
  but: {
    meaning: "但是",
    partOfSpeech: "连词",
    difficulty: "A1",
  },
  if: {
    meaning: "如果；是否",
    partOfSpeech: "连词",
    difficulty: "A1",
  },
  to: {
    meaning:
      "到；向；为了；不定式标记",
    partOfSpeech:
      "介词 / 不定式标记",
    difficulty: "A1",
  },
  of: {
    meaning: "……的；属于",
    partOfSpeech: "介词",
    difficulty: "A1",
  },
  in: {
    meaning:
      "在……里面；在……期间",
    partOfSpeech: "介词",
    difficulty: "A1",
  },
  on: {
    meaning: "在……上；关于",
    partOfSpeech: "介词",
    difficulty: "A1",
  },
  at: {
    meaning: "在；向",
    partOfSpeech: "介词",
    difficulty: "A1",
  },
  for: {
    meaning: "为了；对于",
    partOfSpeech: "介词",
    difficulty: "A1",
  },
  from: {
    meaning: "来自；从",
    partOfSpeech: "介词",
    difficulty: "A1",
  },
  with: {
    meaning: "和；与；带有",
    partOfSpeech: "介词",
    difficulty: "A1",
  },
  by: {
    meaning:
      "通过；被；在……旁边",
    partOfSpeech: "介词",
    difficulty: "A1",
  },
  can: {
    meaning: "能够；可以",
    partOfSpeech: "情态动词",
    difficulty: "A1",
  },
  could: {
    meaning:
      "能够；可以；可能",
    partOfSpeech: "情态动词",
    difficulty: "A2",
  },
  may: {
    meaning: "可能；可以",
    partOfSpeech: "情态动词",
    difficulty: "A2",
  },
  might: {
    meaning: "可能",
    partOfSpeech: "情态动词",
    difficulty: "B1",
  },
  must: {
    meaning: "必须；一定",
    partOfSpeech: "情态动词",
    difficulty: "A2",
  },
  should: {
    meaning: "应该",
    partOfSpeech: "情态动词",
    difficulty: "A2",
  },
  will: {
    meaning: "将；会",
    partOfSpeech: "情态动词",
    difficulty: "A1",
  },
  would: {
    meaning:
      "将会；愿意；会",
    partOfSpeech: "情态动词",
    difficulty: "A2",
  },
  do: {
    meaning: "做；进行",
    partOfSpeech:
      "动词 / 助动词",
    difficulty: "A1",
  },
  does: {
    meaning: "做；进行",
    partOfSpeech:
      "动词 / 助动词",
    difficulty: "A1",
  },
  did: {
    meaning: "做了；确实",
    partOfSpeech:
      "动词 / 助动词",
    difficulty: "A1",
  },
  not: {
    meaning: "不；没有",
    partOfSpeech: "副词",
    difficulty: "A1",
  },
};

function isValidEnglishWord(word: string) {
  return /^[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+(?:['’][A-Za-z]+)*)*$/.test(
    word
  );
}

function extractJson(text: string) {
  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    cleaned = cleaned.slice(
      firstBrace,
      lastBrace + 1
    );
  }

  return cleaned;
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const word =
      typeof body?.word === "string"
        ? body.word.trim()
        : "";

    const context =
      typeof body?.context === "string"
        ? body.context.trim()
        : "";

    if (!word) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少单词。",
        },
        { status: 400 }
      );
    }

    if (
      word.length > 80 ||
      !isValidEnglishWord(word)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "这个词无法进行分析。",
        },
        { status: 400 }
      );
    }

    const normalized =
      word.toLowerCase();

    /**
     * 基础词直接返回。
     *
     * 不调用 DeepSeek。
     */
    const basic =
      BASIC_WORDS[normalized];

    if (basic) {
      return NextResponse.json({
        success: true,
        word: {
          word,
          meaning: basic.meaning,
          partOfSpeech:
            basic.partOfSpeech,
          phonetic: null,
          example: null,
          exampleTranslation: null,
          difficulty: basic.difficulty,
          saved: false,
        },
      });
    }

    /**
     * 普通单词交给 DeepSeek。
     */
    const prompt = `
你现在是一个非常耐心的英语老师。

我要学习的英文单词是：

${word}

它出现在下面这篇英语文章中：

${context || "没有提供文章语境。"}

请根据这个单词在文章中的实际语境，为英语基础比较薄弱的学习者解释它。

要求：

1. 给出最适合当前语境的中文意思。
2. 给出词性。
3. 给出音标。
4. 给出一个简单、自然的英文例句。
5. 给出例句中文翻译。
6. 给出 CEFR 难度等级，例如 A1、A2、B1、B2、C1。
7. 不要长篇大论。
8. 中文解释要简单易懂。
9. 如果这个词有多个意思，只重点解释本文最可能的意思。

必须只返回 JSON：

{
  "word": "${word}",
  "meaning": "中文释义",
  "partOfSpeech": "词性",
  "phonetic": "/音标/",
  "example": "英文例句",
  "exampleTranslation": "中文翻译",
  "difficulty": "A1/A2/B1/B2/C1"
}
`;

    const completion =
      await deepseek.chat.completions.create(
        {
          model: DEEPSEEK_MODEL,
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful English teacher. Return valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }
      );

    const result =
      completion.choices[0]?.message?.content;

    if (!result) {
      throw new Error(
        "AI 没有返回单词解释。"
      );
    }

    const cleaned =
      extractJson(result);

    let parsed: any;

    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error(
        "Invalid word-analysis JSON:",
        result
      );

      throw new Error(
        "AI 返回的数据格式异常，请再次点击这个单词。"
      );
    }

    return NextResponse.json({
      success: true,
      word: {
        word:
          typeof parsed.word === "string"
            ? parsed.word
            : word,

        meaning:
          typeof parsed.meaning === "string"
            ? parsed.meaning
            : "暂无释义",

        partOfSpeech:
          typeof parsed.partOfSpeech ===
          "string"
            ? parsed.partOfSpeech
            : null,

        phonetic:
          typeof parsed.phonetic === "string"
            ? parsed.phonetic
            : null,

        example:
          typeof parsed.example === "string"
            ? parsed.example
            : null,

        exampleTranslation:
          typeof parsed.exampleTranslation ===
          "string"
            ? parsed.exampleTranslation
            : null,

        difficulty:
          typeof parsed.difficulty === "string"
            ? parsed.difficulty
            : null,

        saved: false,
      },
    });
  } catch (error) {
    console.error(
      "Word analysis error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "单词分析失败，请稍后再试。",
      },
      { status: 500 }
    );
  }
}