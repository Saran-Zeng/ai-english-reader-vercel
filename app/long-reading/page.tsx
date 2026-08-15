"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Article = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  level: string | null;
  sentences: {
    id: string;
    order: number;
    words: {
      id: string;
    }[];
  }[];
  vocabulary: {
    id: string;
  }[];
  grammar: {
    id: string;
  }[];
};

export default function LongReadingPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/articles",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "无法加载文章列表"
        );
      }

      const nextArticles =
        Array.isArray(data?.articles)
          ? data.articles
          : Array.isArray(data)
          ? data
          : [];

      setArticles(nextArticles);
    } catch (error) {
      console.error(
        "Load articles error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "无法加载文章列表"
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteArticle(
    articleId: string,
    title: string
  ) {
    const confirmed = window.confirm(
      `确定要删除文章「${title}」吗？\n\n删除后，这篇文章及其相关内容都会从长篇阅读中删除。`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(articleId);

      const response = await fetch(
        `/api/articles/${articleId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            "删除文章失败"
        );
      }

      setArticles((current) =>
        current.filter(
          (article) =>
            article.id !== articleId
        )
      );
    } catch (error) {
      console.error(
        "Delete article error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "删除文章失败，请稍后再试。"
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="long-reading-page">
        <section className="long-reading-hero">
          <div className="long-reading-badge">
            📚 LONG FORM READING
          </div>

          <h1>长篇阅读</h1>

          <p>
            阅读完整英文文章，支持分段朗读、中英文对照，
            <br />
            让英语阅读从短篇练习走向真正的文章阅读。
          </p>
        </section>

        <section className="long-reading-content">
          <div className="status-card">
            <div className="spinner" />
            <h2>正在加载文章</h2>
            <p>
              正在读取你的长篇阅读文章……
            </p>
          </div>
        </section>

        <style jsx>{`
          .long-reading-page {
            min-height: 100vh;
            background: #f7f8fc;
          }

          .long-reading-hero {
            padding: 70px 20px 50px;
            text-align: center;
            background: #fff;
          }

          .long-reading-badge {
            margin-bottom: 14px;
            color: #6366f1;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.16em;
          }

          .long-reading-hero h1 {
            margin: 0;
            color: #20232c;
            font-size: clamp(
              32px,
              5vw,
              46px
            );
          }

          .long-reading-hero p {
            margin: 15px 0 0;
            color: #858b98;
            font-size: 13px;
            line-height: 1.8;
          }

          .long-reading-content {
            width: min(1100px, 100%);
            margin: 0 auto;
            padding: 45px 20px 80px;
          }

          .status-card {
            min-height: 280px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid #e7e9ef;
            border-radius: 20px;
            background: #fff;
          }

          .spinner {
            width: 34px;
            height: 34px;
            border: 3px solid #e4e6ef;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .status-card h2 {
            margin: 20px 0 7px;
            color: #30343e;
            font-size: 19px;
          }

          .status-card p {
            margin: 0;
            color: #9297a3;
            font-size: 12px;
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

  if (error) {
    return (
      <main className="long-reading-page">
        <section className="long-reading-hero">
          <div className="long-reading-badge">
            📚 LONG FORM READING
          </div>

          <h1>长篇阅读</h1>

          <p>
            阅读完整英文文章，支持分段朗读、中英文对照，
            <br />
            让英语阅读从短篇练习走向真正的文章阅读。
          </p>
        </section>

        <section className="long-reading-content">
          <div className="error-card">
            <div className="error-icon">
              !
            </div>

            <h2>无法加载文章</h2>

            <p>{error}</p>

            <button
              onClick={loadArticles}
            >
              重新加载
            </button>
          </div>
        </section>

        <style jsx>{`
          .long-reading-page {
            min-height: 100vh;
            background: #f7f8fc;
          }

          .long-reading-hero {
            padding: 70px 20px 50px;
            text-align: center;
            background: #fff;
          }

          .long-reading-badge {
            margin-bottom: 14px;
            color: #6366f1;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.16em;
          }

          .long-reading-hero h1 {
            margin: 0;
            color: #20232c;
            font-size: clamp(
              32px,
              5vw,
              46px
            );
          }

          .long-reading-hero p {
            margin: 15px 0 0;
            color: #858b98;
            font-size: 13px;
            line-height: 1.8;
          }

          .long-reading-content {
            width: min(1100px, 100%);
            margin: 0 auto;
            padding: 45px 20px 80px;
          }

          .error-card {
            padding: 60px 25px;
            border: 1px solid #e7e9ef;
            border-radius: 20px;
            background: #fff;
            text-align: center;
          }

          .error-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 45px;
            height: 45px;
            margin: 0 auto 15px;
            border-radius: 50%;
            background: #fee2e2;
            color: #dc2626;
            font-weight: 900;
          }

          .error-card h2 {
            margin: 0;
            color: #30343e;
            font-size: 19px;
          }

          .error-card p {
            margin: 10px 0 20px;
            color: #9297a3;
            font-size: 12px;
          }

          .error-card button {
            padding: 10px 16px;
            border: 0;
            border-radius: 10px;
            background: #6366f1;
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="long-reading-page">
      <section className="long-reading-hero">
        <div className="long-reading-badge">
          📚 LONG FORM READING
        </div>

        <h1>长篇阅读</h1>

        <p>
          阅读完整英文文章，支持分段朗读、中英文对照，
          <br />
          让英语阅读从短篇练习走向真正的文章阅读。
        </p>
      </section>

      <section className="long-reading-content">
        {articles.length === 0 ? (
          <div className="empty-reading">
            <div className="empty-icon">
              📚
            </div>

            <h2>暂时还没有文章</h2>

            <p>
              你可以先进入 AI 阅读，分析一篇英文文章。
            </p>

            <Link
              href="/reader"
              className="empty-button"
            >
              🤖 开始 AI 阅读
            </Link>
          </div>
        ) : (
          <>
            <div className="reading-list-header">
              <div>
                <h2>文章库</h2>

                <p>
                  共 {articles.length} 篇文章
                </p>
              </div>
            </div>

            <div className="long-reading-grid">
              {articles.map((article) => {
                const wordCount =
                  article.content
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length;

                const deleting =
                  deletingId === article.id;

                return (
                  <div
                    key={article.id}
                    className="long-reading-card"
                  >
                    <Link
                      href={`/long-reading/${article.id}`}
                      className="article-card-link"
                    >
                      <div className="article-card-top">
                        <div className="article-card-icon">
                          📖
                        </div>

                        {article.level && (
                          <span className="article-level">
                            {article.level}
                          </span>
                        )}
                      </div>

                      <h3>{article.title}</h3>

                      <p className="article-summary">
                        {article.summary ||
                          "开始阅读这篇英文文章，理解文章内容，学习词汇和句子。"}
                      </p>

                      <div className="article-meta">
                        <span>
                          {article.sentences.length} 段
                        </span>

                        <span>·</span>

                        <span>
                          {wordCount} 词
                        </span>
                      </div>

                      <div className="article-card-action">
                        <span>
                          开始阅读
                        </span>

                        <span>→</span>
                      </div>
                    </Link>

                    <button
                      className="article-delete-button"
                      disabled={deleting}
                      onClick={() =>
                        deleteArticle(
                          article.id,
                          article.title
                        )
                      }
                    >
                      {deleting
                        ? "正在删除..."
                        : "🗑 删除文章"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <style jsx>{`
        .long-reading-page {
          min-height: 100vh;
          background: #f7f8fc;
        }

        .long-reading-hero {
          padding: 70px 20px 50px;
          text-align: center;
          background: #fff;
        }

        .long-reading-badge {
          margin-bottom: 14px;
          color: #6366f1;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .long-reading-hero h1 {
          margin: 0;
          color: #20232c;
          font-size: clamp(
            32px,
            5vw,
            46px
          );
        }

        .long-reading-hero p {
          margin: 15px 0 0;
          color: #858b98;
          font-size: 13px;
          line-height: 1.8;
        }

        .long-reading-content {
          width: min(1100px, 100%);
          margin: 0 auto;
          padding: 45px 20px 80px;
        }

        .reading-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .reading-list-header h2 {
          margin: 0;
          color: #30343e;
          font-size: 22px;
        }

        .reading-list-header p {
          margin: 5px 0 0;
          color: #9297a3;
          font-size: 12px;
        }

        .long-reading-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(280px, 1fr)
            );
          gap: 16px;
        }

        .long-reading-card {
          overflow: hidden;
          border: 1px solid #e5e7ee;
          border-radius: 17px;
          background: #fff;
          box-shadow:
            0 6px 24px
            rgba(25, 30, 45, 0.025);
        }

        .article-card-link {
          display: block;
          padding: 20px 20px 12px;
          color: inherit;
          text-decoration: none;
        }

        .article-card-link:hover {
          background: #fafaff;
        }

        .article-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .article-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          border-radius: 12px;
          background: #f0f1fa;
          font-size: 19px;
        }

        .article-level {
          padding: 5px 8px;
          border-radius: 7px;
          background: #f1f2f7;
          color: #777d8a;
          font-size: 9px;
          font-weight: 800;
        }

        .article-card-link h3 {
          margin: 0;
          color: #2d313b;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.45;
        }

        .article-summary {
          min-height: 43px;
          margin: 9px 0 13px;
          color: #858b98;
          font-size: 11px;
          line-height: 1.7;
        }

        .article-meta {
          display: flex;
          gap: 8px;
          color: #999eaa;
          font-size: 9px;
        }

        .article-card-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 12px;
          border-top: 1px solid #eef0f4;
          color: #6366f1;
          font-size: 10px;
          font-weight: 800;
        }

        .article-delete-button {
          width: calc(100% - 40px);
          margin: 0 20px 16px;
          padding: 9px 12px;
          border: 1px solid #f0d8d8;
          border-radius: 9px;
          background: #fffafa;
          color: #c45b5b;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .article-delete-button:hover {
          background: #fff0f0;
        }

        .article-delete-button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .empty-reading {
          padding: 80px 25px;
          border: 1px solid #e7e9ef;
          border-radius: 20px;
          background: #fff;
          text-align: center;
        }

        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 70px;
          height: 70px;
          margin: 0 auto 18px;
          border-radius: 20px;
          background: #f1f2f8;
          font-size: 31px;
        }

        .empty-reading h2 {
          margin: 0;
          color: #30343e;
          font-size: 19px;
        }

        .empty-reading p {
          max-width: 380px;
          margin: 9px auto 20px;
          color: #9297a3;
          font-size: 12px;
          line-height: 1.7;
        }

        .empty-button {
          display: inline-block;
          padding: 10px 17px;
          border-radius: 10px;
          background: #6366f1;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
        }

        @media (max-width: 650px) {
          .long-reading-hero {
            padding: 50px 18px 35px;
          }

          .long-reading-content {
            padding: 30px 14px 60px;
          }

          .long-reading-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}