import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少文章 ID",
        },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: {
        id,
      },
      include: {
        sentences: {
          include: {
            words: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        vocabulary: true,
        grammar: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: "文章不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error) {
    console.error("Get article error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "获取文章失败",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少文章 ID",
        },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: {
        id,
      },
    });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: "文章不存在",
        },
        { status: 404 }
      );
    }

    await prisma.article.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "文章已删除",
    });
  } catch (error) {
    console.error("Delete article error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "删除文章失败",
      },
      { status: 500 }
    );
  }
}