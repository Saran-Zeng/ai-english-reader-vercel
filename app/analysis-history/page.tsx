"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Article = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  translation: string | null;
  level: string | null;
  createdAt?: string;
  sentences?: unknown[];
  vocabulary?: unknown[];
  grammar?: unknown[];
};

function formatDate(value?: string) {
  if (!value) {
    return "未知时间";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWordCount(text: string) {
  if (!text?.trim()) {
    return 0;
  }

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getPreview(text: string) {
  const clean = (text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) {
    return "暂无文章预览";
  }

  if (clean.length <= 180) {
    return clean;
  }

  return `${clean.slice(0, 180)}...`;
}

function getLevelLabel(level: string | null) {
  if (!level) {
    return "未设置";
  }

  const value = level.toLowerCase();

  if (value === "beginner") {
    return "B1";
  }

  if (value === "intermediate") {
    return "C1";
  }

  if (value === "advanced") {
    return "C2";
  }

  return level;
}

export default function AnalysisHistoryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  async function loadHistory(searchValue = "") {
    try {
      setLoading(true);
      setError("");

      const keyword = searchValue.trim();

      const query = keyword
        ? `?search=${encodeURIComponent(keyword)}`
        : "";

      const response = await fetch(
        `/api/analysis-history${query}`,
        {
          cache: "no-store",
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "获取 AI 分析历史失败",
        );
      }

      setArticles(
        Array.isArray(data?.articles)
          ? data.articles
          : [],
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "获取 AI 分析历史失败",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleDelete(
    id: string,
    title: string,
  ) {
    const confirmed = window.confirm(
      `确定要删除这篇 AI 分析记录吗？\n\n${title}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(
        "/api/analysis-history",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "删除失败",
        );
      }

      setArticles((current) =>
        current.filter(
          (article) => article.id !== id,
        ),
      );
    } catch (err) {
      console.error(err);

      window.alert(
        err instanceof Error
          ? err.message
          : "删除失败",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalWords = useMemo(() => {
    return articles.reduce(
      (total, article) =>
        total +
        getWordCount(article.content || ""),
      0,
    );
  }, [articles]);

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    loadHistory(search);
  }

  return (
    <main className="history-page">
      <div className="history-container">
        {/* 页面标题 */}
        <section className="history-header">
          <div>
            <div className="history-eyebrow">
              AI LEARNING HISTORY
            </div>

            <h1>AI 分析历史</h1>

            <p>
              共 {articles.length} 篇文章
            </p>
          </div>

          <Link
            href="/reader"
            className="new-analysis-button"
          >
            <span>＋</span>
            新建 AI 分析
          </Link>
        </section>

        {/* 统计 */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">
              AI 分析文章
            </div>

            <div className="stat-value">
              {articles.length}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              总词数
            </div>

            <div className="stat-value">
              {totalWords.toLocaleString()}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              最近分析
            </div>

            <div className="stat-date">
              {articles.length > 0
                ? formatDate(
                    articles[0].createdAt,
                  )
                : "暂无记录"}
            </div>
          </div>
        </section>

        {/* 搜索 */}
        <form
          onSubmit={handleSearchSubmit}
          className="search-box"
        >
          <div className="search-input-wrap">
            <span className="search-icon">
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="搜索文章标题或文章内容..."
            />
          </div>

          <button
            type="submit"
            className="search-button"
          >
            搜索
          </button>

          {search && (
            <button
              type="button"
              className="clear-search-button"
              onClick={() => {
                setSearch("");
                loadHistory("");
              }}
            >
              清除
            </button>
          )}
        </form>

        {/* 错误 */}
        {error && (
          <div className="history-error">
            <div className="error-symbol">
              !
            </div>

            <div>
              <strong>
                暂时无法加载历史记录
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* 加载 */}
        {loading ? (
          <div className="loading-card">
            <div className="loading-spinner" />

            <div>
              正在加载 AI 分析历史...
            </div>
          </div>
        ) : articles.length === 0 ? (
          /* 空状态 */
          <div className="empty-card">
            <div className="empty-icon">
              📚
            </div>

            <h2>
              还没有 AI 分析记录
            </h2>

            <p>
              分析一篇英文文章后，
              它会自动保存在这里。
            </p>

            <Link
              href="/reader"
              className="empty-button"
            >
              开始第一次 AI 分析
              <span>→</span>
            </Link>
          </div>
        ) : (
          /* =================================================
             文章卡片区域
             每一篇文章都是一个完全独立的 CARD
             ================================================= */
          <section className="article-grid">
            {articles.map((article) => {
              const wordCount =
                getWordCount(
                  article.content || "",
                );

              const vocabularyCount =
                Array.isArray(
                  article.vocabulary,
                )
                  ? article.vocabulary.length
                  : 0;

              const grammarCount =
                Array.isArray(
                  article.grammar,
                )
                  ? article.grammar.length
                  : 0;

              const sentenceCount =
                Array.isArray(
                  article.sentences,
                )
                  ? article.sentences.length
                  : 0;

              const levelLabel =
                getLevelLabel(article.level);

              return (
                <article
                  key={article.id}
                  className="article-card"
                >
                  {/* 卡片顶部 */}
                  <div className="article-card-top">
                    <div className="book-icon">
                      <span>▥</span>
                    </div>

                    <div className="level-badge">
                      {levelLabel}
                    </div>
                  </div>

                  {/* 标题 */}
                  <h2 className="article-title">
                    {article.title ||
                      "Untitled Article"}
                  </h2>

                  {/* 文章预览 */}
                  <p className="article-preview">
                    {getPreview(
                      article.content || "",
                    )}
                  </p>

                  {/* 基础数据 */}
                  <div className="article-meta">
                    <span>
                      {sentenceCount} 段
                    </span>

                    <span className="meta-dot">
                      ·
                    </span>

                    <span>
                      {wordCount.toLocaleString()} 词
                    </span>
                  </div>

                  {/* 分隔线 */}
                  <div className="article-divider" />

                  {/* 学习数据 */}
                  <div className="learning-stats">
                    <div className="learning-stat">
                      <span className="learning-label">
                        词汇
                      </span>

                      <strong>
                        {vocabularyCount}
                      </strong>
                    </div>

                    <div className="learning-stat">
                      <span className="learning-label">
                        语法
                      </span>

                      <strong>
                        {grammarCount}
                      </strong>
                    </div>

                    <div className="learning-stat learning-stat-date">
                      <span className="learning-label">
                        分析时间
                      </span>

                      <strong>
                        {formatDate(
                          article.createdAt,
                        )}
                      </strong>
                    </div>
                  </div>

                  {/* 操作区 */}
                  <div className="article-actions">
                    <Link
                      href={`/result?id=${encodeURIComponent(
                        article.id,
                      )}`}
                      className="primary-action"
                    >
                      <span>
                        查看 AI 分析
                      </span>

                      <span className="action-arrow">
                        →
                      </span>
                    </Link>

                    <Link
                      href={`/long-reading/${encodeURIComponent(
                        article.id,
                      )}`}
                      className="secondary-action"
                    >
                      长篇阅读
                    </Link>

                    <button
                      type="button"
                      disabled={
                        deletingId ===
                        article.id
                      }
                      onClick={() =>
                        handleDelete(
                          article.id,
                          article.title ||
                            "Untitled Article",
                        )
                      }
                      className="delete-action"
                    >
                      {deletingId ===
                      article.id
                        ? "正在删除..."
                        : "删除记录"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      <style jsx>{`
        .history-page {
          min-height: calc(100vh - 64px);
          padding: 38px 30px 80px;
          box-sizing: border-box;
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(99, 102, 241, 0.1),
              transparent 520px
            ),
            linear-gradient(
              180deg,
              #f7f8fc 0%,
              #f3f5f9 100%
            );
          color: #172033;
        }

        .history-container {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        /* =========================
           HEADER
        ========================= */

        .history-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 28px;
        }

        .history-eyebrow {
          display: inline-flex;
          align-items: center;
          margin-bottom: 9px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eef0ff;
          color: #5d57d9;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .history-header h1 {
          margin: 0;
          color: #151a29;
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -0.045em;
        }

        .history-header p {
          margin: 9px 0 0;
          color: #8a91a0;
          font-size: 12px;
        }

        .new-analysis-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          height: 45px;
          padding: 0 17px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #5b54df;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 850;
          box-shadow:
            0 8px 20px
            rgba(91, 84, 223, 0.2);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .new-analysis-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 25px
            rgba(91, 84, 223, 0.27);
        }

        .new-analysis-button span {
          font-size: 17px;
          line-height: 1;
        }

        /* =========================
           STATS
        ========================= */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 13px;
          margin-bottom: 18px;
        }

        .stat-card {
          min-width: 0;
          padding: 18px 20px;
          border: 1px solid #e5e8ef;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow:
            0 5px 20px
            rgba(25, 31, 50, 0.035);
        }

        .stat-label {
          color: #969dab;
          font-size: 10px;
          font-weight: 800;
        }

        .stat-value {
          margin-top: 7px;
          color: #1a2030;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .stat-date {
          margin-top: 9px;
          color: #303747;
          font-size: 12px;
          font-weight: 800;
        }

        /* =========================
           SEARCH
        ========================= */

        .search-box {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 25px;
          padding: 9px;
          border: 1px solid #e5e8ef;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow:
            0 5px 20px
            rgba(25, 31, 50, 0.035);
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #e5e7ed;
          border-radius: 11px;
          background: #f8f9fb;
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .search-input-wrap:focus-within {
          border-color: #8783e8;
          background: #fff;
          box-shadow:
            0 0 0 4px
            rgba(99, 102, 241, 0.07);
        }

        .search-icon {
          color: #8d93a1;
          font-size: 19px;
          line-height: 1;
        }

        .search-input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #252a37;
          font-family: inherit;
          font-size: 12px;
        }

        .search-input-wrap input::placeholder {
          color: #adb2bd;
        }

        .search-button,
        .clear-search-button {
          height: 42px;
          padding: 0 17px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .search-button {
          border: 0;
          background: #202431;
          color: #fff;
        }

        .search-button:hover {
          background: #11141d;
        }

        .clear-search-button {
          border: 1px solid #e2e5eb;
          background: #fff;
          color: #666c79;
        }

        .clear-search-button:hover {
          background: #f7f8fa;
        }

        /* =========================
           ERROR / LOADING / EMPTY
        ========================= */

        .history-error {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #fecaca;
          border-radius: 14px;
          background: #fff7f7;
        }

        .error-symbol {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 25px;
          height: 25px;
          flex: 0 0 25px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .history-error strong {
          color: #8e3030;
          font-size: 12px;
        }

        .history-error p {
          margin: 4px 0 0;
          color: #b45454;
          font-size: 10px;
        }

        .loading-card,
        .empty-card {
          border: 1px solid #e3e6ed;
          border-radius: 22px;
          background: #fff;
          box-shadow:
            0 8px 30px
            rgba(25, 31, 50, 0.04);
        }

        .loading-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 260px;
          color: #8c93a1;
          font-size: 12px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid #e4e6ec;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        .empty-card {
          padding: 70px 25px;
          text-align: center;
        }

        .empty-icon {
          font-size: 42px;
        }

        .empty-card h2 {
          margin: 16px 0 0;
          color: #202532;
          font-size: 20px;
          font-weight: 900;
        }

        .empty-card p {
          margin: 9px 0 0;
          color: #9096a3;
          font-size: 12px;
        }

        .empty-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
          padding: 12px 17px;
          border-radius: 11px;
          background: #5b54df;
          color: #fff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
        }

        /* =========================
           ARTICLE GRID
           重点：每篇文章独立 CARD
        ========================= */

        .article-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
          align-items: stretch;
        }

        .article-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 430px;
          box-sizing: border-box;
          padding: 26px;
          border: 1px solid #dfe3eb;
          border-radius: 21px;
          background: #fff;
          box-shadow:
            0 7px 25px
            rgba(25, 31, 50, 0.045);
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .article-card:hover {
          transform: translateY(-2px);
          border-color: #d2d5e8;
          box-shadow:
            0 14px 35px
            rgba(25, 31, 50, 0.08);
        }

        .article-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .book-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          border-radius: 13px;
          background: #f0f1fb;
          color: #6862db;
          font-size: 21px;
        }

        .book-icon span {
          transform: rotate(90deg);
        }

        .level-badge {
          padding: 5px 9px;
          border-radius: 8px;
          background: #f1f3f7;
          color: #606674;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .article-title {
          margin: 0;
          color: #171c2b;
          font-size: 20px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -0.025em;
          text-decoration: underline;
          text-decoration-thickness: 1.5px;
          text-underline-offset: 3px;
        }

        .article-preview {
          display: -webkit-box;
          overflow: hidden;
          margin: 11px 0 0;
          color: #7e8594;
          font-size: 11px;
          line-height: 1.7;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .article-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 14px;
          color: #777e8d;
          font-size: 10px;
          font-weight: 700;
        }

        .meta-dot {
          color: #b7bbc4;
        }

        .article-divider {
          width: 100%;
          height: 1px;
          margin: 16px 0;
          background: #e8eaf0;
        }

        .learning-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 18px;
        }

        .learning-stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .learning-label {
          color: #9298a5;
          font-size: 10px;
        }

        .learning-stat strong {
          color: #434956;
          font-size: 11px;
          font-weight: 850;
        }

        .learning-stat-date {
          margin-left: auto;
        }

        .learning-stat-date strong {
          color: #8a909c;
          font-size: 9px;
          font-weight: 700;
        }

        /* =========================
           ACTIONS
        ========================= */

        .article-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: auto;
        }

        .primary-action,
        .secondary-action,
        .delete-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          width: 100%;
          min-height: 42px;
          padding: 0 13px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
        }

        .primary-action {
          color: #5c55df;
          background: transparent;
        }

        .primary-action:hover {
          background: #f4f3ff;
        }

        .action-arrow {
          font-size: 17px;
          font-weight: 500;
        }

        .secondary-action {
          justify-content: center;
          border: 1px solid #e0e3ea;
          background: #fff;
          color: #555b68;
        }

        .secondary-action:hover {
          border-color: #d2d5df;
          background: #f8f9fb;
        }

        .delete-action {
          justify-content: center;
          border: 1px solid #f4caca;
          background: #fffafa;
          color: #d45b5b;
        }

        .delete-action:hover:not(:disabled) {
          border-color: #efb5b5;
          background: #fff1f1;
        }

        .delete-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =========================
           TABLET
        ========================= */

        @media (max-width: 900px) {
          .history-page {
            padding: 30px 20px 65px;
          }

          .article-grid {
            grid-template-columns: 1fr;
          }

          .article-card {
            min-height: auto;
          }
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 650px) {
          .history-page {
            padding: 25px 15px 55px;
          }

          .history-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .new-analysis-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .search-box {
            align-items: stretch;
            flex-direction: column;
          }

          .search-input-wrap {
            width: 100%;
            box-sizing: border-box;
          }

          .search-button,
          .clear-search-button {
            width: 100%;
          }

          .article-card {
            padding: 21px;
            border-radius: 18px;
          }

          .article-title {
            font-size: 18px;
          }

          .learning-stat-date {
            width: 100%;
            margin-left: 0;
          }
        }
      `}</style>
    </main>
  );
}