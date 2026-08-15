const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

export async function generateSpeech(
  text: string
): Promise<ArrayBuffer> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "alloy",
      input: text,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `TTS request failed: ${response.status} ${errorText}`
    );
  }

  return response.arrayBuffer();
}