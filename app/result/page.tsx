"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Word = {
  id?: string;
  word: string;
  meaning?: string | null;
};

type Sentence = {
  id: string;
  english: string;
  translation?: string | null;
  grammar?: string | null;
  order?: number;
  words?: Word[];
};

type Vocabulary = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech?: string | null;
  example?: string | null;
};

type Grammar = {
  id: string;
  title: string;
  explanation: string;
  example?: string | null;
};

type Article = {
  id: string;
  title: string;
  content: string;
  translation?: string | null;
  summary?: string | null;
  level?: string | null;
  createdAt?: string;
  sentences: Sentence[];
  vocabulary: Vocabulary[];
  grammar: Grammar[];
};

export default function ResultPage() {
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeSentence, setActiveSentence] =
    useState<string | null>(null);

  const [activeWord, setActiveWord] =
    useState<string | null>(null);

  const [showTranslation, setShowTranslation] =
    useState(false);

  const [expandedVocabulary, setExpandedVocabulary] =
    useState<string | null>(null);

  const [expandedGrammar, setExpandedGrammar] =
    useState<string | null>(null);

  const [addedWords, setAddedWords] =
    useState<string[]>([]);

  const [addingWord, setAddingWord] =
    useState<string | null>(null);

  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const id = params.get("id");

    if (!id) {
      setError("没有找到文章 ID。");
      setLoading(false);
      return;
    }

    loadArticle(id);
  }, []);

  async function loadArticle(id: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/articles/${encodeURIComponent(id)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "文章不存在。"
        );
      }

      setArticle(data.article);
    } catch (err) {
      console.error("Load article error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "无法加载文章。"
      );
    } finally {
      setLoading(false);
    }
  }

  const sentences = article?.sentences || [];
  const vocabulary = article?.vocabulary || [];
  const grammar = article?.grammar || [];

  const sentenceText = useMemo(
    () =>
      sentences
        .map((sentence) => sentence.english)
        .join(" "),
    [sentences]
  );

  function handleSpeak() {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !article
    ) {
      return;
    }

    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const text =
      sentenceText || article.content;

    if (!text.trim()) {
      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    window.speechSynthesis.speak(utterance);
  }

  async function addWordToNotes(item: Vocabulary) {
    if (!article) {
      return;
    }

    if (addedWords.includes(item.word)) {
      return;
    }

    try {
      setAddingWord(item.word);

      const response = await fetch("/api/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: item.word,
          meaning: item.meaning,
          partOfSpeech: item.partOfSpeech || null,
          example: item.example || null,

          /*
           * 关键：
           * 把当前文章 ID 一起保存。
           * 这样生词本才能按照文章归类。
           */
          articleId: article.id,
          articleTitle: article.title,
        }),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "加入生词本失败。"
        );
      }

      setAddedWords((current) => [
        ...current,
        item.word,
      ]);
    } catch (err) {
      console.error("Add word error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "加入生词本失败，请稍后再试。"
      );
    } finally {
      setAddingWord(null);
    }
  }

  if (loading) {
    return (
      <main className="result-page">
        <div className="result-container">
          <div className="loading-card">
            <div className="loading-spinner" />

            <h2>正在加载分析结果</h2>

            <p>
              AI 正在准备你的学习内容...
            </p>
          </div>
        </div>

        <style jsx>{`
          .result-page {
            min-height: 100vh;
            background: #f7f8fc;
            padding: 70px 20px;
          }

          .result-container {
            width: min(1000px, 100%);
            margin: 0 auto;
          }

          .loading-card {
            min-height: 320px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 22px;
            background: #fff;
            border: 1px solid #e8eaf0;
          }

          .loading-spinner {
            width: 34px;
            height: 34px;
            border: 3px solid #e4e6ef;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .loading-card h2 {
            margin: 20px 0 6px;
            font-size: 19px;
          }

          .loading-card p {
            margin: 0;
            color: #9297a3;
            font-size: 13px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="result-page">
        <div className="result-container">
          <div className="error-card">
            <div className="error-icon">!</div>

            <h2>无法打开文章</h2>

            <p>
              {error || "文章不存在。"}
            </p>

            <div className="error-actions">
              <button
                onClick={() =>
                  router.push("/reader")
                }
              >
                返回阅读器
              </button>

              <button
                onClick={() =>
                  router.push("/articles")
                }
              >
                查看历史文章
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .result-page {
            min-height: 100vh;
            background: #f7f8fc;
            padding: 70px 20px;
          }

          .result-container {
            width: min(1000px, 100%);
            margin: 0 auto;
          }

          .error-card {
            padding: 50px 30px;
            text-align: center;
            border-radius: 22px;
            background: #fff;
            border: 1px solid #e8eaf0;
          }

          .error-icon {
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #fee2e2;
            color: #dc2626;
            font-weight: 900;
          }

          .error-card h2 {
            margin: 18px 0 8px;
          }

          .error-card p {
            color: #888e9a;
          }

          .error-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 22px;
          }

          .error-actions button {
            border: 1px solid #dfe2e9;
            background: #fff;
            border-radius: 10px;
            padding: 10px 15px;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="result-page">
      <div className="result-container">
        <header className="result-header">
          <div>
            <div className="result-badge">
              AI ENGLISH READER
            </div>

            <h1>
              {article.title || "英语文章分析"}
            </h1>

            <div className="article-meta">
              <span>
                {article.level || "English"}
              </span>

              <span>·</span>

              <span>
                {sentences.length} 个句子
              </span>

              <span>·</span>

              <span>
                {vocabulary.length} 个重点词汇
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="secondary-action"
              onClick={() =>
                router.push("/articles")
              }
            >
              历史文章
            </button>

            <button
              className="secondary-action"
              onClick={() =>
                router.push("/reader")
              }
            >
              新文章
            </button>
          </div>
        </header>

        <section className="summary-card">
          <div className="summary-icon">✓</div>

          <div>
            <div className="summary-label">
              AI SUMMARY
            </div>

            <p>
              {article.summary ||
                "这篇文章已经完成 AI 分析。"}
            </p>
          </div>
        </section>

        <section className="result-card">
          <div className="card-header">
            <div>
              <span className="card-number">
                01
              </span>

              <div>
                <h2>📖 原文</h2>

                <p>
                  完整阅读原始英文文章
                </p>
              </div>
            </div>

            <div className="header-buttons">
              <button
                className="translation-toggle"
                onClick={() =>
                  setShowTranslation(
                    !showTranslation
                  )
                }
              >
                {showTranslation
                  ? "隐藏翻译"
                  : "显示翻译"}
              </button>

              <button
                className={`speak-button ${
                  playing
                    ? "speak-playing"
                    : ""
                }`}
                onClick={handleSpeak}
              >
                {playing
                  ? "⏹ 停止朗读"
                  : "🔊 朗读"}
              </button>
            </div>
          </div>

          <div className="article-full-text">
            <div className="article-full-label">
              ORIGINAL ARTICLE
            </div>

            <div className="article-full-content">
              {article.content}
            </div>
          </div>

          {showTranslation && (
            <div className="inline-translation">
              <div className="inline-translation-label">
                CHINESE TRANSLATION
              </div>

              <div>
                {article.translation ||
                  "暂无中文翻译。"}
              </div>
            </div>
          )}

          <div className="article-divider">
            <span>逐句学习</span>
          </div>

          <div className="article-content">
            {sentences.length > 0 ? (
              sentences.map(
                (sentence, index) => {
                  const active =
                    activeSentence ===
                    sentence.id;

                  return (
                    <div
                      key={sentence.id}
                      className={`sentence-item ${
                        active
                          ? "sentence-active"
                          : ""
                      }`}
                      onClick={() =>
                        setActiveSentence(
                          active
                            ? null
                            : sentence.id
                        )
                      }
                    >
                      <div className="sentence-number">
                        {index + 1}
                      </div>

                      <div className="sentence-body">
                        <div className="sentence-english">
                          {sentence.english}
                        </div>

                        {showTranslation &&
                          sentence.translation && (
                            <div className="sentence-translation">
                              {
                                sentence.translation
                              }
                            </div>
                          )}

                        {active && (
                          <div className="sentence-detail">
                            {sentence.grammar && (
                              <div className="detail-block">
                                <strong>
                                  📚 语法
                                </strong>

                                <p>
                                  {
                                    sentence.grammar
                                  }
                                </p>
                              </div>
                            )}

                            {sentence.words &&
                              sentence.words.length >
                                0 && (
                                <div className="sentence-words">
                                  {sentence.words.map(
                                    (
                                      word,
                                      wordIndex
                                    ) => (
                                      <button
                                        key={
                                          word.id ||
                                          `${word.word}-${wordIndex}`
                                        }
                                        className={`mini-word ${
                                          activeWord ===
                                          word.word
                                            ? "mini-word-active"
                                            : ""
                                        }`}
                                        onClick={(
                                          event
                                        ) => {
                                          event.stopPropagation();

                                          setActiveWord(
                                            activeWord ===
                                              word.word
                                              ? null
                                              : word.word
                                          );
                                        }}
                                      >
                                        {word.word}

                                        {activeWord ===
                                          word.word &&
                                          word.meaning && (
                                            <span>
                                              {" "}
                                              —{" "}
                                              {
                                                word.meaning
                                              }
                                            </span>
                                          )}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      <div className="sentence-arrow">
                        {active ? "⌃" : "›"}
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <div className="plain-content">
                {article.content}
              </div>
            )}
          </div>
        </section>

        <section className="result-card">
          <div className="card-header">
            <div>
              <span className="card-number">
                02
              </span>

              <div>
                <h2>🇨🇳 中文翻译</h2>

                <p>
                  AI 根据上下文生成的自然中文理解
                </p>
              </div>
            </div>
          </div>

          <div className="translation-content">
            {article.translation ||
              "暂无中文翻译。"}
          </div>
        </section>

        <section className="result-card">
          <div className="card-header">
            <div>
              <span className="card-number">
                03
              </span>

              <div>
                <h2>📚 重点词汇</h2>

                <p>
                  点击单词查看详细解释，并可加入生词本
                </p>
              </div>
            </div>

            <span className="count-badge">
              {vocabulary.length}
            </span>
          </div>

          {vocabulary.length > 0 ? (
            <div className="vocabulary-list">
              {vocabulary.map((item) => {
                const expanded =
                  expandedVocabulary ===
                  item.id;

                const added =
                  addedWords.includes(item.word);

                const adding =
                  addingWord === item.word;

                return (
                  <div
                    key={item.id}
                    className="vocabulary-item"
                  >
                    <button
                      className="vocabulary-main"
                      onClick={() =>
                        setExpandedVocabulary(
                          expanded
                            ? null
                            : item.id
                        )
                      }
                    >
                      <div className="vocabulary-word">
                        <strong>
                          {item.word}
                        </strong>

                        {item.partOfSpeech && (
                          <span className="part-of-speech">
                            {item.partOfSpeech}
                          </span>
                        )}
                      </div>

                      <span className="vocabulary-arrow">
                        {expanded ? "⌃" : "+"}
                      </span>
                    </button>

                    {expanded && (
                      <div className="vocabulary-detail">
                        {item.meaning && (
                          <div>
                            <strong>
                              中文释义
                            </strong>

                            <p>
                              {item.meaning}
                            </p>
                          </div>
                        )}

                        {item.example && (
                          <div>
                            <strong>
                              例句
                            </strong>

                            <p className="example-text">
                              {item.example}
                            </p>
                          </div>
                        )}

                        <button
                          className={`add-word-button ${
                            added ? "added" : ""
                          }`}
                          disabled={
                            added || adding
                          }
                          onClick={(event) => {
                            event.stopPropagation();

                            addWordToNotes(item);
                          }}
                        >
                          {adding
                            ? "正在加入..."
                            : added
                              ? "✓ 已加入生词本"
                              : "＋ 加入生词本"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="暂无重点词汇。" />
          )}
        </section>

        <section className="result-card">
          <div className="card-header">
            <div>
              <span className="card-number">
                04
              </span>

              <div>
                <h2>📘 语法分析</h2>

                <p>
                  AI 从文章中提取的重要语法结构
                </p>
              </div>
            </div>

            <span className="count-badge">
              {grammar.length}
            </span>
          </div>

          {grammar.length > 0 ? (
            <div className="grammar-list">
              {grammar.map(
                (item, index) => {
                  const expanded =
                    expandedGrammar ===
                    item.id;

                  return (
                    <div
                      key={item.id}
                      className="grammar-item"
                    >
                      <button
                        className="grammar-main"
                        onClick={() =>
                          setExpandedGrammar(
                            expanded
                              ? null
                              : item.id
                          )
                        }
                      >
                        <div className="grammar-title">
                          <span>
                            {index + 1}
                          </span>

                          <strong>
                            {item.title}
                          </strong>
                        </div>

                        <span className="grammar-arrow">
                          {expanded ? "⌃" : "+"}
                        </span>
                      </button>

                      {expanded && (
                        <div className="grammar-detail">
                          {item.explanation && (
                            <div>
                              <strong>
                                语法解释
                              </strong>

                              <p>
                                {
                                  item.explanation
                                }
                              </p>
                            </div>
                          )}

                          {item.example && (
                            <div>
                              <strong>
                                原文例句
                              </strong>

                              <p className="grammar-example">
                                {item.example}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <EmptyState text="暂无语法分析。" />
          )}
        </section>

        <section className="teacher-card">
          <div className="teacher-avatar">
            👨‍🏫
          </div>

          <div className="teacher-content">
            <div className="teacher-label">
              AI ENGLISH TEACHER
            </div>

            <h2>👨‍🏫 AI 老师建议</h2>

            <p>
              这篇文章已经完成 AI 分析。
              建议你先阅读英文原文，再点击不熟悉的句子查看句子结构，
              最后把重要词汇加入生词本进行复习。
            </p>

            <div className="teacher-tips">
              <div>
                <span>01</span>
                先读英文，不看翻译
              </div>

              <div>
                <span>02</span>
                点击复杂句子理解结构
              </div>

              <div>
                <span>03</span>
                把重点词汇加入生词本
              </div>

              <div>
                <span>04</span>
                最后听一遍全文朗读
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .result-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(99, 102, 241, 0.07),
              transparent 35rem
            ),
            #f7f8fc;
          color: #191c26;
          padding: 45px 20px 90px;
        }

        .result-container {
          width: min(1000px, 100%);
          margin: 0 auto;
        }

        .result-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 28px;
        }

        .result-badge {
          display: inline-block;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 0.08);
          color: #4f46e5;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
          margin-bottom: 12px;
        }

        .result-header h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.1;
          letter-spacing: -0.04em;
        }

        .article-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 12px;
          color: #858b98;
          font-size: 12px;
        }

        .header-actions,
        .header-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .secondary-action,
        .translation-toggle,
        .speak-button {
          height: 40px;
          padding: 0 13px;
          border: 1px solid #dfe2e9;
          border-radius: 10px;
          background: #fff;
          color: #555b68;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .speak-button {
          border-color: #d9d8ff;
          color: #4f46e5;
          background: #f8f8ff;
        }

        .speak-playing {
          background: #eef0ff;
          border-color: #bfc3ff;
        }

        .summary-card {
          display: flex;
          gap: 15px;
          align-items: flex-start;
          padding: 22px;
          margin-bottom: 18px;
          border-radius: 18px;
          background: #181a24;
          color: #fff;
        }

        .summary-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          color: #c7d2fe;
        }

        .summary-label {
          color: #aeb2bd;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .summary-card p {
          margin: 8px 0 0;
          color: #e7e8ed;
          font-size: 14px;
          line-height: 1.7;
        }

        .result-card {
          margin-bottom: 18px;
          border: 1px solid #e8eaf0;
          border-radius: 19px;
          background: #fff;
          overflow: hidden;
          box-shadow: 0 7px 28px rgba(22, 28, 45, 0.035);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 23px 25px;
          border-bottom: 1px solid #eef0f4;
        }

        .card-header > div:first-child {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .card-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border-radius: 10px;
          background: #f0f1f7;
          color: #6366f1;
          font-size: 11px;
          font-weight: 900;
        }

        .card-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .card-header p {
          margin: 5px 0 0;
          color: #9297a3;
          font-size: 11px;
        }

        .article-full-text {
          padding: 25px;
          background: #fbfbfd;
          border-bottom: 1px solid #eef0f4;
        }

        .article-full-label,
        .inline-translation-label {
          margin-bottom: 12px;
          color: #6366f1;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        .article-full-content {
          white-space: pre-line;
          color: #292d38;
          font-size: 15px;
          line-height: 1.9;
        }

        .inline-translation {
          padding: 20px 25px;
          background: #f8f8ff;
          color: #555b68;
          font-size: 14px;
          line-height: 1.9;
          white-space: pre-line;
          border-bottom: 1px solid #eef0f4;
        }

        .article-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 25px 5px;
          color: #9297a3;
          font-size: 11px;
          font-weight: 800;
        }

        .article-content {
          padding: 9px 0;
        }

        .sentence-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 17px 25px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .sentence-item:hover {
          background: #fafaff;
        }

        .sentence-active {
          background: #f8f8ff;
        }

        .sentence-number {
          width: 25px;
          padding-top: 3px;
          color: #a3a8b3;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .sentence-body {
          flex: 1;
          min-width: 0;
        }

        .sentence-english {
          color: #292d38;
          font-size: 15px;
          line-height: 1.8;
        }

        .sentence-translation {
          margin-top: 7px;
          color: #8a909c;
          font-size: 13px;
          line-height: 1.65;
        }

        .sentence-arrow {
          width: 24px;
          color: #a3a8b3;
          text-align: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .sentence-detail {
          margin-top: 15px;
          padding: 15px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #e7e9f0;
        }

        .detail-block strong {
          font-size: 12px;
          color: #565c69;
        }

        .detail-block p {
          margin: 6px 0 0;
          color: #747a87;
          font-size: 12px;
          line-height: 1.7;
        }

        .sentence-words {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 13px;
        }

        .mini-word {
          border: 1px solid #dfe2eb;
          border-radius: 8px;
          padding: 6px 9px;
          background: #fff;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .mini-word-active {
          background: #eef0ff;
          border-color: #bfc3ff;
        }

        .plain-content,
        .translation-content {
          padding: 25px;
          white-space: pre-line;
          color: #555b68;
          font-size: 14px;
          line-height: 1.9;
        }

        .count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          border-radius: 999px;
          background: #f1f2f7;
          color: #666c79;
          font-size: 11px;
          font-weight: 800;
        }

        .vocabulary-list,
        .grammar-list {
          padding: 8px 20px 18px;
        }

        .vocabulary-item,
        .grammar-item {
          border-bottom: 1px solid #eef0f4;
        }

        .vocabulary-item:last-child,
        .grammar-item:last-child {
          border-bottom: 0;
        }

        .vocabulary-main,
        .grammar-main {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 17px 5px;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        .vocabulary-word {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vocabulary-word strong {
          color: #2d313b;
          font-size: 14px;
        }

        .part-of-speech {
          padding: 4px 7px;
          border-radius: 6px;
          background: #f1f2f7;
          color: #7c8290;
          font-size: 10px;
        }

        .vocabulary-arrow,
        .grammar-arrow {
          color: #9ba0ab;
          font-size: 19px;
        }

        .vocabulary-detail,
        .grammar-detail {
          margin: 0 5px 14px;
          padding: 15px;
          border-radius: 11px;
          background: #f8f9fb;
        }

        .vocabulary-detail > div + div,
        .grammar-detail > div + div {
          margin-top: 12px;
        }

        .vocabulary-detail strong,
        .grammar-detail strong {
          font-size: 11px;
          color: #666c78;
        }

        .vocabulary-detail p,
        .grammar-detail p {
          margin: 5px 0 0;
          color: #757b87;
          font-size: 12px;
          line-height: 1.7;
        }

        .example-text,
        .grammar-example {
          font-style: italic;
          color: #555b68 !important;
        }

        .add-word-button {
          margin-top: 14px;
          padding: 9px 13px;
          border: 1px solid #dcdfff;
          border-radius: 9px;
          background: #f7f7ff;
          color: #6366f1;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .add-word-button:disabled {
          cursor: default;
          opacity: 0.85;
        }

        .add-word-button.added {
          border-color: #ccebd9;
          background: #effbf4;
          color: #159447;
        }

        .grammar-title {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .grammar-title span {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #f0f1f7;
          color: #6366f1;
          font-size: 10px;
          font-weight: 900;
        }

        .grammar-title strong {
          color: #30343e;
          font-size: 13px;
        }

        .empty-state {
          padding: 35px;
          text-align: center;
          color: #999eaa;
          font-size: 13px;
        }

        .teacher-card {
          display: flex;
          gap: 17px;
          padding: 25px;
          border-radius: 19px;
          background: linear-gradient(
            135deg,
            #eef0ff,
            #f8f8ff
          );
          border: 1px solid #dfe2ff;
        }

        .teacher-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          border-radius: 15px;
          background: #6366f1;
          font-size: 23px;
        }

        .teacher-content {
          flex: 1;
        }

        .teacher-label {
          color: #6366f1;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .teacher-content h2 {
          margin: 5px 0 8px;
          font-size: 18px;
        }

        .teacher-content > p {
          margin: 0;
          max-width: 700px;
          color: #666c79;
          font-size: 13px;
          line-height: 1.7;
        }

        .teacher-tips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 15px;
        }

        .teacher-tips div {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 9px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.75);
          color: #626876;
          font-size: 10px;
          font-weight: 700;
        }

        .teacher-tips span {
          color: #6366f1;
        }

        @media (max-width: 700px) {
          .result-page {
            padding: 30px 14px 60px;
          }

          .result-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .secondary-action {
            flex: 1;
          }

          .card-header {
            padding: 19px;
            align-items: flex-start;
          }

          .header-buttons {
            flex-direction: column;
          }

          .sentence-item {
            padding: 15px 19px;
          }

          .teacher-card {
            flex-direction: column;
          }

          .article-full-text {
            padding: 19px;
          }
        }
      `}</style>
    </main>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="empty-state">
      {text}
    </div>
  );
}