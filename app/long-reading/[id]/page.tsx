"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";

type Word = {
  id: string;
  word: string;
  meaning: string | null;
};

type Sentence = {
  id: string;
  english: string;
  translation: string | null;
  order: number;
  words?: Word[];
};

type ReadingParagraph = {
  id: string;
  english: string;
  translation: string | null;
  order: number;
  words?: Word[];
};

type Article = {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  translation: string | null;
  summary: string | null;
  level: string | null;
  category: string | null;
  sentences: Sentence[];
};

type AudioState = {
  found: boolean;
  audioUrl: string | null;
  fileName: string;
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   工具函数
   ========================================================= */

function normalizeText(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 按原文章中的“空行”切分真正的文章段落。
 *
 * 支持：
 * Paragraph 1
 *
 * Paragraph 2
 *
 * Paragraph 3
 *
 * 如果文章只有普通换行，没有空行，
 * 则后面会使用句子进行智能组合。
 */
function splitArticleParagraphs(content: string) {
  if (!content.trim()) {
    return [];
  }

  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const blocks = normalized
    .split(/\n\s*\n+/)
    .map((block) =>
      block
        .replace(/[ \t]+/g, " ")
        .replace(/\n+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  return blocks;
}

/**
 * 如果原文没有明显空行，
 * 根据 AI 已经分析出的句子自动组合成较自然的段落。
 *
 * 这里不会把每一句直接当成一个段落。
 */
function buildFallbackParagraphs(
  sentences: Sentence[],
  content: string,
) {
  if (sentences.length === 0) {
    return splitArticleParagraphs(content);
  }

  const result: string[] = [];

  let current = "";
  let currentWords = 0;

  for (const sentence of sentences) {
    const text = sentence.english.trim();

    if (!text) continue;

    const sentenceWords = text
      .split(/\s+/)
      .filter(Boolean).length;

    /*
     * 大约 70～130 词形成一个阅读段。
     *
     * 这样 800 词左右的文章不会变成：
     * 800 个段落
     *
     * 而会比较接近：
     * 6～10 个自然阅读段。
     */
    if (
      current &&
      currentWords >= 70
    ) {
      result.push(current.trim());

      current = "";
      currentWords = 0;
    }

    current +=
      (current ? " " : "") + text;

    currentWords += sentenceWords;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * 根据真正的文章段落，把 AI sentence
 * 的中文翻译重新组合起来。
 *
 * 例如：
 *
 * 原文段落：
 * Sentence 1. Sentence 2. Sentence 3.
 *
 * AI：
 * sentence 1 -> 中文1
 * sentence 2 -> 中文2
 * sentence 3 -> 中文3
 *
 * 最终：
 * 段落中文 = 中文1 中文2 中文3
 */
function buildParagraphs(
  article: Article,
): ReadingParagraph[] {
  const sentences = [...article.sentences]
    .filter(
      (sentence) =>
        sentence.english?.trim(),
    )
    .sort(
      (a, b) =>
        a.order - b.order,
    );

  const contentBlocks =
    splitArticleParagraphs(
      article.content,
    );

  /*
   * 情况一：
   * 原文章本身有真正的空行。
   *
   * 这是最优情况。
   */
  if (contentBlocks.length > 1) {
    const result: ReadingParagraph[] =
      [];

    let sentenceIndex = 0;

    for (
      let blockIndex = 0;
      blockIndex < contentBlocks.length;
      blockIndex++
    ) {
      const block =
        contentBlocks[blockIndex];

      const blockNormalized =
        normalizeText(block);

      const matchedSentences: Sentence[] =
        [];

      let accumulated = "";

      /*
       * 尝试把 AI sentence 对应回
       * 当前原文章段落。
       */
      while (
        sentenceIndex <
        sentences.length
      ) {
        const sentence =
          sentences[sentenceIndex];

        const sentenceText =
          sentence.english.trim();

        const nextAccumulated =
          normalizeText(
            accumulated
              ? `${accumulated} ${sentenceText}`
              : sentenceText,
          );

        matchedSentences.push(
          sentence,
        );

        accumulated =
          nextAccumulated;

        sentenceIndex++;

        /*
         * 当前累计句子已经覆盖
         * 当前原文段落。
         */
        if (
          accumulated ===
            blockNormalized ||
          blockNormalized.startsWith(
            accumulated,
          ) === false
        ) {
          /*
           * 如果累计文本已经超过当前段落，
           * 回退最后一句。
           */
          if (
            accumulated !==
              blockNormalized &&
            matchedSentences.length >
              1
          ) {
            const last =
              matchedSentences.pop();

            if (last) {
              sentenceIndex--;
            }
          }

          break;
        }

        if (
          accumulated ===
          blockNormalized
        ) {
          break;
        }
      }

      const translation =
        matchedSentences
          .map(
            (sentence) =>
              sentence.translation?.trim(),
          )
          .filter(Boolean)
          .join(" ");

      const words =
        matchedSentences.flatMap(
          (sentence) =>
            sentence.words ?? [],
        );

      result.push({
        id:
          `paragraph-${blockIndex}`,
        english: block,
        translation:
          translation || null,
        order: blockIndex,
        words,
      });
    }

    /*
     * 如果因为原文格式异常，
     * 仍有 sentence 没被匹配，
     * 追加到最后。
     */
    if (
      sentenceIndex <
      sentences.length
    ) {
      const remaining =
        sentences
          .slice(sentenceIndex)
          .map(
            (sentence) =>
              sentence.english.trim(),
          )
          .filter(Boolean)
          .join(" ");

      const remainingTranslation =
        sentences
          .slice(sentenceIndex)
          .map(
            (sentence) =>
              sentence.translation?.trim(),
          )
          .filter(Boolean)
          .join(" ");

      if (remaining) {
        result.push({
          id:
            `paragraph-${result.length}`,
          english: remaining,
          translation:
            remainingTranslation ||
            null,
          order: result.length,
          words:
            sentences
              .slice(sentenceIndex)
              .flatMap(
                (sentence) =>
                  sentence.words ?? [],
              ),
        });
      }
    }

    return result;
  }

  /*
   * 情况二：
   * 原文章没有空行。
   *
   * 使用 AI sentence 自动组合段落。
   */
  if (sentences.length > 0) {
    const fallback =
      buildFallbackParagraphs(
        sentences,
        article.content,
      );

    const result: ReadingParagraph[] =
      [];

    let sentenceIndex = 0;

    fallback.forEach(
      (english, index) => {
        const normalizedBlock =
          normalizeText(english);

        const matched: Sentence[] =
          [];

        let accumulated = "";

        while (
          sentenceIndex <
          sentences.length
        ) {
          const sentence =
            sentences[sentenceIndex];

          const text =
            sentence.english.trim();

          const next =
            normalizeText(
              accumulated
                ? `${accumulated} ${text}`
                : text,
            );

          matched.push(sentence);

          accumulated = next;
          sentenceIndex++;

          if (
            accumulated.length >=
            normalizedBlock.length
          ) {
            break;
          }
        }

        result.push({
          id:
            `paragraph-${index}`,
          english,
          translation:
            matched
              .map(
                (sentence) =>
                  sentence.translation?.trim(),
              )
              .filter(Boolean)
              .join(" ") || null,
          order: index,
          words:
            matched.flatMap(
              (sentence) =>
                sentence.words ?? [],
            ),
        });
      },
    );

    return result;
  }

  /*
   * 情况三：
   * AI 没有 sentence 数据，
   * 直接使用原文章段落。
   */
  return contentBlocks.map(
    (english, index) => ({
      id:
        `paragraph-${index}`,
      english,
      translation: null,
      order: index,
      words: [],
    }),
  );
}

/* =========================================================
   页面
   ========================================================= */

export default function LongReadingDetailPage({
  params,
}: Props) {
  const [articleId, setArticleId] =
    useState<string | null>(null);

  const [article, setArticle] =
    useState<Article | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    params.then((value) => {
      if (!cancelled) {
        setArticleId(value.id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!articleId) return;

    const id = articleId;
    let cancelled = false;

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/articles/${encodeURIComponent(id)}`,
          {
            cache: "no-store",
          },
        );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof data?.error ===
              "string"
              ? data.error
              : "文章不存在",
          );
        }

        const rawArticle =
          data?.article ?? data;

        if (!rawArticle?.id) {
          throw new Error(
            "文章数据为空",
          );
        }

        const rawSentences =
          Array.isArray(
            rawArticle.sentences,
          )
            ? rawArticle.sentences
            : [];

        const sentences: Sentence[] =
          rawSentences
            .map(
              (
                sentence: Partial<Sentence>,
                index: number,
              ): Sentence => ({
                id:
                  typeof sentence.id ===
                  "string"
                    ? sentence.id
                    : `sentence-${index}`,

                english:
                  typeof sentence.english ===
                  "string"
                    ? sentence.english
                    : "",

                translation:
                  typeof sentence.translation ===
                  "string"
                    ? sentence.translation
                    : null,

                order:
                  typeof sentence.order ===
                  "number"
                    ? sentence.order
                    : index,

                words:
                  Array.isArray(
                    sentence.words,
                  )
                    ? sentence.words
                    : [],
              }),
            )
            .sort(
              (
                a: Sentence,
                b: Sentence,
              ) => a.order - b.order,
            );

        const normalized: Article = {
          id: rawArticle.id,

          title:
            typeof rawArticle.title ===
            "string"
              ? rawArticle.title
              : "Untitled Article",

          subtitle:
            typeof rawArticle.subtitle ===
            "string"
              ? rawArticle.subtitle
              : null,

          content:
            typeof rawArticle.content ===
            "string"
              ? rawArticle.content
              : "",

          translation:
            typeof rawArticle.translation ===
            "string"
              ? rawArticle.translation
              : null,

          summary:
            typeof rawArticle.summary ===
            "string"
              ? rawArticle.summary
              : null,

          level:
            typeof rawArticle.level ===
            "string"
              ? rawArticle.level
              : null,

          category:
            typeof rawArticle.category ===
            "string"
              ? rawArticle.category
              : null,

          sentences,
        };

        if (!cancelled) {
          setArticle(normalized);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "文章不存在，或者文章数据读取失败。",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f6fa]">
        <section className="mx-auto w-full max-w-4xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <div className="text-sm text-slate-500">
              正在加载文章...
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="min-h-screen bg-[#f4f6fa]">
        <section className="mx-auto w-full max-w-4xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <div className="text-4xl">
              📄
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              文章不存在
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              这篇文章可能已经被删除，
              或者文章数据读取失败。
            </p>

            <Link
              href="/long-reading"
              className="mt-7 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              返回长篇阅读
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <ReadingInterface
      article={article}
    />
  );
}

/* =========================================================
   阅读界面
   ========================================================= */

function ReadingInterface({
  article,
}: {
  article: Article;
}) {
  const [showChinese, setShowChinese] =
    useState(true);

  const [showFullTranslation, setShowFullTranslation] =
    useState(false);

  const [showFullReading, setShowFullReading] =
    useState(true);

  const [showParagraphReading, setShowParagraphReading] =
    useState(true);

  const [playing, setPlaying] =
    useState(false);

  const [currentParagraph, setCurrentParagraph] =
    useState<number | null>(null);

  const [audio, setAudio] =
    useState<AudioState>({
      found: false,
      audioUrl: null,
      fileName: "",
    });

  const [audioLoading, setAudioLoading] =
    useState(false);

  const [localAudioUrl, setLocalAudioUrl] =
    useState<string | null>(null);

  const [localAudioName, setLocalAudioName] =
    useState("");

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  /*
   * =====================================================
   * 最关键：
   *
   * 这里不再直接使用 article.sentences。
   *
   * 而是把真正的文章内容恢复成“段落”。
   * =====================================================
   */
  const paragraphs =
    useMemo(
      () =>
        buildParagraphs(article),
      [article],
    );

  useEffect(() => {
    let cancelled = false;

    async function findAudio() {
      try {
        setAudioLoading(true);

        const query =
          new URLSearchParams();

        query.set(
          "id",
          article.id,
        );

        query.set(
          "title",
          article.title,
        );

        const response = await fetch(
          `/api/audio-match?${query.toString()}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (!cancelled) {
          setAudio({
            found: Boolean(
              data?.found,
            ),

            audioUrl:
              typeof data?.audioUrl ===
              "string"
                ? data.audioUrl
                : null,

            fileName:
              typeof data?.fileName ===
              "string"
                ? data.fileName
                : "",
          });
        }
      } catch (error) {
        console.error(
          "Audio lookup failed:",
          error,
        );
      } finally {
        if (!cancelled) {
          setAudioLoading(false);
        }
      }
    }

    findAudio();

    return () => {
      cancelled = true;
    };
  }, [
    article.id,
    article.title,
  ]);

  async function handleAudioImport(
  event: ChangeEvent<HTMLInputElement>,
) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("audio/")) {
    alert(
      "请选择 MP3、WAV、M4A、OGG 等音频文件。"
    );

    event.target.value = "";
    return;
  }

  try {
    setAudioLoading(true);

    setLocalAudioName(file.name);

    const formData = new FormData();

    formData.append("file", file);
    formData.append("articleId", article.id);

    const response = await fetch(
      "/api/audio-upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data =
      await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.error ||
          "音频上传失败"
      );
    }

    /*
     * 上传成功以后，Vercel Blob
     * 返回一个真正可以长期访问的 URL。
     */
    const savedAudioUrl =
      typeof data.audioUrl ===
      "string"
        ? data.audioUrl
        : "";

    if (!savedAudioUrl) {
      throw new Error(
        "服务器没有返回音频地址"
      );
    }

    /*
     * 不再使用 URL.createObjectURL。
     *
     * 直接使用 Vercel Blob URL，
     * 这样刷新页面以后仍然存在。
     */
    if (localAudioUrl) {
      URL.revokeObjectURL(
        localAudioUrl
      );
    }

    setLocalAudioUrl(
      savedAudioUrl
    );

    setLocalAudioName(
      typeof data.fileName ===
        "string"
        ? data.fileName
        : file.name
    );

    /*
     * 同步更新当前页面里的 audio 状态，
     * 这样上传成功后马上就可以播放。
     */
    setAudio({
      found: true,
      audioUrl: savedAudioUrl,
      fileName:
        typeof data.fileName ===
        "string"
        ? data.fileName
        : file.name,
    });

    alert(
      "音频上传成功，已经永久保存。"
    );
  } catch (error) {
    console.error(
      "Audio import error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "音频上传失败，请稍后重试。"
    );
  } finally {
    setAudioLoading(false);

    /*
     * 允许再次选择同一个文件。
     */
    event.target.value = "";
  }
}

  function stopSpeaking() {
    if (
      typeof window !==
      "undefined"
    ) {
      window.speechSynthesis.cancel();
    }

    setPlaying(false);
    setCurrentParagraph(null);
  }

  function speakParagraph(
    index: number,
  ) {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const paragraph =
      paragraphs[index];

    if (!paragraph) return;

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        paragraph.english,
      );

    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setPlaying(true);
      setCurrentParagraph(index);
    };

    utterance.onend = () => {
      setPlaying(false);
      setCurrentParagraph(null);
    };

    utterance.onerror = () => {
      setPlaying(false);
      setCurrentParagraph(null);
    };

    window.speechSynthesis.speak(
      utterance,
    );
  }

  function speakAll() {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const text =
      paragraphs
        .map(
          (paragraph) =>
            paragraph.english,
        )
        .join("\n\n") ||
      article.content.trim();

    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text,
      );

    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setPlaying(true);
      setCurrentParagraph(null);
    };

    utterance.onend = () => {
      setPlaying(false);
      setCurrentParagraph(null);
    };

    utterance.onerror = () => {
      setPlaying(false);
      setCurrentParagraph(null);
    };

    window.speechSynthesis.speak(
      utterance,
    );
  }

  async function speakWithAI(
    text: string,
    index?: number,
  ) {
    try {
      stopSpeaking();

      setPlaying(true);

      if (
        index !== undefined
      ) {
        setCurrentParagraph(index);
      }

      const response =
        await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text,
            voice: "nova",
            speed: 0.9,
          }),
        });

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.error ||
            "AI 朗读失败",
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(blob);

      const audioElement =
        new Audio(url);

      audioRef.current =
        audioElement;

      audioElement.onended = () => {
        URL.revokeObjectURL(url);

        setPlaying(false);
        setCurrentParagraph(null);

        audioRef.current =
          null;
      };

      audioElement.onerror = () => {
        URL.revokeObjectURL(url);

        setPlaying(false);
        setCurrentParagraph(null);

        audioRef.current =
          null;
      };

      await audioElement.play();
    } catch (error) {
      console.error(error);

      setPlaying(false);
      setCurrentParagraph(null);

      alert(
        error instanceof Error
          ? error.message
          : "AI 朗读失败，请检查 API 配置。",
      );
    }
  }

  function stopAllAudio() {
    stopSpeaking();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }

  const wordCount =
    useMemo(() => {
      return paragraphs.reduce(
        (
          total,
          paragraph,
        ) =>
          total +
          paragraph.english
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length,
        0,
      );
    }, [paragraphs]);

  const fullAudioUrl =
    localAudioUrl ||
    audio.audioUrl ||
    null;

  return (
    <main className="long-reading-detail-page min-h-screen bg-[#f4f6fa] text-slate-900">

      {/* =================================================
          顶部导航
         ================================================= */}

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">

          <Link
            href="/long-reading"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600"
          >
            ← 长篇阅读
          </Link>

          <Link
            href="/"
            className="text-sm font-black tracking-tight text-slate-900 md:text-base"
          >
            AI English Reader
          </Link>

          <Link
            href="/reader"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            AI 阅读
          </Link>

        </div>
      </header>

      {/* =================================================
          阅读中心
         ================================================= */}

      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-12">

        {/* =================================================
            文章头部
           ================================================= */}

        <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)]">

          <div className="px-6 py-8 sm:px-8 md:px-12 md:py-11">

            {/* 标签 */}

            <div className="flex flex-wrap items-center justify-center gap-2">

              {article.level && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                  {article.level}
                </span>
              )}

              {article.category && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {article.category}
                </span>
              )}

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {paragraphs.length} 段
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                约 {wordCount} 词
              </span>

            </div>

            {/* 标题 */}

            <h1 className="mx-auto mt-6 max-w-3xl text-center text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-8 text-slate-500 md:text-lg">
                {article.subtitle}
              </p>
            )}

            {/* Summary */}

            {article.summary && (
              <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-left">

                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Article Summary
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  {article.summary}
                </p>

              </div>
            )}

            {/* 操作区 */}

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-7">

              <button
                onClick={speakAll}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
              >
                🔊 全文朗读
              </button>

              <button
                onClick={stopAllAudio}
                disabled={!playing}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ⏹ 停止朗读
              </button>

              <button
                onClick={() =>
                  setShowChinese(
                    (value) => !value,
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {showChinese
                  ? "🙈 隐藏中文"
                  : "👁 显示中文"}
              </button>

              {article.translation && (
                <button
                  onClick={() =>
                    setShowFullTranslation(
                      (value) => !value,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  {showFullTranslation
                    ? "隐藏全文翻译"
                    : "显示全文翻译"}
                </button>
              )}

            </div>

          </div>

          {/* =================================================
              全文阅读
             ================================================= */}

          <div className="border-t border-slate-100 bg-slate-50/60">

            <button
              type="button"
              onClick={() =>
                setShowFullReading(
                  (value) => !value,
                )
              }
              className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-slate-100/70 sm:px-8 md:px-12"
            >

              <div>
                <div className="text-sm font-black text-slate-900">
                  📖 全文阅读
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  阅读完整英文文章内容
                </div>
              </div>

              <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
                {showFullReading
                  ? "收起"
                  : "展开"}
              </span>

            </button>

            {showFullReading && (
              <div className="px-6 pb-7 sm:px-8 md:px-12 md:pb-11">

                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="h-7 w-1 rounded-full bg-blue-600" />

                    <h2 className="text-lg font-black text-slate-900">
                      English Text
                    </h2>

                  </div>

                  {/* =================================================
                      关键修改：
                      不再把整个 article.content 放进一个 div。
                      现在是真正的一个段落一个 <p>。
                     ================================================= */}

                  <div className="text-lg font-medium leading-9 text-slate-800 md:text-xl">

                    {paragraphs.map(
                      (
                        paragraph,
                        index,
                      ) => (
                        <p
                          key={
                            paragraph.id ||
                            `full-paragraph-${index}`
                          }
                          className="mb-8 last:mb-0"
                        >
                          {paragraph.english}
                        </p>
                      ),
                    )}

                  </div>

                </div>

              </div>
            )}

          </div>

          {/* =================================================
              原声音频
             ================================================= */}

          <div className="border-t border-slate-100 px-6 py-6 sm:px-8 md:px-12">

            <details className="group">

              <summary className="flex cursor-pointer list-none items-center justify-between">

                <div>

                  <div className="text-sm font-black text-slate-900">
                    🎧 原声音频
                  </div>

                  <div className="mt-1 text-xs text-slate-500">

                    {audioLoading
                      ? "正在查找与文章匹配的音频..."
                      : audio.found
                        ? `已匹配：${audio.fileName}`
                        : "没有自动匹配到音频，可以手动导入。"}

                  </div>

                </div>

                <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 transition group-open:rotate-180">
                  ↓
                </span>

              </summary>

              <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-5">

                {fullAudioUrl && (
                  <audio
                    controls
                    src={fullAudioUrl}
                    className="w-full"
                  />
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">

                  <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">

                    📥 导入音频

                    <input
                      type="file"
                      accept="audio/*"
                      onChange={
                        handleAudioImport
                      }
                      className="hidden"
                    />

                  </label>

                  {localAudioName && (
                    <span className="text-xs text-slate-500">
                      已导入：
                      {localAudioName}
                    </span>
                  )}

                </div>

              </div>

            </details>

          </div>

          {/* =================================================
              正在朗读
             ================================================= */}

          {playing && (
            <div className="border-t border-blue-100 bg-blue-50 px-6 py-4 text-sm font-bold text-blue-700 sm:px-8 md:px-12">

              🔊 正在朗读

              {currentParagraph !==
              null
                ? ` · 第 ${
                    currentParagraph + 1
                  } 段`
                : ""}

            </div>
          )}

          {/* =================================================
              全文中文翻译
             ================================================= */}

          {showFullTranslation &&
            article.translation && (
              <div className="border-t border-amber-100 bg-amber-50/50 px-6 py-7 sm:px-8 md:px-12">

                <div className="mx-auto max-w-3xl rounded-2xl border border-amber-100 bg-white/70 p-6">

                  <div className="mb-4 flex items-center gap-3">

                    <div className="h-7 w-1 rounded-full bg-amber-500" />

                    <h2 className="text-lg font-black text-slate-900">
                      全文中文翻译
                    </h2>

                  </div>

                  <p className="whitespace-pre-line text-base leading-8 text-slate-700">
                    {article.translation}
                  </p>

                </div>

              </div>
            )}

        </div>

        {/* =================================================
            逐段学习
           ================================================= */}

        <section className="mx-auto mt-8 w-full">

          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-lg font-black text-slate-900">
                📚 逐段学习
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                点击每一段进行朗读、翻译和精读。
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowParagraphReading(
                  (value) => !value,
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              {showParagraphReading
                ? "收起全部逐段内容"
                : "展开全部逐段内容"}
            </button>

          </div>

          {showParagraphReading && (
            <div className="space-y-5">

              {paragraphs.map(
                (
                  paragraph,
                  index,
                ) => {
                  const active =
                    currentParagraph ===
                    index;

                  return (
                    <article
                      key={
                        paragraph.id
                      }
                      className={`rounded-[22px] border bg-white p-6 shadow-sm transition-all md:p-8 ${
                        active
                          ? "border-blue-300 shadow-[0_8px_30px_rgba(37,99,235,0.10)] ring-2 ring-blue-100"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                      }`}
                    >

                      {/* 段落标题和按钮 */}

                      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

                        <div className="flex items-center gap-3">

                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500">
                            {index + 1}
                          </span>

                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Paragraph{" "}
                            {index + 1}
                          </span>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          <button
                            onClick={() =>
                              speakParagraph(
                                index,
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            🔊 朗读本段
                          </button>

                          <button
                            onClick={() =>
                              speakWithAI(
                                paragraph.english,
                                index,
                              )
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            ✓ AI朗读
                          </button>

                        </div>

                      </div>

                      {/* 英文段落 */}

                      <p className="text-lg font-semibold leading-9 text-slate-900 md:text-xl">
                        {paragraph.english}
                      </p>

                      {/* 中文 */}

                      {showChinese && (
                        <>
                          <div className="my-6 border-t border-dashed border-slate-200" />

                          <div>

                            <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                              中文翻译
                            </div>

                            {paragraph.translation ? (
                              <p className="text-base leading-8 text-slate-600">
                                {
                                  paragraph.translation
                                }
                              </p>
                            ) : (
                              <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-400">
                                本段暂无中文翻译
                              </div>
                            )}

                          </div>
                        </>
                      )}

                    </article>
                  );
                },
              )}

            </div>
          )}

        </section>

        {/* =================================================
            文章结束
           ================================================= */}

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">

          <p className="text-sm font-medium text-slate-500">
            🎉 已完成本篇文章阅读
          </p>

          <Link
            href="/long-reading"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            阅读其他文章
          </Link>

        </div>

      </section>

    </main>
  );
}