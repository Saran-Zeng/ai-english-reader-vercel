import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\.(mp3|wav|m4a|ogg|webm)$/i, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "")
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id") || "";

    const title =
      searchParams.get("title") || "";

    /*
     * =====================================================
     * 第一优先级：
     * 从数据库读取已经上传到 Vercel Blob 的音频
     * =====================================================
     */
    if (id) {
      const article =
        await prisma.article.findUnique({
          where: {
            id,
          },
          select: {
            audioUrl: true,
          },
        });

      if (
        article?.audioUrl &&
        typeof article.audioUrl ===
          "string"
      ) {
        return NextResponse.json({
          success: true,
          found: true,
          audioUrl: article.audioUrl,
          fileName:
            article.audioUrl
              .split("/")
              .pop() || "文章音频",
        });
      }
    }

    /*
     * =====================================================
     * 第二优先级：
     * 保留原来的 public/audio/articles 自动匹配
     *
     * 这样以前放在项目里的音频仍然可以继续使用。
     * =====================================================
     */
    const audioDirectory =
      path.join(
        process.cwd(),
        "public",
        "audio",
        "articles"
      );

    if (
      !fs.existsSync(
        audioDirectory
      )
    ) {
      return NextResponse.json({
        success: true,
        found: false,
        audioUrl: null,
      });
    }

    const files =
      fs
        .readdirSync(
          audioDirectory
        )
        .filter((file) =>
          /\.(mp3|wav|m4a|ogg|webm)$/i.test(
            file
          )
        );

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        found: false,
        audioUrl: null,
      });
    }

    const normalizedId =
      normalize(id);

    const normalizedTitle =
      normalize(title);

    let matchedFile:
      | string
      | null = null;

    if (normalizedId) {
      matchedFile =
        files.find(
          (file) =>
            normalize(file) ===
            normalizedId
        ) ||
        files.find(
          (file) =>
            normalize(
              file
            ).startsWith(
              normalizedId
            )
        ) ||
        null;
    }

    if (
      !matchedFile &&
      normalizedTitle
    ) {
      matchedFile =
        files.find(
          (file) =>
            normalize(file) ===
            normalizedTitle
        ) ||
        files.find(
          (file) =>
            normalize(
              file
            ).includes(
              normalizedTitle
            )
        ) ||
        null;
    }

    if (!matchedFile) {
      return NextResponse.json({
        success: true,
        found: false,
        audioUrl: null,
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      audioUrl:
        `/audio/articles/${encodeURIComponent(
          matchedFile
        )}`,
      fileName: matchedFile,
    });
  } catch (error) {
    console.error(
      "Audio match error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        found: false,
        audioUrl: null,
        error: "音频匹配失败",
      },
      {
        status: 500,
      }
    );
  }
}