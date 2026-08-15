"use client";

import { useEffect, useState } from "react";

type Article = {
  id: string;
  title?: string | null;
  content: string;
  translation?: string | null;
  summary?: string | null;
  level?: string | null;
  createdAt?: string;
  sentences?: {
    id: string;
  }[];
  vocabulary?: {
    id: string;
  }[];
  grammar?: {
    id: string;
  }[];
};

export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/articles");

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "无法获取文章列表"
        );
      }

      setArticles(
        Array.isArray(data.articles)
          ? data.articles
          : []
      );
    } catch (err) {
      console.error("Load articles error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "文章列表加载失败"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const openArticle = (id: string) => {
    window.location.href = `/result?id=${id}`;
  };

  const deleteArticle = async (
    id: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      "确定要删除这篇文章吗？\n删除后无法恢复。"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/articles/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "删除文章失败"
        );
      }

      setArticles((current) =>
        current.filter((article) => article.id !== id)
      );
    } catch (err) {
      console.error("Delete article error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "删除文章失败，请稍后重试。"
      );
    }
  };

  if (loading) {
    return (
      <div className="state-card">
        <div className="spinner" />

        <h3>正在加载文章</h3>

        <p>正在读取你的英语学习记录……</p>

        <style jsx>{`
          .state-card {
            min-height: 260px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid #e8eaf0;
            border-radius: 20px;
            background: white;
          }

          .spinner {
            width: 35px;
            height: 35px;
            margin-bottom: 16px;
            border: 4px solid #e7e8ee;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          h3 {
            margin: 0;
            color: #343844;
            font-size: 16px;
          }

          p {
            margin: 7px 0 0;
            color: #999eaa;
            font-size: 12px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-card error-card">
        <div className="error-icon">!</div>

        <h3>文章列表加载失败</h3>

        <p>{error}</p>

        <button onClick={loadArticles}>
          重新加载
        </button>

        <style jsx>{`
          .state-card {
            min-height: 260px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid #e8eaf0;
            border-radius: 20px;
            background: white;
          }

          .error-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #fee2e2;
            color: #dc2626;
            font-weight: 900;
          }

          h3 {
            margin: 14px 0 0;
            color: #343844;
            font-size: 16px;
          }

          p {
            max-width: 500px;
            margin: 7px 20px 15px;
            color: #999eaa;
            font-size: 12px;
            text-align: center;
          }

          button {
            border: 0;
            border-radius: 9px;
            background: #4f46e5;
            color: white;
            padding: 9px 15px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="empty-card">
        <div className="empty-icon">📖</div>

        <h2>还没有学习文章</h2>

        <p>
          输入一篇英文文章，让 AI 帮你完成分析。
        </p>

        <button
          onClick={() => {
            window.location.href = "/reader";
          }}
        >
          开始第一篇
        </button>

        <style jsx>{`
          .empty-card {
            padding: 75px 25px;
            border: 1px solid #e8eaf0;
            border-radius: 20px;
            background: white;
            text-align: center;
          }

          .empty-icon {
            font-size: 42px;
            margin-bottom: 15px;
          }

          h2 {
            margin: 0;
            color: #30343e;
            font-size: 20px;
          }

          p {
            margin: 8px 0 20px;
            color: #999eaa;
            font-size: 13px;
          }

          button {
            border: 0;
            border-radius: 10px;
            background: #4f46e5;
            color: white;
            padding: 11px 18px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="article-list">
      <div className="list-header">
        <div>
          <strong>我的文章</strong>

          <span>{articles.length} 篇</span>
        </div>

        <button
          className="refresh-button"
          onClick={loadArticles}
        >
          ↻ 刷新
        </button>
      </div>

      <div className="grid">
        {articles.map((article) => {
          const date = article.createdAt
            ? new Date(article.createdAt).toLocaleDateString(
                "zh-CN"
              )
            : "";

          const preview =
            article.summary ||
            article.content
              ?.replace(/\s+/g, " ")
              .slice(0, 130) ||
            "暂无文章摘要";

          const sentenceCount =
            article.sentences?.length || 0;

          const vocabularyCount =
            article.vocabulary?.length || 0;

          const grammarCount =
            article.grammar?.length || 0;

          return (
            <article
              key={article.id}
              className="article-card"
              onClick={() => openArticle(article.id)}
            >
              <div className="article-card-top">
                <div className="book-icon">📖</div>

                <div className="article-actions">
                  {article.level && (
                    <span className="level">
                      {article.level}
                    </span>
                  )}

                  <button
                    className="delete-button"
                    title="删除文章"
                    onClick={(event) =>
                      deleteArticle(
                        article.id,
                        event
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              </div>

              <h2>
                {article.title ||
                  "未命名文章"}
              </h2>

              <p className="preview">
                {preview}
                {preview.length >= 130
                  ? "…"
                  : ""}
              </p>

              <div className="stats">
                <span>
                  💬 {sentenceCount} 句
                </span>

                <span>
                  📝 {vocabularyCount} 词
                </span>

                <span>
                  📚 {grammarCount} 语法
                </span>
              </div>

              <div className="article-footer">
                <span>{date}</span>

                <span className="open-link">
                  查看分析 →
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .article-list {
          width: 100%;
        }

        .list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .list-header > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .list-header strong {
          color: #343844;
          font-size: 15px;
        }

        .list-header span {
          padding: 4px 8px;
          border-radius: 999px;
          background: #eceef5;
          color: #777d89;
          font-size: 10px;
          font-weight: 800;
        }

        .refresh-button {
          border: 0;
          background: transparent;
          color: #737987;
          font-size: 12px;
          cursor: pointer;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 16px;
        }

        .article-card {
          padding: 22px;
          border: 1px solid #e7e9ef;
          border-radius: 18px;
          background: white;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            border-color 0.16s ease;
        }

        .article-card:hover {
          transform: translateY(-2px);
          border-color: #d8d9ff;
          box-shadow: 0 12px 35px
            rgba(31, 35, 55, 0.08);
        }

        .article-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .book-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #f1f2f8;
          font-size: 18px;
        }

        .article-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .level {
          padding: 5px 8px;
          border-radius: 7px;
          background: #eef0ff;
          color: #6366f1;
          font-size: 9px;
          font-weight: 900;
        }

        .delete-button {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #a0a5b0;
          font-size: 19px;
          cursor: pointer;
        }

        .delete-button:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .article-card h2 {
          margin: 0;
          color: #282c36;
          font-size: 17px;
          line-height: 1.4;
        }

        .preview {
          min-height: 43px;
          margin: 9px 0 17px;
          color: #858b97;
          font-size: 12px;
          line-height: 1.7;
        }

        .stats {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eef0f4;
        }

        .stats span {
          padding: 6px 8px;
          border-radius: 7px;
          background: #f7f8fa;
          color: #777d89;
          font-size: 9px;
        }

        .article-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 15px;
          color: #a0a5b0;
          font-size: 10px;
        }

        .open-link {
          color: #6366f1;
          font-weight: 800;
        }

        @media (max-width: 760px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}