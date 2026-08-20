import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const articles = await prisma.article.findMany({
      where: search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                },
              },
              {
                content: {
                  contains: search,
                },
              },
            ],
          }
        : undefined,

      orderBy: {
        createdAt: "desc",
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
      articles,
    });
  } catch (error) {
    console.error(
      "Analysis history GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "获取 AI 分析历史失败",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id =
      typeof body?.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少文章 ID",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.article.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "文章不存在",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.article.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Analysis history DELETE error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "删除失败",
      },
      {
        status: 500,
      },
    );
  }
}