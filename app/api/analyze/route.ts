import { NextResponse } from "next/server";
import { analyzeEnglishArticle } from "@/lib/ai/deepseek";
import { prisma } from "@/lib/database/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const content =
      typeof body?.content === "string"
        ? body.content.trim()
        : "";

    const level =
      typeof body?.level === "string"
        ? body.level
        : "intermediate";

    const title =
      typeof body?.title === "string"
        ? body.title.trim()
        : "";

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "请输入英文文章。",
        },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "文章内容太短，请至少输入 10 个字符。",
        },
        { status: 400 }
      );
    }

    const validLevels = [
      "beginner",
      "intermediate",
      "advanced",
    ];

    const selectedLevel = validLevels.includes(level)
      ? level
      : "intermediate";

    const analysis = await analyzeEnglishArticle(
      content,
      selectedLevel,
      title
    );

    const article = await prisma.article.create({
      data: {
        title:
          title ||
          analysis.title ||
          "Untitled Article",

        content,

        translation:
          analysis.translation || null,

        summary:
          analysis.summary || null,

        level:
          analysis.level || selectedLevel,

        sentences: {
          create: Array.isArray(analysis.sentences)
            ? analysis.sentences
                .filter(
                  (sentence: {
                    english?: string;
                  }) =>
                    sentence?.english
                )
                .map(
                  (
                    sentence: {
                      english?: string;
                      translation?: string;
                      grammar?: string;
                      words?: {
                        word?: string;
                        meaning?: string;
                      }[];
                    },
                    index: number
                  ) => ({
                    english:
                      sentence.english || "",

                    translation:
                      sentence.translation ||
                      null,

                    grammar:
                      sentence.grammar || null,

                    order: index,

                    words: {
                      create:
                        Array.isArray(
                          sentence.words
                        )
                          ? sentence.words
                              .filter(
                                (
                                  word: {
                                    word?: string;
                                  }
                                ) => word?.word
                              )
                              .map(
                                (
                                  word: {
                                    word?: string;
                                    meaning?: string;
                                  }
                                ) => ({
                                  word:
                                    word.word || "",
                                  meaning:
                                    word.meaning ||
                                    null,
                                })
                              )
                          : [],
                    },
                  })
                )
            : [],
        },

        vocabulary: {
          create: Array.isArray(
            analysis.vocabulary
          )
            ? analysis.vocabulary
                .filter(
                  (item: {
                    word?: string;
                  }) => item?.word
                )
                .map(
                  (item: {
                    word?: string;
                    meaning?: string;
                    partOfSpeech?: string;
                    example?: string;
                  }) => ({
                    word: item.word || "",
                    meaning:
                      item.meaning || "",
                    partOfSpeech:
                      item.partOfSpeech ||
                      null,
                    example:
                      item.example || null,
                  })
                )
            : [],
        },

        grammar: {
          create: Array.isArray(
            analysis.grammar
          )
            ? analysis.grammar
                .filter(
                  (item: {
                    title?: string;
                  }) => item?.title
                )
                .map(
                  (item: {
                    title?: string;
                    explanation?: string;
                    example?: string;
                  }) => ({
                    title:
                      item.title || "",
                    explanation:
                      item.explanation ||
                      "",
                    example:
                      item.example || null,
                  })
                )
            : [],
        },
      },

      include: {
        sentences: {
          orderBy: {
            order: "asc",
          },
          include: {
            words: true,
          },
        },
        vocabulary: true,
        grammar: true,
      },
    });

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error) {
    console.error(
      "Article analysis error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 分析失败，请稍后再试。",
      },
      { status: 500 }
    );
  }
}