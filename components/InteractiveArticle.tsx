"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type VocabularyInfo = {
  word: string;
  meaning: string;
  partOfSpeech?: string | null;
  phonetic?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  difficulty?: string | null;
  saved?: boolean;
};

type Props = {
  articleId: string;
  content: string;
  vocabulary?: {
    word: string;
    saved?: boolean;
  }[];
};

type SelectedWord = {
  word: string;
  context: string;
  top: number;
  left: number;
};

const BASIC_WORDS: Record<
  string,
  {
    meaning: string;
    partOfSpeech: string;
  }
> = {
  a: {
    meaning: "一个；一件",
    partOfSpeech: "冠词",
  },
  an: {
    meaning: "一个；一件",
    partOfSpeech: "冠词",
  },
  the: {
    meaning: "这；这个；这些；那个；那些",
    partOfSpeech: "冠词",
  },
  am: {
    meaning: "是",
    partOfSpeech: "be 动词",
  },
  is: {
    meaning: "是",
    partOfSpeech: "be 动词",
  },
  are: {
    meaning: "是",
    partOfSpeech: "be 动词",
  },
  was: {
    meaning: "是；曾经是",
    partOfSpeech: "be 动词",
  },
  were: {
    meaning: "是；曾经是",
    partOfSpeech: "be 动词",
  },
  be: {
    meaning: "是；成为",
    partOfSpeech: "be 动词",
  },
  been: {
    meaning: "是；曾经是",
    partOfSpeech: "be 动词",
  },
  being: {
    meaning: "存在；成为",
    partOfSpeech: "be 动词",
  },
  i: {
    meaning: "我",
    partOfSpeech: "代词",
  },
  you: {
    meaning: "你；你们",
    partOfSpeech: "代词",
  },
  he: {
    meaning: "他",
    partOfSpeech: "代词",
  },
  she: {
    meaning: "她",
    partOfSpeech: "代词",
  },
  it: {
    meaning: "它；这",
    partOfSpeech: "代词",
  },
  we: {
    meaning: "我们",
    partOfSpeech: "代词",
  },
  they: {
    meaning: "他们；她们；它们",
    partOfSpeech: "代词",
  },
  me: {
    meaning: "我",
    partOfSpeech: "代词",
  },
  him: {
    meaning: "他",
    partOfSpeech: "代词",
  },
  her: {
    meaning: "她；她的",
    partOfSpeech: "代词",
  },
  us: {
    meaning: "我们",
    partOfSpeech: "代词",
  },
  them: {
    meaning: "他们；她们；它们",
    partOfSpeech: "代词",
  },
  my: {
    meaning: "我的",
    partOfSpeech: "限定词",
  },
  your: {
    meaning: "你的；你们的",
    partOfSpeech: "限定词",
  },
  his: {
    meaning: "他的",
    partOfSpeech: "限定词",
  },
  our: {
    meaning: "我们的",
    partOfSpeech: "限定词",
  },
  their: {
    meaning: "他们的；她们的；它们的",
    partOfSpeech: "限定词",
  },
  and: {
    meaning: "和；以及",
    partOfSpeech: "连词",
  },
  or: {
    meaning: "或者；还是",
    partOfSpeech: "连词",
  },
  but: {
    meaning: "但是",
    partOfSpeech: "连词",
  },
  if: {
    meaning: "如果；是否",
    partOfSpeech: "连词",
  },
  to: {
    meaning: "到；向；为了",
    partOfSpeech: "介词 / 不定式标记",
  },
  of: {
    meaning: "……的；属于",
    partOfSpeech: "介词",
  },
  in: {
    meaning: "在……里面；在……期间",
    partOfSpeech: "介词",
  },
  on: {
    meaning: "在……上；关于",
    partOfSpeech: "介词",
  },
  at: {
    meaning: "在；向",
    partOfSpeech: "介词",
  },
  for: {
    meaning: "为了；对于",
    partOfSpeech: "介词",
  },
  from: {
    meaning: "来自；从",
    partOfSpeech: "介词",
  },
  with: {
    meaning: "和；与；带有",
    partOfSpeech: "介词",
  },
  by: {
    meaning: "通过；被；在……旁边",
    partOfSpeech: "介词",
  },
  can: {
    meaning: "能够；可以",
    partOfSpeech: "情态动词",
  },
  could: {
    meaning: "能够；可以；可能",
    partOfSpeech: "情态动词",
  },
  may: {
    meaning: "可能；可以",
    partOfSpeech: "情态动词",
  },
  might: {
    meaning: "可能",
    partOfSpeech: "情态动词",
  },
  must: {
    meaning: "必须；一定",
    partOfSpeech: "情态动词",
  },
  should: {
    meaning: "应该",
    partOfSpeech: "情态动词",
  },
  will: {
    meaning: "将；会",
    partOfSpeech: "情态动词",
  },
  would: {
    meaning: "将会；愿意；会",
    partOfSpeech: "情态动词",
  },
  do: {
    meaning: "做；进行",
    partOfSpeech: "动词 / 助动词",
  },
  does: {
    meaning: "做；进行",
    partOfSpeech: "动词 / 助动词",
  },
  did: {
    meaning: "做了；确实",
    partOfSpeech: "动词 / 助动词",
  },
  not: {
    meaning: "不；没有",
    partOfSpeech: "副词",
  },
};

