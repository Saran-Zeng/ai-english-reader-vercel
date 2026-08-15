export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  const normalized = normalizeText(text);

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}