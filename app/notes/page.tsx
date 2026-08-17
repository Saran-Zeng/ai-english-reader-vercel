"use client";

import { useEffect, useMemo, useState } from "react";

type Vocabulary = {
  id: string;
  word: string;
  meaning?: string | null;
  partOfSpeech?: string | null;
  example?: string | null;
  saved?: boolean;
};

type ArticleGroup = {
  article: {
    id: string;
    title: string;
    level: string | null;
    createdAt: string;
  };
  words: Vocabulary[];
};

export default function NotesPage() {
    function speak(text: string) {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 0.8;

    window.speechSynthesis.speak(utterance);
  }
  const [groups, setGroups] = useState<ArticleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedArticles, setExpandedArticles] =
    useState<string[]>([]);
  const [activeWord, setActiveWord] =
    useState<string | null>(null);
  const [deletingWord, setDeletingWord] =
    useState<string | null>(null);
  const [deletingNotebook, setDeletingNotebook] =
    useState<string | null>(null);

  useEffect(() => {
    loadWords();
  }, []);

  async function loadWords() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/words", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "无法加载生词本"
        );
      }

      const nextGroups: ArticleGroup[] =
        Array.isArray(data.groups)
          ? data.groups
          : [];

      setGroups(nextGroups);

      if (nextGroups.length > 0) {
        setExpandedArticles([
          nextGroups[0].article.id,
        ]);
      }
    } catch (err) {
      console.error(
        "Load vocabulary error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "无法加载生词本"
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleArticle(articleId: string) {
    setExpandedArticles((current) => {
      if (current.includes(articleId)) {
        return current.filter(
          (id) => id !== articleId
        );
      }

      return [...current, articleId];
    });
  }

  async function removeWord(
    word: Vocabulary,
    articleId: string
  ) {
    const confirmed = window.confirm(
      `确定要从生词本删除「${word.word}」吗？`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingWord(word.id);

      const response = await fetch("/api/words", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vocabularyId: word.id,
        }),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "删除生词失败"
        );
      }

      setGroups((current) =>
        current
          .map((group) => {
            if (
              group.article.id !== articleId
            ) {
              return group;
            }

            return {
              ...group,
              words: group.words.filter(
                (item) =>
                  item.id !== word.id
              ),
            };
          })
          .filter(
            (group) =>
              group.words.length > 0
          )
      );

      if (activeWord === word.id) {
        setActiveWord(null);
      }
    } catch (err) {
      console.error(
        "Delete vocabulary error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "删除生词失败，请稍后再试。"
      );
    } finally {
      setDeletingWord(null);
    }
  }

  async function removeNotebook(
    articleId: string,
    articleTitle: string
  ) {
    const confirmed = window.confirm(
      `确定要删除「${articleTitle}」的整个生词本吗？\n\n这只会从生词本中移除这篇文章的所有单词，不会删除原文章。`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingNotebook(articleId);

      const response = await fetch("/api/words", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
        }),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "删除笔记本失败"
        );
      }

      setGroups((current) =>
        current.filter(
          (group) =>
            group.article.id !== articleId
        )
      );

      setExpandedArticles((current) =>
        current.filter(
          (id) => id !== articleId
        )
      );

      if (activeWord) {
        setActiveWord(null);
      }
    } catch (err) {
      console.error(
        "Delete notebook error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "删除笔记本失败，请稍后再试。"
      );
    } finally {
      setDeletingNotebook(null);
    }
  }

  const totalWords = useMemo(() => {
    return groups.reduce(
      (total, group) =>
        total + group.words.length,
      0
    );
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return groups;
    }

    return groups
      .map((group) => {
        const articleMatches =
          group.article.title
            .toLowerCase()
            .includes(keyword);

        const matchedWords =
          group.words.filter((word) => {
            return (
              word.word
                .toLowerCase()
                .includes(keyword) ||
              (word.meaning || "")
                .toLowerCase()
                .includes(keyword) ||
              (word.partOfSpeech || "")
                .toLowerCase()
                .includes(keyword)
            );
          });

        if (
          articleMatches ||
          matchedWords.length > 0
        ) {
          return {
            ...group,
            words: articleMatches
              ? group.words
              : matchedWords,
          };
        }

        return null;
      })
      .filter(
        (
          group
        ): group is ArticleGroup =>
          group !== null
      );
  }, [groups, search]);

  if (loading) {
    return (
      <main className="notes-page">
        <div className="notes-container">
          <div className="loading-card">
            <div className="loading-spinner" />

            <h2>正在加载生词本</h2>

            <p>
              正在从数据库读取你的学习记录……
            </p>
          </div>
        </div>

        <style jsx>{`
          .notes-page {
            min-height: 100vh;
            background: #f7f8fc;
            padding: 70px 20px;
          }

          .notes-container {
            width: min(900px, 100%);
            margin: 0 auto;
          }

          .loading-card {
            min-height: 320px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid #e7e9ef;
            border-radius: 20px;
            background: #fff;
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
            margin: 20px 0 7px;
            font-size: 19px;
            color: #30343e;
          }

          .loading-card p {
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
      <main className="notes-page">
        <div className="notes-container">
          <div className="error-card">
            <div className="error-icon">!</div>

            <h2>无法加载生词本</h2>

            <p>{error}</p>

            <button onClick={loadWords}>
              重新加载
            </button>
          </div>
        </div>

        <style jsx>{`
          .notes-page {
            min-height: 100vh;
            background: #f7f8fc;
            padding: 70px 20px;
          }

          .notes-container {
            width: min(900px, 100%);
            margin: 0 auto;
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
    <main className="notes-page">
      <div className="notes-container">
        <header className="notes-header">
          <div>
            <div className="page-label">
              MY VOCABULARY
            </div>

            <h1>📑 我的生词本</h1>

            <p>
              生词按照你阅读过的文章逐篇归类。
            </p>
          </div>

          <div className="stats">
            <div className="stat-box">
              <strong>
                {totalWords}
              </strong>

              <span>个生词</span>
            </div>

            <div className="stat-box">
              <strong>
                {groups.length}
              </strong>

              <span>篇文章</span>
            </div>
          </div>
        </header>

        {totalWords > 0 && (
          <div className="search-box">
            <span className="search-icon">
              🔍
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="搜索单词、中文释义或文章……"
            />

            {search && (
              <button
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}
          </div>
        )}

        {groups.length === 0 ? (
          <EmptyNotes />
        ) : filteredGroups.length === 0 ? (
          <div className="no-result">
            <div className="no-result-icon">
              🔍
            </div>

            <h2>
              没有找到相关内容
            </h2>

            <p>
              换一个单词、中文释义或文章标题试试。
            </p>

            <button
              onClick={() =>
                setSearch("")
              }
            >
              显示全部
            </button>
          </div>
        ) : (
          <section className="article-groups">
            {filteredGroups.map(
              (group) => {
                const articleId =
                  group.article.id;

                const expanded =
                  expandedArticles.includes(
                    articleId
                  );

                const deleting =
                  deletingNotebook ===
                  articleId;

                return (
                  <article
                    key={articleId}
                    className={`article-group ${
                      expanded
                        ? "article-group-expanded"
                        : ""
                    }`}
                  >
                    <div className="article-header-row">
                      <button
                        className="article-header"
                        onClick={() =>
                          toggleArticle(
                            articleId
                          )
                        }
                      >
                        <div className="article-icon">
                          📖
                        </div>

                        <div className="article-info">
                          <div className="article-label">
                            ARTICLE
                          </div>

                          <h2>
                            {
                              group.article
                                .title
                            }
                          </h2>

                          <div className="article-meta">
                            {group.article
                              .level && (
                              <span>
                                {
                                  group.article
                                    .level
                                }
                              </span>
                            )}

                            <span>
                              {group.words.length}{" "}
                              个生词
                            </span>

                            <span>
                              {formatDate(
                                group.article
                                  .createdAt
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="article-expand">
                          {expanded
                            ? "−"
                            : "+"}
                        </div>
                      </button>

                      <button
                        className="notebook-delete-button"
                        disabled={deleting}
                        onClick={() =>
                          removeNotebook(
                            articleId,
                            group.article.title
                          )
                        }
                      >
                        {deleting
                          ? "删除中..."
                          : "🗑 删除笔记本"}
                      </button>
                    </div>

                    {expanded && (
                      <div className="article-word-list">
                        {group.words.map(
                          (
                            word,
                            index
                          ) => {
                            const active =
                              activeWord ===
                              word.id;

                            const deletingWordNow =
                              deletingWord ===
                              word.id;

                            return (
                              <div
                                key={word.id}
                                className={`word-card ${
                                  active
                                    ? "word-card-active"
                                    : ""
                                }`}
                              >
                                <button
                                  className="word-main"
                                  onClick={() =>
                                    setActiveWord(
                                      active
                                        ? null
                                        : word.id
                                    )
                                  }
                                >
                                  <div className="word-index">
                                    {String(
                                      index +
                                        1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}
                                  </div>

                                  <div className="word-info">
                                    <div className="word-title-row">
                                    <div className="word-title-with-audio">
                                      <h3>
                                        {word.word}
                                      </h3>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                         e.stopPropagation();
                                         speak(word.word);
                                        }}
                                        className="audio-button"
                                      >
                                       🔊
                                      </button>
                                    </div>
                                      {word.partOfSpeech && (
                                        <span className="part-of-speech">
                                          {
                                            word.partOfSpeech
                                          }
                                        </span>
                                      )}
                                    </div>

                                    {word.meaning && (
                                      <p>
                                        {
                                          word.meaning
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <span className="word-expand">
                                    {active
                                      ? "−"
                                      : "+"}
                                  </span>
                                </button>

                                {active && (
                                  <div className="word-detail">
                                    {word.meaning && (
                                      <div className="detail-section">
                                        <div className="detail-label">
                                          中文释义
                                        </div>

                                        <div className="detail-text">
                                          {
                                            word.meaning
                                          }
                                        </div>
                                      </div>
                                    )}

                                    {word.example && (
                                      <div className="detail-section">
                                        <div className="detail-label">
                                          例句
                                        </div>

                                        <div className="example">
                                         {word.example}

                                        <button
                                         type="button"
                                         onClick={() =>
                                           speak(word.example || "")
                                         }
                                        >
                                         🗣️
                                        </button>
                                      </div>
                                      </div>
                                    )}

                                    <div className="word-actions">
                                      <button
                                        className="delete-button"
                                        disabled={
                                          deletingWordNow
                                        }
                                        onClick={() =>
                                          removeWord(
                                            word,
                                            articleId
                                          )
                                        }
                                      >
                                        {deletingWordNow
                                          ? "正在删除..."
                                          : "🗑 删除生词"}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </section>
        )}

        {totalWords > 0 && (
          <div className="bottom-tip">
            <span>💡</span>

            <p>
              生词已经按照文章自动归类。
              建议复习完一篇文章后，再复习下一篇。
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .notes-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(99, 102, 241, 0.07),
              transparent 35rem
            ),
            #f7f8fc;
          color: #1d2029;
          padding: 45px 20px 90px;
        }

        .notes-container {
          width: min(900px, 100%);
          margin: 0 auto;
        }

        .notes-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 28px;
        }

        .page-label {
          margin-bottom: 11px;
          color: #6366f1;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .notes-header h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.1;
          letter-spacing: -0.04em;
        }

        .notes-header p {
          margin: 10px 0 0;
          color: #858b98;
          font-size: 13px;
          line-height: 1.6;
        }

        .stats {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .stat-box {
          display: flex;
          align-items: baseline;
          gap: 5px;
          padding: 12px 14px;
          border: 1px solid #e5e7ed;
          border-radius: 12px;
          background: #fff;
        }

        .stat-box strong {
          color: #6366f1;
          font-size: 21px;
        }

        .stat-box span {
          color: #858b98;
          font-size: 10px;
        }

        .search-box {
          display: flex;
          align-items: center;
          height: 48px;
          margin-bottom: 18px;
          padding: 0 14px;
          border: 1px solid #e4e6ed;
          border-radius: 13px;
          background: #fff;
          box-shadow:
            0 5px 20px
            rgba(30, 35, 55, 0.025);
        }

        .search-icon {
          margin-right: 10px;
          color: #9aa0ac;
          font-size: 21px;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #30343e;
          font-size: 13px;
        }

        .search-box input::placeholder {
          color: #a2a7b2;
        }

        .clear-search {
          border: 0;
          background: transparent;
          color: #999eaa;
          font-size: 20px;
          cursor: pointer;
        }

        .article-groups {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .article-group {
          overflow: hidden;
          border: 1px solid #e5e7ee;
          border-radius: 17px;
          background: #fff;
          box-shadow:
            0 6px 24px
            rgba(25, 30, 45, 0.025);
        }

        .article-group-expanded {
          border-color: #d8daf4;
        }

        .article-header-row {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 8px;
          padding-right: 12px;
        }

        .article-header {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          gap: 14px;
          padding: 19px;
          border: 0;
          background: #fff;
          text-align: left;
          cursor: pointer;
        }

        .article-header:hover {
          background: #fafaff;
        }

        .article-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          border-radius: 12px;
          background: #f0f1fa;
          font-size: 19px;
        }

        .article-info {
          flex: 1;
          min-width: 0;
        }

        .article-label {
          margin-bottom: 4px;
          color: #6366f1;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .article-info h2 {
          margin: 0;
          overflow: hidden;
          color: #2d313b;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .article-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 6px;
          color: #969ba6;
          font-size: 9px;
        }

        .article-meta span {
          padding-right: 7px;
          border-right: 1px solid #e1e3e8;
        }

        .article-meta span:last-child {
          border-right: 0;
        }

        .article-expand {
          width: 25px;
          flex-shrink: 0;
          color: #9ba0ab;
          text-align: center;
          font-size: 21px;
        }

        .notebook-delete-button {
          flex-shrink: 0;
          padding: 8px 11px;
          border: 1px solid #f0d8d8;
          border-radius: 8px;
          background: #fffafa;
          color: #c45b5b;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .notebook-delete-button:hover {
          background: #fff0f0;
        }

        .notebook-delete-button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .article-word-list {
          padding: 0 18px 12px;
          border-top: 1px solid #eef0f4;
          background: #fcfcfd;
        }

        .word-card {
          border-bottom: 1px solid #eef0f4;
        }

        .word-card:last-child {
          border-bottom: 0;
        }

        .word-main {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 16px 4px;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        .word-index {
          width: 34px;
          flex-shrink: 0;
          color: #a4a9b4;
          font-size: 9px;
          font-weight: 900;
        }

        .word-info {
          flex: 1;
          min-width: 0;
        }

        .word-title-row {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .word-title-row h3 {
          margin: 0;
          color: #292d37;
          font-size: 15px;
          font-weight: 800;
        }
        
        .word-title-with-audio {
         display: flex;
         align-items: center;
         gap: 8px;
        }
         
        .audio-button {
         width: 30px;
         height: 30px;
         border-radius: 50%;
         border: none;
         background: #eff6ff;
         color: #2563eb;
         font-size: 15px;
         cursor: pointer;
         display: flex;
         align-items: center;
         justify-content: center;
         transition: all 0.2s ease;
        }

        .audio-button:hover {
         background: #dbeafe;
         transform: scale(1.1);
        }

        .audio-button:active {
         transform: scale(0.95);
        }
         
        .part-of-speech {
          padding: 4px 7px;
          border-radius: 6px;
          background: #f1f2f7;
          color: #7c8290;
          font-size: 9px;
          font-weight: 700;
        }

        .word-info p {
          margin: 5px 0 0;
          color: #7f8591;
          font-size: 11px;
          line-height: 1.5;
        }

        .word-expand {
          width: 25px;
          flex-shrink: 0;
          color: #9ba0ab;
          text-align: right;
          font-size: 19px;
        }

        .word-card-active {
          background: #fafaff;
        }

        .word-detail {
          margin: 0 4px 15px 38px;
          padding: 15px;
          border: 1px solid #e9eaf1;
          border-radius: 11px;
          background: #fff;
        }

        .detail-section + .detail-section {
          margin-top: 13px;
        }

        .detail-label {
          margin-bottom: 5px;
          color: #666c78;
          font-size: 10px;
          font-weight: 800;
        }

        .detail-text {
          color: #666c78;
          font-size: 12px;
          line-height: 1.7;
        }

        .example {
          color: #555b68;
          font-size: 12px;
          font-style: italic;
          line-height: 1.7;
        }

        .word-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 14px;
          padding-top: 11px;
          border-top: 1px solid #e8eaf0;
        }

        .delete-button {
          padding: 7px 10px;
          border: 1px solid #f0d8d8;
          border-radius: 8px;
          background: #fffafa;
          color: #c45b5b;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .delete-button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .empty-notes,
        .no-result {
          padding: 75px 25px;
          border: 1px solid #e7e9ef;
          border-radius: 20px;
          background: #fff;
          text-align: center;
        }

        .empty-icon,
        .no-result-icon {
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

        .empty-notes h2,
        .no-result h2 {
          margin: 0;
          color: #30343e;
          font-size: 19px;
        }

        .empty-notes p,
        .no-result p {
          max-width: 380px;
          margin: 9px auto 20px;
          color: #9297a3;
          font-size: 12px;
          line-height: 1.7;
        }

        .empty-notes button,
        .no-result button {
          padding: 10px 17px;
          border: 0;
          border-radius: 10px;
          background: #6366f1;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .bottom-tip {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 18px;
          padding: 15px 17px;
          border-radius: 12px;
          background: #f0f1f9;
        }

        .bottom-tip p {
          margin: 0;
          color: #777d8a;
          font-size: 11px;
          line-height: 1.6;
        }

        @media (max-width: 650px) {
          .notes-page {
            padding: 30px 14px 60px;
          }

          .notes-header {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 20px;
          }

          .stats {
            width: 100%;
          }

          .stat-box {
            flex: 1;
          }

          .article-header-row {
            align-items: flex-start;
            padding: 8px 8px 8px 0;
          }

          .article-header {
            padding: 12px 8px 12px 12px;
          }

          .notebook-delete-button {
            margin-top: 10px;
            white-space: nowrap;
          }

          .article-word-list {
            padding-left: 14px;
            padding-right: 14px;
          }

          .word-detail {
            margin-left: 34px;
          }
        }
      `}</style>
    </main>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  try {
    return new Date(
      value
    ).toLocaleDateString(
      "zh-CN",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );
  } catch {
    return "";
  }
}

function EmptyNotes() {
  return (
    <div className="empty-notes">
      <div className="empty-icon">
        📖
      </div>

      <h2>
        暂时还没有生词
      </h2>

      <p>
        先去分析一篇英文文章，
        然后在重点词汇中点击「加入生词本」。
      </p>

      <button
        onClick={() => {
          window.location.href =
            "/reader";
        }}
      >
        去分析文章
      </button>

      <style jsx>{`
        .empty-notes {
          padding: 80px 25px;
          border: 1px solid #e7e9ef;
          border-radius: 20px;
          background: #ffffff;
          text-align: center;
          box-shadow:
            0 8px 30px
            rgba(25, 30, 45, 0.025);
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

        .empty-notes h2 {
          margin: 0;
          color: #30343e;
          font-size: 19px;
        }

        .empty-notes p {
          max-width: 380px;
          margin: 9px auto 20px;
          color: #9297a3;
          font-size: 12px;
          line-height: 1.7;
        }

        .empty-notes button {
          padding: 10px 17px;
          border: 0;
          border-radius: 10px;
          background: #6366f1;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .empty-notes button:hover {
          opacity: 0.92;
        }
      `}</style>
    </div>
  );
}