import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

/**
 * GET
 *
 * 获取已经加入生词本的单词。
 *
 * 按文章进行分组。
 */
export async function GET() {
  try {
    const words = await prisma.vocabulary.findMany({
      where: {
        saved: true,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            level: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        {
          article: {
            createdAt: "desc",
          },
        },
        {
          word: "asc",
        },
      ],
    });

    const groups = new Map<
      string,
      {
        article: {
          id: string;
          title: string;
          level: string | null;
          createdAt: Date;
        };
        words: typeof words;
      }
    >();

    for (const word of words) {
      const articleId = word.article.id;

      if (!groups.has(articleId)) {
        groups.set(articleId, {
          article: word.article,
          words: [],
        });
      }

      groups.get(articleId)!.words.push(word);
    }

    return NextResponse.json({
      success: true,
      words,
      groups: Array.from(groups.values()),
    });
  } catch (error) {
    console.error("Get words error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "获取生词本失败",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * 将单词加入生词本。
 *
 * 支持三种情况：
 *
 * 1. vocabularyId
 *    已经存在 Vocabulary，只需要 saved=true
 *
 * 2. articleId + word
 *    当前文章中已经存在这个词，只需要 saved=true
 *
 * 3. articleId + word + meaning...
 *    当前文章中完全没有这个词。
 *    自动创建新的 Vocabulary，并加入生词本。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const vocabularyId =
      typeof body?.vocabularyId === "string"
        ? body.vocabularyId.trim()
        : "";

    const articleId =
      typeof body?.articleId === "string"
        ? body.articleId.trim()
        : "";

    const word =
      typeof body?.word === "string"
        ? body.word.trim()
        : "";

    const meaning =
      typeof body?.meaning === "string"
        ? body.meaning.trim()
        : "";

    const partOfSpeech =
      typeof body?.partOfSpeech === "string"
        ? body.partOfSpeech.trim()
        : "";

    const example =
      typeof body?.example === "string"
        ? body.example.trim()
        : "";

    /**
     * --------------------------------------------------
     * 方案 1：
     * 已经存在 vocabularyId。
     *
     * 这是原来的功能：
     * 从 AI 重点词汇区域加入生词本。
     * --------------------------------------------------
     */
    if (vocabularyId) {
      const vocabulary =
        await prisma.vocabulary.findUnique({
          where: {
            id: vocabularyId,
          },
        });

      if (!vocabulary) {
        return NextResponse.json(
          {
            success: false,
            error: "找不到这个生词。",
          },
          { status: 404 }
        );
      }

      const savedWord =
        await prisma.vocabulary.update({
          where: {
            id: vocabularyId,
          },
          data: {
            saved: true,
          },
          include: {
            article: {
              select: {
                id: true,
                title: true,
                level: true,
                createdAt: true,
              },
            },
          },
        });

      return NextResponse.json({
        success: true,
        word: savedWord,
      });
    }

    /**
     * --------------------------------------------------
     * 下面是新的“全文点击单词”功能。
     *
     * 必须有 articleId。
     * --------------------------------------------------
     */
    if (!articleId) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少文章 ID",
        },
        { status: 400 }
      );
    }

    if (!word) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少生词",
        },
        { status: 400 }
      );
    }

    /**
     * --------------------------------------------------
     * 确认文章存在
     * --------------------------------------------------
     */
    const article =
      await prisma.article.findUnique({
        where: {
          id: articleId,
        },
        select: {
          id: true,
          title: true,
          level: true,
          createdAt: true,
        },
      });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: "当前文章不存在。",
        },
        { status: 404 }
      );
    }

    /**
     * --------------------------------------------------
     * 查找当前文章中是否已经存在这个单词。
     *
     * 注意：
     * 不要求这个词一定是 AI 原来挑出来的重点词。
     *
     * 如果 AI 原来已经创建过 Vocabulary，
     * 我们直接复用。
     * --------------------------------------------------
     */
    const vocabulary =
      await prisma.vocabulary.findFirst({
        where: {
          articleId,
          word: {
            equals: word,
            mode: "insensitive",
          },
        },
      });

    /**
     * --------------------------------------------------
     * 情况 A：
     * 当前文章中已经存在这个词。
     * --------------------------------------------------
     */
    if (vocabulary) {
      /**
       * 已经加入过生词本。
       */
      if (vocabulary.saved) {
        return NextResponse.json({
          success: true,
          alreadySaved: true,
          word: vocabulary,
        });
      }

      /**
       * 存在，但还没有加入生词本。
       *
       * 设置 saved=true。
       *
       * 如果这次点击 AI 查询到了更完整的信息，
       * 同时补充 meaning / partOfSpeech / example。
       */
      const savedWord =
        await prisma.vocabulary.update({
          where: {
            id: vocabulary.id,
          },
          data: {
            saved: true,

            ...(meaning
              ? {
                  meaning,
                }
              : {}),

            ...(partOfSpeech
              ? {
                  partOfSpeech,
                }
              : {}),

            ...(example
              ? {
                  example,
                }
              : {}),
          },
          include: {
            article: {
              select: {
                id: true,
                title: true,
                level: true,
                createdAt: true,
              },
            },
          },
        });

      console.log(
        `Vocabulary saved: ${savedWord.word} / article: ${savedWord.article.title}`
      );

      return NextResponse.json({
        success: true,
        word: savedWord,
      });
    }

    /**
     * --------------------------------------------------
     * 情况 B：
     *
     * 数据库中完全没有这个词。
     *
     * 这就是这次新增的核心功能：
     *
     * 用户在文章里点击一个 AI 原本没有分析过的词
     * ↓
     * AI 返回释义
     * ↓
     * 用户点击“加入生词本”
     * ↓
     * 这里直接创建 Vocabulary
     * --------------------------------------------------
     */
    const newWord =
      await prisma.vocabulary.create({
        data: {
          articleId,

          word,

          meaning:
            meaning || "暂无释义",

          partOfSpeech:
            partOfSpeech || null,

          example:
            example || null,

          saved: true,
        },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              level: true,
              createdAt: true,
            },
          },
        },
      });

    console.log(
      `New vocabulary saved: ${newWord.word} / article: ${newWord.article.title}`
    );

    return NextResponse.json({
      success: true,
      created: true,
      word: newWord,
    });
  } catch (error) {
    console.error("Save word error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "添加生词失败",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 *
 * 支持三种删除方式：
 *
 * 1. vocabularyId
 *    删除单个生词
 *
 * 2. articleId
 *    删除整篇文章对应的生词本
 *
 * 3. articleId + word
 *    删除指定文章中的指定单词
 *
 * 注意：
 * 这里不会真的删除 Vocabulary。
 *
 * 只是：
 *
 * saved: true
 *      ↓
 * saved: false
 *
 * 所以以后重新点击这个词，
 * 仍然可以再次加入生词本。
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const vocabularyId =
      typeof body?.vocabularyId === "string"
        ? body.vocabularyId.trim()
        : "";

    const articleId =
      typeof body?.articleId === "string"
        ? body.articleId.trim()
        : "";

    const word =
      typeof body?.word === "string"
        ? body.word.trim()
        : "";

    /**
     * --------------------------------------------------
     * 方案 1：
     *
     * 删除整篇文章对应的生词本。
     *
     * 不删除文章。
     * 不删除 Vocabulary。
     *
     * 只把 saved 改成 false。
     * --------------------------------------------------
     */
    if (
      articleId &&
      !vocabularyId &&
      !word
    ) {
      const result =
        await prisma.vocabulary.updateMany({
          where: {
            articleId,
            saved: true,
          },
          data: {
            saved: false,
          },
        });

      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: "笔记本已删除",
      });
    }

    /**
     * --------------------------------------------------
     * 方案 2：
     *
     * 删除单个生词。
     * --------------------------------------------------
     */
    if (vocabularyId) {
      const vocabulary =
        await prisma.vocabulary.update({
          where: {
            id: vocabularyId,
          },
          data: {
            saved: false,
          },
        });

      return NextResponse.json({
        success: true,
        word: vocabulary,
      });
    }

    /**
     * --------------------------------------------------
     * 方案 3：
     *
     * articleId + word
     *
     * 删除指定文章中的指定单词。
     * --------------------------------------------------
     */
    if (!articleId || !word) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少生词 ID",
        },
        { status: 400 }
      );
    }

    const vocabulary =
      await prisma.vocabulary.findFirst({
        where: {
          articleId,
          word: {
            equals: word,
            mode: "insensitive",
          },
        },
      });

    if (!vocabulary) {
      return NextResponse.json(
        {
          success: false,
          error: "找不到这个生词。",
        },
        { status: 404 }
      );
    }

    const deletedWord =
      await prisma.vocabulary.update({
        where: {
          id: vocabulary.id,
        },
        data: {
          saved: false,
        },
      });

    return NextResponse.json({
      success: true,
      word: deletedWord,
    });
  } catch (error) {
    console.error("Delete word error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "删除失败",
      },
      { status: 500 }
    );
  }
}