function isBasicWord(word: string) {
  return Boolean(BASIC_WORDS[word.toLowerCase()]);
}

function tokenize(text: string) {
  const regex =
    /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+(?:['’][A-Za-z]+)*)*/g;

  const result: {
    text: string;
    word: boolean;
  }[] = [];

  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      result.push({
        text: text.slice(lastIndex, index),
        word: false,
      });
    }

    result.push({
      text: match[0],
      word: true,
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push({
      text: text.slice(lastIndex),
      word: false,
    });
  }

  return result;
}

function getContext(
  text: string,
  word: string,
  index: number
) {
  const start = Math.max(0, index - 100);

  const end = Math.min(
    text.length,
    index + word.length + 100
  );

  return text
    .slice(start, end)
    .replace(/\s+/g, " ")
    .trim();
}

export default function InteractiveArticle({
  articleId,
  content,
  vocabulary = [],
}: Props) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const [selected, setSelected] =
    useState<SelectedWord | null>(null);

  const [wordInfo, setWordInfo] =
    useState<VocabularyInfo | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [savedWords, setSavedWords] =
    useState<Set<string>>(() => {
      const initial = vocabulary
        .filter((item) => item.saved)
        .map((item) =>
          item.word.toLowerCase()
        );

      return new Set(initial);
    });

  const [saving, setSaving] =
    useState(false);

  const tokens = useMemo(
    () => tokenize(content),
    [content]
  );

  useEffect(() => {
    function handleDocumentClick(
      event: MouseEvent
    ) {
      if (!containerRef.current) {
        return;
      }

      const target =
        event.target as Node | null;

      if (
        target &&
        !containerRef.current.contains(target)
      ) {
        setSelected(null);
        setWordInfo(null);
        setError("");
      }
    }

    document.addEventListener(
      "mousedown",
      handleDocumentClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentClick
      );
    };
  }, []);

  /*
   * ==================================================
   * 英语朗读
   *
   * 完全使用浏览器 SpeechSynthesis。
   * 不依赖 DeepSeek。
   *
   * 所以即使 AI 正在查询、查询失败，
   * 🔊 仍然可以正常使用。
   * ==================================================
   */
  function speakWord(word: string) {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    if (
      !("speechSynthesis" in window)
    ) {
      alert(
        "当前浏览器不支持英语朗读功能。"
      );
      return;
    }

    const text = word.trim();

    if (!text) {
      return;
    }

    try {
      // 停止上一次朗读
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          text
        );

      // 英语朗读
      utterance.lang = "en-US";

      // 稍慢一点，更适合英语学习
      utterance.rate = 0.8;

      utterance.pitch = 1;
      utterance.volume = 1;

      /*
       * 优先寻找英语声音。
       * 如果浏览器没有英语声音，
       * 就让浏览器使用默认声音。
       */
      const voices =
        window.speechSynthesis.getVoices();

      const englishVoice =
        voices.find(
          (voice) =>
            voice.lang
              .toLowerCase()
              .startsWith("en-us")
        ) ||
        voices.find(
          (voice) =>
            voice.lang
              .toLowerCase()
              .startsWith("en")
        );

      if (englishVoice) {
        utterance.voice =
          englishVoice;
      }

      utterance.onerror = (
        event
      ) => {
        console.error(
          "Speech synthesis error:",
          event
        );
      };

      window.speechSynthesis.speak(
        utterance
      );
    } catch (error) {
      console.error(
        "Speak word error:",
        error
      );
    }
  }

  async function handleWordClick(
    word: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    const target =
      event.currentTarget;

    const rect =
      target.getBoundingClientRect();

    /*
     * 当前单词在文章中的位置。
     *
     * data-index 保存的是 token 下标，
     * 所以这里先计算前面 token 的实际文字长度，
     * 再用于获取正确的上下文。
     */
    const tokenIndex = Number(
      target.dataset.index || "0"
    );

    let characterIndex = 0;

    for (
      let i = 0;
      i < tokenIndex;
      i++
    ) {
      characterIndex +=
        tokens[i]?.text.length || 0;
    }

    const context = getContext(
      content,
      word,
      characterIndex
    );

    const normalized =
      word.toLowerCase();

    /*
     * 先显示单词卡。
     *
     * 不等待 AI。
     */
    setSelected({
      word,
      context,
      top: rect.bottom + 8,
      left: Math.min(
        rect.left,
        window.innerWidth - 330
      ),
    });

    setError("");

    /*
     * 先判断是否为基础词。
     *
     * 基础词直接显示，
     * 不需要请求 AI。
     */
    const basic =
      BASIC_WORDS[normalized];

    if (basic) {
      setLoading(false);

      setWordInfo({
        word,
        meaning: basic.meaning,
        partOfSpeech:
          basic.partOfSpeech,
        phonetic: null,
        example: null,
        exampleTranslation: null,
        difficulty: "A1",
        saved:
          savedWords.has(normalized),
      });

      return;
    }

    /*
     * 普通单词：
     *
     * 先清空旧结果，
     * 再请求 AI。
     */
    try {
      setLoading(true);
      setWordInfo(null);

      const response =
        await fetch(
          "/api/word-analysis",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              word,
              context,
              articleId,
            }),
          }
        );

      const data =
        await response.json().catch(
          () => null
        );

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            "单词分析失败。"
        );
      }

      setWordInfo({
        ...data.word,
        saved:
          savedWords.has(normalized) ||
          Boolean(data.word?.saved),
      });
    } catch (err) {
      console.error(
        "Interactive word error:",
        err
      );

      /*
       * 即使 AI 查询失败，
       * 单词卡仍然保持打开。
       *
       * 🔊 朗读仍然可以使用。
       */
      setError(
        err instanceof Error
          ? err.message
          : "无法分析这个单词。"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveWord() {
    if (
      !wordInfo ||
      !articleId
    ) {
      return;
    }

    const normalized =
      wordInfo.word.toLowerCase();

    if (
      savedWords.has(normalized)
    ) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/words",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              articleId,
              word: wordInfo.word,
              meaning:
                wordInfo.meaning,
              partOfSpeech:
                wordInfo.partOfSpeech ||
                null,
              example:
                wordInfo.example ||
                null,
            }),
          }
        );

      const data =
        await response.json().catch(
          () => null
        );

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            "加入生词本失败。"
        );
      }

      setSavedWords(
        (current) => {
          const next =
            new Set(current);

          next.add(normalized);

          return next;
        }
      );

      setWordInfo(
        (current) =>
          current
            ? {
                ...current,
                saved: true,
              }
            : current
      );
    } catch (err) {
      console.error(
        "Save interactive word error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "加入生词本失败，请稍后再试。"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="interactive-article"
    >
      {tokens.map(
        (token, index) => {
          if (!token.word) {
            return (
              <span key={index}>
                {token.text}
              </span>
            );
          }

          const normalized =
            token.text.toLowerCase();

          const saved =
            savedWords.has(
              normalized
            );

          const active =
            selected?.word.toLowerCase() ===
            normalized;

          return (
            <button
              key={index}
              type="button"
              data-index={index}
              className={`article-word ${
                active
                  ? "article-word-active"
                  : ""
              } ${
                saved
                  ? "article-word-saved"
                  : ""
              }`}
              onClick={(event) =>
                handleWordClick(
                  token.text,
                  event
                )
              }
            >
              {token.text}
            </button>
          );
        }
      )}

      {selected && (
        <div
          className="word-popup"
          style={{
            top: Math.max(
              12,
              selected.top
            ),
            left: Math.max(
              12,
              selected.left
            ),
          }}
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          {/* ==============================
              单词卡顶部
              ============================== */}
          <div className="word-popup-header">
            <div>
              {/*
               * 永远直接显示点击的单词。
               *
               * 不等待 AI。
               */}
              <div className="word-popup-word">
                {selected.word}
              </div>

              {wordInfo?.phonetic && (
                <div className="word-popup-phonetic">
                  {
                    wordInfo.phonetic
                  }
                </div>
              )}
            </div>

            {/*
             * 🔊 永远显示。
             *
             * 完全不依赖 AI。
             */}
            <button
              type="button"
              className="word-speak-button"
              onClick={() =>
                speakWord(
                  selected.word
                )
              }
              aria-label="播放发音"
              title="朗读单词"
            >
              🔊
            </button>
          </div>

          {/* ==============================
              AI 查询中
              ============================== */}
          {loading && (
            <div className="word-loading">
              正在查询这个单词...
            </div>
          )}

          {/* ==============================
              AI 查询失败
              ============================== */}
          {error && (
            <div className="word-error">
              <div>
                {error}
              </div>

              <div className="word-error-hint">
                你仍然可以使用上面的
                🔊 朗读。
              </div>
            </div>
          )}

          {/* ==============================
              AI 查询成功
              ============================== */}
          {!loading &&
            !error &&
            wordInfo && (
              <>
                <div className="word-part">
                  {wordInfo.partOfSpeech ||
                    "单词"}
                </div>

                <div className="word-meaning">
                  {wordInfo.meaning}
                </div>

                {/*
                 * 普通词显示 AI 生成的例句。
                 *
                 * 基础词不需要例句。
                 */}
                {!isBasicWord(
                  selected.word
                ) &&
                  wordInfo.example && (
                    <div className="word-example">
                      <div className="word-example-label">
                        例句
                      </div>

                      <div className="word-example-en">
                        {
                          wordInfo.example
                        }
                      </div>

                      {wordInfo.exampleTranslation && (
                        <div className="word-example-cn">
                          {
                            wordInfo.exampleTranslation
                          }
                        </div>
                      )}
                    </div>
                  )}

                {/* ==========================
                    本文语境
                    ========================== */}
                <div className="word-context">
                  <div className="word-context-label">
                    本文语境
                  </div>

                  <div>
                    {selected.context}
                  </div>
                </div>

                {/* ==========================
                    加入生词本
                    ========================== */}
                <button
                  type="button"
                  className={`word-save-button ${
                    wordInfo.saved
                      ? "word-save-button-saved"
                      : ""
                  }`}
                  disabled={
                    saving ||
                    Boolean(
                      wordInfo.saved
                    )
                  }
                  onClick={saveWord}
                >
                  {saving
                    ? "正在加入..."
                    : wordInfo.saved
                      ? "✓ 已加入生词本"
                      : "＋ 加入生词本"}
                </button>
              </>
            )}

          {/* ==============================
              初始状态
              ============================== */}
          {!loading &&
            !error &&
            !wordInfo && (
              <div className="word-loading">
                正在准备...
              </div>
            )}
        </div>
      )}

      <style jsx>{`
        .interactive-article {
          position: relative;
          color: #292d38;
          font-size: 15px;
          line-height: 1.95;
          white-space: pre-wrap;
          word-break: normal;
        }

        /*
         * 每一个英文单词都是独立按钮。
         *
         * 所以：
         * government
         * development
         * difficult
         * important
         *
         * 都可以单独点击。
         */
        .article-word {
          display: inline;
          padding: 1px 1px;
          margin: 0;
          border: 0;
          border-radius: 4px;
          background: transparent;
          color: inherit;
          font: inherit;
          line-height: inherit;
          cursor: pointer;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .article-word:hover {
          background: #eef0ff;
          color: #4f46e5;
        }

        .article-word-active {
          background: #e8eaff;
          color: #4f46e5;
          box-shadow:
            0 0 0 2px #e8eaff;
        }

        /*
         * 已经加入生词本的单词：
         * 显示虚线下划线。
         */
        .article-word-saved {
          text-decoration-line: underline;
          text-decoration-style: dotted;
          text-decoration-color: #a5a8d9;
          text-underline-offset: 3px;
        }

        /*
         * ================================
         * 单词弹窗
         * ================================
         */
        .word-popup {
          position: fixed;
          z-index: 1000;
          width: min(
            320px,
            calc(100vw - 24px)
          );
          max-height: min(
            520px,
            calc(100vh - 30px)
          );
          overflow-y: auto;
          padding: 16px;
          border: 1px solid #e3e5ee;
          border-radius: 15px;
          background: #ffffff;
          box-shadow:
            0 18px 50px
              rgba(
                22,
                28,
                45,
                0.16
              );
        }

        /*
         * 单词 + 🔊
         */
        .word-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .word-popup-word {
          color: #20232d;
          font-size: 20px;
          font-weight: 850;
          line-height: 1.25;
          word-break: break-word;
        }

        .word-popup-phonetic {
          margin-top: 4px;
          color: #8a909c;
          font-size: 12px;
        }

        /*
         * 🔊 朗读按钮
         */
        .word-speak-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border: 1px solid #e1e3eb;
          border-radius: 9px;
          background: #f8f8ff;
          cursor: pointer;
          font-size: 17px;
          transition:
            background 0.15s ease,
            transform 0.1s ease;
        }

        .word-speak-button:hover {
          background: #eef0ff;
        }

        .word-speak-button:active {
          transform: scale(0.94);
        }

        /*
         * 词性
         */
        .word-part {
          display: inline-flex;
          margin-top: 11px;
          padding: 4px 7px;
          border-radius: 6px;
          background: #f1f2f7;
          color: #727886;
          font-size: 10px;
        }

        /*
         * 中文释义
         */
        .word-meaning {
          margin-top: 10px;
          color: #30343e;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.6;
        }

        /*
         * AI 例句
         */
        .word-example {
          margin-top: 13px;
          padding: 11px;
          border-radius: 10px;
          background: #f8f9fb;
        }

        .word-example-label,
        .word-context-label {
          margin-bottom: 5px;
          color: #8b909b;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .word-example-en {
          color: #454a56;
          font-size: 12px;
          line-height: 1.6;
        }

        .word-example-cn {
          margin-top: 5px;
          color: #8a909c;
          font-size: 11px;
          line-height: 1.55;
        }

        /*
         * 本文语境
         */
        .word-context {
          margin-top: 12px;
          padding-top: 11px;
          border-top: 1px solid #eef0f4;
          color: #666c78;
          font-size: 11px;
          line-height: 1.6;
        }

        /*
         * 加入生词本
         */
        .word-save-button {
          width: 100%;
          margin-top: 14px;
          padding: 10px 12px;
          border: 1px solid #dcdfff;
          border-radius: 9px;
          background: #f7f7ff;
          color: #6366f1;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
          transition:
            background 0.15s ease,
            transform 0.1s ease;
        }

        .word-save-button:hover {
          background: #eef0ff;
        }

        .word-save-button:active {
          transform: scale(0.99);
        }

        .word-save-button:disabled {
          cursor: default;
          opacity: 0.85;
        }

        /*
         * 已加入生词本
         */
        .word-save-button-saved {
          border-color: #ccebd9;
          background: #effbf4;
          color: #159447;
        }

        /*
         * AI 查询中
         */
        .word-loading {
          padding: 20px 4px 6px;
          color: #888e9a;
          font-size: 12px;
        }

        /*
         * AI 查询失败
         */
        .word-error {
          margin-top: 14px;
          padding: 10px;
          border-radius: 9px;
          background: #fff2f2;
          color: #c24141;
          font-size: 11px;
          line-height: 1.6;
        }

        .word-error-hint {
          margin-top: 6px;
          color: #8f6666;
          font-size: 10px;
        }

        @media (max-width: 700px) {
          .word-popup {
            width: min(
              310px,
              calc(100vw - 24px)
            );
          }
        }
      `}</style>
    </div>
  );
}