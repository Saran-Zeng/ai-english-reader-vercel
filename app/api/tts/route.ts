import { NextRequest } from "next/server";

const OPENAI_API_URL =
  "https://api.openai.com/v1/audio/speech";

const ALLOWED_VOICES = [
  "alloy",
  "ash",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
];

export async function POST(
  request: NextRequest
) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "没有找到 OPENAI_API_KEY。请在 .env.local 中配置 OpenAI API Key。",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const text =
      typeof body?.text === "string"
        ? body.text.trim()
        : "";

    const voice =
      typeof body?.voice === "string"
        ? body.voice
        : "nova";

    const speed =
      typeof body?.speed === "number"
        ? body.speed
        : 1;

    if (!text) {
      return Response.json(
        {
          error:
            "没有需要朗读的英文内容。",
        },
        {
          status: 400,
        }
      );
    }

    if (text.length > 5000) {
      return Response.json(
        {
          error:
            "单次朗读内容过长，请分段朗读。",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_VOICES.includes(
        voice
      )
    ) {
      return Response.json(
        {
          error:
            "不支持的语音类型。",
        },
        {
          status: 400,
        }
      );
    }

    const safeSpeed =
      Math.min(
        1.5,
        Math.max(
          0.75,
          speed
        )
      );

    const response =
      await fetch(
        OPENAI_API_URL,
        {
          method: "POST",
          headers: {
            "Authorization":
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model:
              "gpt-4o-mini-tts",
            voice,
            input: text,
            speed: safeSpeed,
            response_format:
              "mp3",
            instructions:
              "Read the English text naturally like a professional English audiobook narrator. Use natural pauses at commas, periods, semicolons, and question marks. Maintain clear pronunciation, gentle rhythm, natural sentence stress, and expressive intonation. Do not sound robotic. Do not add or remove words.",
          }),
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "OpenAI TTS error:",
        errorText
      );

      return Response.json(
        {
          error:
            "AI 语音服务调用失败，请检查 OpenAI API Key、账户余额以及 API 配置。",
        },
        {
          status:
            response.status >= 400 &&
            response.status < 600
              ? response.status
              : 500,
        }
      );
    }

    const audioBuffer =
      await response.arrayBuffer();

    return new Response(
      audioBuffer,
      {
        status: 200,
        headers: {
          "Content-Type":
            "audio/mpeg",
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "TTS route error:",
      error
    );

    return Response.json(
      {
        error:
          "AI 语音服务器发生错误，请稍后重试。",
      },
      {
        status: 500,
      }
    );
  }
}