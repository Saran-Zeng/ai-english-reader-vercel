import { NextResponse } from "next/server";
import { analyzeEnglishArticle } from "@/lib/ai/deepseek";
import { prisma } from "@/lib/database/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const content = body?.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "请输入英文文章",
        },
        { status: 400 }
      );
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "文章内容太短",
        },
        { status: 400 }
      );
    }

    const analysis = await analyzeEnglishArticle(content);

    const article = await prisma.article.create({
      data: {
        title: analysis.title || "Untitled Article",
        content,
        translation: analysis.translation || null,
        summary: analysis.summary || null,
        level: analysis.level || null,

        sentences: {
          create: Array.isArray(analysis.sentences)
            ? analysis.sentences.map(
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
                  english: sentence.english || "",
                  translation: sentence.translation || null,
                  grammar: sentence.grammar || null,
                  order: index,

                  words: {
                    create: Array.isArray(sentence.words)
                      ? sentence.words
                          .filter((word) => word.word)
                          .map((word) => ({
                            word: word.word || "",
                            meaning: word.meaning || null,
                          }))
                      : [],
                  },
                })
              )
            : [],
        },

        vocabulary: {
          create: Array.isArray(analysis.vocabulary)
            ? analysis.vocabulary
                .filter((item: { word?: string }) => item.word)
                .map(
                  (item: {
                    word?: string;
                    meaning?: string;
                    partOfSpeech?: string;
                    example?: string;
                  }) => ({
                    word: item.word || "",
                    meaning: item.meaning || "",
                    partOfSpeech: item.partOfSpeech || null,
                    example: item.example || null,
                  })
                )
            : [],
        },

        grammar: {
          create: Array.isArray(analysis.grammar)
            ? analysis.grammar
                .filter((item: { title?: string }) => item.title)
                .map(
                  (item: {
                    title?: string;
                    explanation?: string;
                    example?: string;
                  }) => ({
                    title: item.title || "",
                    explanation: item.explanation || "",
                    example: item.example || null,
                  })
                )
            : [],
        },
      },

      include: {
        sentences: {
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
    console.error("Article analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 分析失败",
      },
      { status: 500 }
    );
  }
}