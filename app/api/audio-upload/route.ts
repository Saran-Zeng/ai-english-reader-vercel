import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const articleId = formData.get("articleId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "没有收到音频文件",
        },
        { status: 400 }
      );
    }

    if (
      typeof articleId !== "string" ||
      !articleId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少文章 ID",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        {
          success: false,
          error: "请选择音频文件",
        },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: {
        id: articleId,
      },
      select: {
        id: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: "找不到对应的文章",
        },
        { status: 404 }
      );
    }

    const originalName = file.name || "audio.mp3";

    const safeName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");

    const pathname =
      `articles/${articleId}/${Date.now()}-${safeName}`;

    const blob = await put(
      pathname,
      file,
      {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    const updatedArticle =
      await prisma.article.update({
        where: {
          id: articleId,
        },
        data: {
          audioUrl: blob.url,
        },
        select: {
          id: true,
          audioUrl: true,
        },
      });

    return NextResponse.json({
      success: true,
      audioUrl: updatedArticle.audioUrl,
      fileName: originalName,
    });
  } catch (error) {
    console.error(
      "Audio upload error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "音频上传失败",
      },
      {
        status: 500,
      }
    );
  }
}
