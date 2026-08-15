"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Level =
  | "beginner"
  | "intermediate"
  | "advanced";

const LEVELS: {
  value: Level;
  label: string;
  english: string;
  description: string;
}[] = [
  {
    value: "beginner",
    label: "初级",
    english: "BEGINNER",
    description: "适合基础学习，重点解释词汇和简单句型。",
  },
  {
    value: "intermediate",
    label: "中级",
    english: "INTERMEDIATE",
    description: "适合日常阅读，深入理解词汇、句型和语法。",
  },
  {
    value: "advanced",
    label: "高级",
    english: "ADVANCED",
    description: "深入分析高级词汇、复杂句型和语法结构。",
  },
];

const EXAMPLE_ARTICLE = `Artificial intelligence is changing the way people learn languages.

Modern language learning tools can analyze articles, explain difficult vocabulary, identify grammar patterns, and provide personalized exercises.

Instead of simply translating a sentence, an AI-powered reading assistant can help learners understand why a particular word or grammar structure is used in context.

This makes reading more interactive and allows learners to turn almost any English article into a personalized learning experience.`;

export default function ReaderPage() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] =
    useState<Level>("intermediate");

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [error, setError] = useState("");
  const [showExample, setShowExample] =
    useState(false);

  const characterCount = text.length;

  const wordCount = text.trim()
    ? text
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  const canAnalyze =
    text.trim().length >= 10 &&
    !isAnalyzing;

  function useExample() {
    setText(EXAMPLE_ARTICLE);

    if (!title.trim()) {
      setTitle(
        "The Future of AI Language Learning"
      );
    }

    setError("");
    setShowExample(false);
  }

  async function handleAnalyze(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const content = text.trim();

    if (!content) {
      setError("请先输入一篇英文文章。");
      return;
    }

    if (content.length < 10) {
      setError(
        "文章内容太短，请至少输入 10 个字符。"
      );
      return;
    }

    setError("");
    setIsAnalyzing(true);

    try {
      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            content,
            title: title.trim(),
            level,
          }),
        }
      );

      const data =
        await response.json().catch(() => null);

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            data?.message ||
            "AI 分析失败，请稍后再试。"
        );
      }

      const article = data.article;

      if (!article?.id) {
        throw new Error(
          "文章分析成功，但没有获取到文章 ID。"
        );
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "ai-english-reader-last-article",
          JSON.stringify({
            id: article.id,
            title:
              article.title ||
              title ||
              "Untitled Article",
            level,
          })
        );
      }

      router.push(
        `/result?id=${encodeURIComponent(
          String(article.id)
        )}`
      );
    } catch (err) {
      console.error("Analyze error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "AI 分析失败，请检查网络连接或 API 配置。"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="reader-page">
      <div className="reader-container">

        {/* HERO */}
        <section className="reader-hero">
          <div className="hero-copy">
            <div className="reader-badge">
              <span className="badge-dot" />
              AI ENGLISH READER
            </div>

            <h1>
              把任何英文文章
              <br />
              变成你的{" "}
              <span>AI 英语课堂</span>
            </h1>

            <p>
              输入一篇英文文章，AI 将自动分析重点词汇、
              句子结构、语法和中文理解，让阅读真正变成学习。
            </p>

            <div className="hero-points">
              <span>
                <b>✓</b> AI 深度分析
              </span>

              <span>
                <b>✓</b> 单词与语法讲解
              </span>

              <span>
                <b>✓</b> 个性化学习
              </span>
            </div>
          </div>

          <button
            type="button"
            className="example-button"
            onClick={() =>
              setShowExample(true)
            }
          >
            <span>✦</span>
            查看示例
          </button>
        </section>

        <form onSubmit={handleAnalyze}>

          {/* STEP 01 */}
          <section className="reader-card">
            <div className="section-heading">
              <div className="heading-left">
                <div className="step-icon">
                  01
                </div>

                <div>
                  <div className="eyebrow">
                    ARTICLE
                  </div>

                  <h2>文章信息</h2>

                  <p>
                    给文章设置一个标题，方便之后在文章库中查找。
                  </p>
                </div>
              </div>
            </div>

            <label
              className="field-label"
              htmlFor="article-title"
            >
              文章标题
            </label>

            <input
              id="article-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="例如：The Future of Artificial Intelligence"
              className="title-input"
              maxLength={120}
            />
          </section>

          {/* STEP 02 */}
          <section className="reader-card">
            <div className="section-heading">
              <div className="heading-left">
                <div className="step-icon">
                  02
                </div>

                <div>
                  <div className="eyebrow">
                    ENGLISH TEXT
                  </div>

                  <h2>输入英文文章</h2>

                  <p>
                    粘贴你想学习的英文文章内容。
                  </p>
                </div>
              </div>

              <div className="word-count-badge">
                {wordCount.toLocaleString()} words
              </div>
            </div>

            <div className="textarea-wrapper">
              <textarea
                value={text}
                onChange={(event) => {
                  setText(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                placeholder={`Paste your English article here...

For example:

Artificial intelligence is changing the way people learn languages.

You can paste an article from a website, book, news report, or any other English material.`}
                className="article-textarea"
                spellCheck={false}
              />

              <div className="textarea-footer">
                <span>
                  {wordCount.toLocaleString()} words
                  <i />
                  {characterCount.toLocaleString()} characters
                </span>

                {text.length > 0 && (
                  <button
                    type="button"
                    className="clear-button"
                    onClick={() => {
                      setText("");
                      setError("");
                    }}
                  >
                    清空
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              className="example-link"
              onClick={useExample}
            >
              <span>✦</span>
              使用示例文章快速体验
              <span className="link-arrow">
                →
              </span>
            </button>
          </section>

          {/* STEP 03 */}
          <section className="reader-card">
            <div className="section-heading">
              <div className="heading-left">
                <div className="step-icon">
                  03
                </div>

                <div>
                  <div className="eyebrow">
                    LEARNING LEVEL
                  </div>

                  <h2>选择学习难度</h2>

                  <p>
                    AI 会根据你的英语水平调整解释深度。
                  </p>
                </div>
              </div>
            </div>

            <div className="level-grid">
              {LEVELS.map((item) => {
                const active =
                  level === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`level-card ${
                      active
                        ? "level-card-active"
                        : ""
                    }`}
                    onClick={() =>
                      setLevel(item.value)
                    }
                  >
                    <div
                      className={`level-radio ${
                        active
                          ? "level-radio-active"
                          : ""
                      }`}
                    >
                      {active && "✓"}
                    </div>

                    <div className="level-content">
                      <strong>
                        {item.label}
                      </strong>

                      <small>
                        {item.english}
                      </small>

                      <span>
                        {item.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <div
              className="reader-error"
              role="alert"
            >
              <div className="error-icon">
                !
              </div>

              <div>
                <strong>
                  暂时无法开始分析
                </strong>

                <p>{error}</p>
              </div>
            </div>
          )}

          {/* ANALYZE */}
          <section className="analyze-section">
            <div className="analyze-info">
              <div className="analyze-icon">
                ✦
              </div>

              <div>
                <div className="analyze-label">
                  AI ANALYSIS
                </div>

                <strong>
                  {isAnalyzing
                    ? "AI 正在分析你的文章..."
                    : "准备好开始学习了吗？"}
                </strong>

                <p>
                  {isAnalyzing
                    ? "正在根据你的学习等级分析文章，请稍候。"
                    : "让 AI 把这篇文章变成属于你的英语学习课程。"}
                </p>
              </div>
            </div>

            <button
              type="submit"
              className={`analyze-button ${
                !canAnalyze
                  ? "analyze-button-disabled"
                  : ""
              }`}
              disabled={!canAnalyze}
            >
              {isAnalyzing ? (
                <>
                  <span className="button-spinner" />
                  正在分析
                </>
              ) : (
                <>
                  开始 AI 分析
                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}
            </button>
          </section>
        </form>

        {/* FEATURES */}
        <section className="feature-section">
          <div className="feature-header">
            <div>
              <div className="feature-eyebrow">
                AI LEARNING
              </div>

              <h2>
                一次分析，获得完整学习内容
              </h2>
            </div>

            <p>
              不只是翻译，而是真正帮助你理解英文。
            </p>
          </div>

          <div className="feature-grid">
            <FeatureCard
              number="01"
              icon="A"
              title="重点词汇"
              description="识别文章中的重点单词、词义、词性，并结合真实语境解释。"
            />

            <FeatureCard
              number="02"
              icon="文"
              title="句子解析"
              description="逐句理解文章内容，帮助你真正看懂复杂英文句子。"
            />

            <FeatureCard
              number="03"
              icon="G"
              title="语法分析"
              description="识别重要语法结构，并结合原文说明为什么这样使用。"
            />

            <FeatureCard
              number="04"
              icon="中"
              title="中文理解"
              description="提供自然流畅的中文理解，而不是简单机械的逐字翻译。"
            />
          </div>
        </section>
      </div>

      {/* EXAMPLE MODAL */}
      {showExample && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowExample(false);
            }
          }}
        >
          <div className="example-modal">
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">
                  QUICK START
                </div>

                <h2>示例文章</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowExample(false)
                }
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div className="example-title">
              The Future of AI Language Learning
            </div>

            <div className="example-content">
              {EXAMPLE_ARTICLE}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setShowExample(false)
                }
              >
                关闭
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={useExample}
              >
                使用这篇文章
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reader-page {
          width: 100%;
          min-height: calc(100vh - 64px);
          box-sizing: border-box;
          padding: 48px 42px 90px;
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(99, 102, 241, 0.12),
              transparent 500px
            ),
            linear-gradient(
              180deg,
              #fafbff 0%,
              #f6f7fb 100%
            );
          color: #171923;
        }

        .reader-container {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .reader-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 38px;
        }

        .hero-copy {
          min-width: 0;
        }

        .reader-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 17px;
          padding: 7px 12px;
          border: 1px solid
            rgba(99, 102, 241, 0.14);
          border-radius: 999px;
          background: rgba(
            99,
            102,
            241,
            0.06
          );
          color: #5750d8;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366f1;
          box-shadow:
            0 0 0 4px
            rgba(99, 102, 241, 0.1);
        }

        .reader-hero h1 {
          margin: 0;
          color: #151722;
          font-size: clamp(
            38px,
            5vw,
            58px
          );
          line-height: 1.04;
          letter-spacing: -0.055em;
          font-weight: 900;
        }

        .reader-hero h1 span {
          color: #5b54df;
        }

        .reader-hero p {
          max-width: 720px;
          margin: 20px 0 0;
          color: #727887;
          font-size: 15px;
          line-height: 1.8;
        }

        .hero-points {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 20px;
        }

        .hero-points span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #747a89;
          font-size: 11px;
          font-weight: 600;
        }

        .hero-points b {
          color: #6366f1;
          font-size: 13px;
        }

        .example-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          height: 46px;
          padding: 0 17px;
          border: 1px solid #e1e4ec;
          border-radius: 13px;
          background: rgba(
            255,
            255,
            255,
            0.9
          );
          color: #454a58;
          box-shadow:
            0 5px 18px
            rgba(25, 30, 50, 0.04);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .example-button:hover {
          transform: translateY(-2px);
          border-color: #cfd2ee;
          box-shadow:
            0 10px 25px
            rgba(25, 30, 50, 0.08);
        }

        .example-button span {
          color: #6366f1;
        }

        .reader-card {
          margin-bottom: 17px;
          padding: 28px;
          border: 1px solid #e8eaf1;
          border-radius: 21px;
          background: rgba(
            255,
            255,
            255,
            0.94
          );
          box-shadow:
            0 10px 35px
            rgba(27, 31, 48, 0.045);
        }

        .section-heading {
          margin-bottom: 23px;
        }

        .heading-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .step-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 39px;
          height: 39px;
          flex: 0 0 39px;
          border: 1px solid
            rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          background: #f2f2ff;
          color: #5b54df;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .eyebrow,
        .feature-eyebrow,
        .modal-eyebrow,
        .analyze-label {
          color: #6b64e5;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .section-heading h2 {
          margin: 4px 0 0;
          color: #20232e;
          font-size: 18px;
          font-weight: 850;
          letter-spacing: -0.02em;
        }

        .section-heading p {
          margin: 6px 0 0;
          color: #8a909e;
          font-size: 11px;
          line-height: 1.6;
        }

        .word-count-badge {
          float: right;
          margin-top: -42px;
          padding: 7px 10px;
          border-radius: 8px;
          background: #f6f7fa;
          color: #999eaa;
          font-size: 9px;
          font-weight: 700;
        }

        .field-label {
          display: block;
          margin-bottom: 8px;
          color: #505563;
          font-size: 11px;
          font-weight: 800;
        }

        .title-input {
          width: 100%;
          height: 50px;
          box-sizing: border-box;
          padding: 0 15px;
          outline: none;
          border: 1px solid #dfe2e9;
          border-radius: 12px;
          background: #fbfcfe;
          color: #222530;
          font-family: inherit;
          font-size: 13px;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .title-input:focus {
          border-color: #8581e9;
          background: #fff;
          box-shadow:
            0 0 0 4px
            rgba(99, 102, 241, 0.08);
        }

        .textarea-wrapper {
          overflow: hidden;
          border: 1px solid #dfe2e9;
          border-radius: 15px;
          background: #fbfcfe;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .textarea-wrapper:focus-within {
          border-color: #8581e9;
          box-shadow:
            0 0 0 4px
            rgba(99, 102, 241, 0.06);
        }

        .article-textarea {
          display: block;
          width: 100%;
          min-height: 285px;
          box-sizing: border-box;
          resize: vertical;
          padding: 19px;
          outline: none;
          border: 0;
          background: transparent;
          color: #252832;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.85;
        }

        .article-textarea::placeholder {
          color: #b0b5bf;
        }

        .textarea-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 42px;
          padding: 0 15px;
          border-top: 1px solid #e9ebf0;
          color: #9ba0ab;
          font-size: 10px;
        }

        .textarea-footer i {
          display: inline-block;
          width: 3px;
          height: 3px;
          margin: 0 8px;
          vertical-align: middle;
          border-radius: 50%;
          background: #c3c6cd;
        }

        .clear-button {
          border: 0;
          background: transparent;
          color: #747a87;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .clear-button:hover {
          color: #4f46e5;
        }

        .example-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 13px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #5b54df;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .example-link > span:first-child {
          font-size: 12px;
        }

        .link-arrow {
          margin-left: 3px;
          transition:
            transform 0.18s ease;
        }

        .example-link:hover
          .link-arrow {
          transform: translateX(3px);
        }

        .level-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 12px;
        }

        .level-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
          padding: 17px;
          border: 1px solid #e5e7ed;
          border-radius: 15px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .level-card:hover {
          transform: translateY(-1px);
          border-color: #d5d7e4;
          box-shadow:
            0 7px 18px
            rgba(30, 35, 55, 0.05);
        }

        .level-card-active {
          border-color: #7772e8;
          background: #f9f9ff;
          box-shadow:
            0 0 0 3px
            rgba(99, 102, 241, 0.07);
        }

        .level-radio {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 21px;
          height: 21px;
          flex: 0 0 21px;
          box-sizing: border-box;
          border: 1.5px solid #d0d3db;
          border-radius: 50%;
          background: #fff;
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }

        .level-radio-active {
          border-color: #6366f1;
          background: #6366f1;
        }

        .level-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .level-content strong {
          color: #292c36;
          font-size: 13px;
          font-weight: 850;
        }

        .level-content small {
          color: #6861dc;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .level-content span {
          color: #8a909d;
          font-size: 10px;
          line-height: 1.55;
        }

        .reader-error {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin: 17px 0;
          padding: 14px 16px;
          border: 1px solid #fecaca;
          border-radius: 14px;
          background: #fff8f8;
        }

        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex: 0 0 24px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .reader-error strong {
          color: #8f3030;
          font-size: 12px;
        }

        .reader-error p {
          margin: 4px 0 0;
          color: #b45353;
          font-size: 10px;
          line-height: 1.6;
        }

        .analyze-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 24px 25px;
          border-radius: 20px;
          background:
            radial-gradient(
              circle at 0% 50%,
              rgba(
                99,
                102,
                241,
                0.18
              ),
              transparent 35%
            ),
            #191b25;
          box-shadow:
            0 15px 35px
            rgba(24, 26, 36, 0.12);
        }

        .analyze-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .analyze-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          border: 1px solid
            rgba(255, 255, 255, 0.08);
          border-radius: 13px;
          background: rgba(
            255,
            255,
            255,
            0.08
          );
          color: #c7d2fe;
          font-size: 19px;
        }

        .analyze-label {
          margin-bottom: 4px;
          color: #9290ee;
        }

        .analyze-info strong {
          color: #fff;
          font-size: 14px;
          font-weight: 800;
        }

        .analyze-info p {
          margin: 5px 0 0;
          color: #969aa8;
          font-size: 10px;
        }

        .analyze-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-width: 175px;
          height: 50px;
          flex-shrink: 0;
          padding: 0 19px;
          border: 0;
          border-radius: 13px;
          background: #fff;
          color: #1b1d26;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .analyze-button:hover:not(
            :disabled
          ) {
          transform: translateY(-2px);
          box-shadow:
            0 8px 22px
            rgba(255, 255, 255, 0.13);
        }

        .analyze-button-disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }

        .button-arrow {
          font-size: 16px;
        }

        .button-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #d5d7dc;
          border-top-color: #242631;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        .feature-section {
          margin-top: 55px;
        }

        .feature-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .feature-eyebrow {
          margin-bottom: 5px;
        }

        .feature-header h2 {
          margin: 0;
          color: #242731;
          font-size: 22px;
          letter-spacing: -0.035em;
        }

        .feature-header > p {
          margin: 0 0 2px;
          color: #9a9faa;
          font-size: 10px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 11px;
        }

        .feature-item {
          padding: 19px;
          border: 1px solid #e8eaf0;
          border-radius: 16px;
          background: rgba(
            255,
            255,
            255,
            0.85
          );
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .feature-item:hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 25px
            rgba(25, 30, 50, 0.05);
        }

        .feature-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #f0f1fa;
          color: #5b54df;
          font-size: 11px;
          font-weight: 900;
        }

        .feature-number {
          color: #c0c3cb;
          font-size: 9px;
          font-weight: 800;
        }

        .feature-item h3 {
          margin: 0 0 7px;
          color: #30333d;
          font-size: 13px;
          font-weight: 850;
        }

        .feature-item p {
          margin: 0;
          color: #8b909d;
          font-size: 10px;
          line-height: 1.65;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 20px;
          background: rgba(
            17,
            20,
            29,
            0.5
          );
          backdrop-filter: blur(5px);
        }

        .example-modal {
          width: min(680px, 100%);
          max-height: calc(100vh - 40px);
          overflow: auto;
          box-sizing: border-box;
          padding: 27px;
          border: 1px solid
            rgba(255, 255, 255, 0.6);
          border-radius: 22px;
          background: #fff;
          box-shadow:
            0 30px 80px
            rgba(15, 20, 35, 0.2);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .modal-eyebrow {
          margin-bottom: 5px;
        }

        .modal-header h2 {
          margin: 0;
          color: #20232d;
          font-size: 22px;
        }

        .modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 10px;
          background: #f2f3f6;
          color: #666b77;
          font-size: 21px;
          cursor: pointer;
        }

        .example-title {
          margin: 25px 0 12px;
          color: #343844;
          font-size: 14px;
          font-weight: 850;
        }

        .example-content {
          white-space: pre-line;
          padding: 19px;
          border: 1px solid #eceef3;
          border-radius: 14px;
          background: #f8f9fb;
          color: #555b68;
          font-size: 12px;
          line-height: 1.85;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 20px;
        }

        .secondary-button,
        .primary-button {
          height: 43px;
          padding: 0 16px;
          border-radius: 11px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .secondary-button {
          border: 1px solid #e0e3e9;
          background: #fff;
          color: #555b67;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          background: #5750df;
          color: #fff;
        }

        .primary-button span {
          font-size: 15px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1000px) {
          .reader-page {
            padding: 38px 25px 70px;
          }

          .feature-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 800px) {
          .reader-page {
            padding: 30px 16px 60px;
          }

          .reader-hero {
            align-items: flex-start;
            flex-direction: column;
            gap: 20px;
          }

          .reader-hero h1 {
            font-size: 40px;
          }

          .example-button {
            width: 100%;
            justify-content: center;
          }

          .reader-card {
            padding: 21px;
          }

          .level-grid {
            grid-template-columns: 1fr;
          }

          .analyze-section {
            align-items: stretch;
            flex-direction: column;
          }

          .analyze-button {
            width: 100%;
          }

          .feature-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 520px) {
          .reader-hero h1 {
            font-size: 34px;
          }

          .hero-points {
            flex-direction: column;
            gap: 8px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .article-textarea {
            min-height: 250px;
          }

          .word-count-badge {
            display: none;
          }

          .analyze-info {
            align-items: flex-start;
          }

          .modal-actions {
            flex-direction: column;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function FeatureCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="feature-item">
      <div className="feature-top">
        <div className="feature-icon">
          {icon}
        </div>

        <span className="feature-number">
          {number}
        </span>
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}