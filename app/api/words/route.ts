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

    /**
     * 方案 1：
     * 直接使用 vocabularyId。
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
     * 方案 2：
     * 使用 articleId + word。
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

    const vocabulary =
      await prisma.vocabulary.findFirst({
        where: {
          articleId,
          word,
        },
      });

    if (!vocabulary) {
      return NextResponse.json(
        {
          success: false,
          error: `在当前文章中找不到生词「${word}」。`,
        },
        { status: 404 }
      );
    }

    if (vocabulary.saved) {
      return NextResponse.json({
        success: true,
        alreadySaved: true,
        word: vocabulary,
      });
    }

    const savedWord =
      await prisma.vocabulary.update({
        where: {
          id: vocabulary.id,
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

    console.log(
      `Vocabulary saved: ${savedWord.word} / article: ${savedWord.article.title}`
    );

    return NextResponse.json({
      success: true,
      word: savedWord,
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
 * 支持两种删除：
 *
 * 1. vocabularyId
 *    删除单个生词
 *
 * 2. articleId
 *    删除整个文章对应的生词本
 *
 * 注意：
 * 删除整个生词本并不会删除文章。
 * 只是把这篇文章下所有 vocabulary 的 saved
 * 从 true 改成 false。
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
     * 方案 1：删除整个文章对应的生词本
     * --------------------------------------------------
     */
    if (articleId && !vocabularyId && !word) {
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
     * 方案 2：删除单个生词
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
     * 方案 3：articleId + word
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
          word,
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