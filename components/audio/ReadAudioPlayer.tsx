"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Sentence = {
  id?: string;
  english: string;
  translation?: string | null;
};

type ReaderAudioPlayerProps = {
  sentences: Sentence[];

  /**
   * 可直接指定整篇文章音频
   */
  audioUrl?: string;

  /**
   * 可直接指定每一句音频
   */
  sentenceAudioUrls?: string[];

  /**
   * 没有本地音频时是否允许使用 /api/tts
   */
  enableTTSFallback?: boolean;
};

const SPEEDS = [
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  1.75,
  2,
];

type AudioMode =
  | "local-full"
  | "local-sentence"
  | "tts"
  | "none";

export default function ReadAudioPlayer({
  sentences,
  audioUrl,
  sentenceAudioUrls,
  enableTTSFallback = true,
}: ReaderAudioPlayerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentencesRef = useRef<Sentence[]>([]);
  const currentIndexRef = useRef(0);

  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);

  const objectUrlRef = useRef<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [rate, setRate] = useState(1);

  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [sourceLabel, setSourceLabel] =
    useState("准备朗读");

  const [showSpeedMenu, setShowSpeedMenu] =
    useState(false);

  const [fullAudioUrl, setFullAudioUrl] =
    useState("");

  const [localAudioAvailable, setLocalAudioAvailable] =
    useState(false);

  const safeSentences = useMemo(() => {
    if (!Array.isArray(sentences)) {
      return [];
    }

    return sentences.filter(
      (item) =>
        item &&
        typeof item.english === "string" &&
        item.english.trim().length > 0
    );
  }, [sentences]);

  useEffect(() => {
    sentencesRef.current = safeSentences;
  }, [safeSentences]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  /**
   * 自动识别文章 ID
   *
   * 支持：
   * /articles/xxx
   * /long-articles/xxx
   * /long-reading/xxx
   * /result?id=xxx
   */
  const articleId = useMemo(() => {
    const queryId = searchParams?.get("id");

    if (queryId) {
      return queryId;
    }

    const parts =
      pathname?.split("/").filter(Boolean) || [];

    if (parts.length === 0) {
      return "";
    }

    const last = parts[parts.length - 1];

    const reserved = new Set([
      "articles",
      "long-articles",
      "long-reading",
      "result",
      "reader",
    ]);

    if (!last || reserved.has(last)) {
      return "";
    }

    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  }, [pathname, searchParams]);

  /**
   * 整篇本地音频候选地址
   */
  const localFullCandidates = useMemo(() => {
    const candidates: string[] = [];

    if (audioUrl) {
      candidates.push(audioUrl);
    }

    if (articleId) {
      const id = encodeURIComponent(articleId);

      candidates.push(`/audio/articles/${id}.mp3`);
      candidates.push(`/audio/articles/${id}.wav`);
      candidates.push(`/audio/articles/${id}.m4a`);
      candidates.push(`/audio/articles/${id}.ogg`);
      candidates.push(`/audio/articles/${id}.webm`);
    }

    return Array.from(new Set(candidates));
  }, [articleId, audioUrl]);

  /**
   * 每句话的本地音频候选地址
   */
  const getSentenceCandidates = useCallback(
    (index: number) => {
      const candidates: string[] = [];

      if (
        sentenceAudioUrls &&
        sentenceAudioUrls[index]
      ) {
        candidates.push(
          sentenceAudioUrls[index]
        );
      }

      const sentence =
        sentencesRef.current[index];

      if (sentence?.id) {
        const id = encodeURIComponent(
          sentence.id
        );

        candidates.push(
          `/audio/articles/${id}.mp3`
        );
      }

      if (articleId) {
        const id = encodeURIComponent(
          articleId
        );

        const number = index + 1;

        candidates.push(
          `/audio/articles/${id}-${number}.mp3`
        );

        candidates.push(
          `/audio/articles/${id}-${number}.wav`
        );

        candidates.push(
          `/audio/articles/${id}-${number}.m4a`
        );

        candidates.push(
          `/audio/articles/${id}-${number}.ogg`
        );
      }

      return Array.from(
        new Set(candidates)
      );
    },
    [articleId, sentenceAudioUrls]
  );

  /**
   * 清理 Blob URL
   */
  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(
        objectUrlRef.current
      );

      objectUrlRef.current = null;
    }
  }, []);

  /**
   * 停止当前音频
   */
  const stopAudio = useCallback(() => {
    requestIdRef.current += 1;

    loadingRef.current = false;

    if (audioRef.current) {
      audioRef.current.pause();

      audioRef.current.currentTime = 0;

      audioRef.current.src = "";

      audioRef.current = null;
    }

    cleanupObjectUrl();

    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);

    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    setSourceLabel("准备朗读");
  }, [cleanupObjectUrl]);

  /**
   * 检查音频是否存在
   *
   * HEAD 失败时再尝试 GET。
   * 这样兼容部分静态服务器。
   */
  const checkAudio = useCallback(
    async (url: string) => {
      try {
        const response = await fetch(url, {
          method: "HEAD",
          cache: "no-store",
        });

        if (response.ok) {
          return true;
        }
      } catch {
        // continue
      }

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Range: "bytes=0-1",
          },
          cache: "no-store",
        });

        return (
          response.ok ||
          response.status === 206
        );
      } catch {
        return false;
      }
    },
    []
  );

  /**
   * 自动检测整篇文章音频
   */
  useEffect(() => {
    let cancelled = false;

    async function detectFullAudio() {
      setLocalAudioAvailable(false);
      setFullAudioUrl("");

      for (const candidate of localFullCandidates) {
        if (cancelled) {
          return;
        }

        const exists =
          await checkAudio(candidate);

        if (cancelled) {
          return;
        }

        if (exists) {
          setLocalAudioAvailable(true);
          setFullAudioUrl(candidate);
          return;
        }
      }
    }

    detectFullAudio();

    return () => {
      cancelled = true;
    };
  }, [localFullCandidates, checkAudio]);

  /**
   * 创建 HTMLAudioElement
   */
  const createAudio = useCallback(
    (src: string) => {
      const audio = new Audio();

      audio.preload = "auto";
      audio.src = src;
      audio.playbackRate = rate;

      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (
          !Number.isFinite(audio.duration) ||
          audio.duration <= 0
        ) {
          return;
        }

        const current =
          audio.currentTime;

        const total =
          audio.duration;

        setCurrentTime(current);
        setDuration(total);

        setProgress(
          Math.min(
            100,
            Math.max(
              0,
              (current / total) * 100
            )
          )
        );
      };

      audio.onloadedmetadata = () => {
        if (
          Number.isFinite(audio.duration)
        ) {
          setDuration(audio.duration);
        }
      };

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      audio.onpause = () => {
        if (
          audio.currentTime <
          audio.duration
        ) {
          setIsPlaying(false);
          setIsPaused(true);
        }
      };

      return audio;
    },
    [rate]
  );

  /**
   * 调用项目现有 TTS
   *
   * 注意：
   * 这里不改变你现在的 /api/tts。
   * 你的 DeepSeek / OpenAI 配置继续由
   * app/api/tts/route.ts 负责。
   */
  const generateTTS = useCallback(
    async (
      text: string,
      requestId: number
    ) => {
      const response = await fetch(
        "/api/tts",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text,
            content: text,
          }),
        }
      );

      if (
        requestId !==
        requestIdRef.current
      ) {
        return null;
      }

      if (!response.ok) {
        let message =
          "AI 朗读生成失败";

        try {
          const data =
            await response.json();

          message =
            data?.error ||
            data?.message ||
            message;
        } catch {
          // ignore
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      if (
        !blob ||
        blob.size === 0
      ) {
        throw new Error(
          "服务器没有返回有效音频"
        );
      }

      const url =
        URL.createObjectURL(blob);

      objectUrlRef.current = url;

      return url;
    },
    []
  );

  /**
   * 播放一句
   */
  const playSentence = useCallback(
    async (
      index: number,
      forceTTS = false
    ) => {
      if (
        index < 0 ||
        index >=
          sentencesRef.current.length
      ) {
        return;
      }

      if (loadingRef.current) {
        return;
      }

      const sentence =
        sentencesRef.current[index];

      if (!sentence?.english?.trim()) {
        return;
      }

      loadingRef.current = true;

      const requestId =
        ++requestIdRef.current;

      setCurrentIndex(index);
      currentIndexRef.current = index;

      setIsLoading(true);
      setIsPaused(false);
      setError("");

      stopAudio();

      const activeRequestId =
        ++requestIdRef.current;

      try {
        let source = "";
        let mode: AudioMode = "none";

        /**
         * 第一优先级：
         * 本地分句音频
         */
        if (!forceTTS) {
          const candidates =
            getSentenceCandidates(index);

          for (const candidate of candidates) {
            if (
              activeRequestId !==
              requestIdRef.current
            ) {
              return;
            }

            const exists =
              await checkAudio(candidate);

            if (
              activeRequestId !==
              requestIdRef.current
            ) {
              return;
            }

            if (exists) {
              source = candidate;
              mode = "local-sentence";
              break;
            }
          }
        }

        /**
         * 第二优先级：
         * TTS
         */
        if (!source) {
          if (!enableTTSFallback) {
            throw new Error(
              "没有找到对应的本地音频"
            );
          }

          source =
            (await generateTTS(
              sentence.english,
              activeRequestId
            )) || "";

          mode = "tts";
        }

        if (
          !source ||
          activeRequestId !==
            requestIdRef.current
        ) {
          return;
        }

        const audio =
          createAudio(source);

        if (
          mode === "local-sentence"
        ) {
          setSourceLabel(
            "本地文章音频"
          );
        } else {
          setSourceLabel(
            "AI 自然朗读"
          );
        }

        setIsLoading(false);

        audio.onended = async () => {
          if (
            activeRequestId !==
            requestIdRef.current
          ) {
            return;
          }

          cleanupObjectUrl();

          const nextIndex =
            index + 1;

          if (
            nextIndex <
            sentencesRef.current.length
          ) {
            await playSentence(
              nextIndex
            );
          } else {
            setIsPlaying(false);
            setIsPaused(false);
            setIsLoading(false);
            setProgress(100);
          }
        };

        audio.onerror = async () => {
          if (
            activeRequestId !==
            requestIdRef.current
          ) {
            return;
          }

          /**
           * 本地音频损坏时自动切 TTS
           */
          if (
            mode === "local-sentence" &&
            enableTTSFallback
          ) {
            try {
              cleanupObjectUrl();

              const ttsUrl =
                await generateTTS(
                  sentence.english,
                  activeRequestId
                );

              if (!ttsUrl) {
                throw new Error(
                  "TTS 没有返回音频"
                );
              }

              const ttsAudio =
                createAudio(ttsUrl);

              setSourceLabel(
                "AI 自然朗读"
              );

              ttsAudio.onended =
                async () => {
                  const next =
                    index + 1;

                  if (
                    next <
                    sentencesRef.current.length
                  ) {
                    await playSentence(
                      next
                    );
                  } else {
                    setIsPlaying(false);
                    setIsPaused(false);
                    setIsLoading(false);
                  }
                };

              audioRef.current =
                ttsAudio;

              await ttsAudio.play();

              return;
            } catch {
              // continue
            }
          }

          setError(
            "音频播放失败，请检查音频文件或稍后重试。"
          );

          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
        };

        audio.oncanplay = () => {
          setIsLoading(false);
        };

        audio.onwaiting = () => {
          setIsLoading(true);
        };

        audio.onplaying = () => {
          setIsLoading(false);
          setIsPlaying(true);
          setIsPaused(false);
        };

        await audio.play();

        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);
      } catch (err) {
        if (
          activeRequestId !==
          requestIdRef.current
        ) {
          return;
        }

        console.error(
          "Audio playback error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "音频播放失败"
        );

        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
      } finally {
        loadingRef.current = false;
      }
    },
    [
      checkAudio,
      cleanupObjectUrl,
      createAudio,
      enableTTSFallback,
      generateTTS,
      getSentenceCandidates,
      stopAudio,
    ]
  );

  /**
   * 播放整篇本地文章音频
   */
  const playFullLocalAudio =
    useCallback(async () => {
      if (!fullAudioUrl) {
        return false;
      }

      stopAudio();

      const requestId =
        ++requestIdRef.current;

      setError("");
      setIsLoading(true);
      setSourceLabel(
        "文章原声"
      );

      try {
        const audio =
          createAudio(
            fullAudioUrl
          );

        audio.onended = () => {
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
          setProgress(100);
        };

        audio.onerror = () => {
          setError(
            "文章原声播放失败"
          );

          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
        };

        await audio.play();

        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);

        return true;
      } catch (err) {
        console.error(
          "Full local audio error:",
          err
        );

        setIsLoading(false);

        return false;
      }
    }, [
      createAudio,
      fullAudioUrl,
      stopAudio,
    ]);

  /**
   * 播放 / 暂停
   */
  const handlePlayPause =
    useCallback(async () => {
      if (audioRef.current) {
        if (
          audioRef.current.paused
        ) {
          try {
            await audioRef.current.play();

            setIsPlaying(true);
            setIsPaused(false);
          } catch {
            setError(
              "浏览器阻止了音频播放，请再次点击播放。"
            );
          }
        } else {
          audioRef.current.pause();

          setIsPlaying(false);
          setIsPaused(true);
        }

        return;
      }

      /**
       * 如果有整篇本地音频
       * 优先播放整篇
       */
      if (fullAudioUrl) {
        const played =
          await playFullLocalAudio();

        if (played) {
          return;
        }
      }

      /**
       * 没有整篇音频
       * 就从当前句开始连续播放
       */
      await playSentence(
        currentIndexRef.current
      );
    }, [
      fullAudioUrl,
      playFullLocalAudio,
      playSentence,
    ]);

  /**
   * 停止
   */
  const handleStop = useCallback(() => {
    stopAudio();
    setError("");
  }, [stopAudio]);

  /**
   * 上一句
   */
  const handlePrevious =
    useCallback(async () => {
      const previous =
        Math.max(
          0,
          currentIndexRef.current - 1
        );

      await playSentence(
        previous
      );
    }, [playSentence]);

  /**
   * 下一句
   */
  const handleNext =
    useCallback(async () => {
      const next =
        Math.min(
          sentencesRef.current.length - 1,
          currentIndexRef.current + 1
        );

      await playSentence(next);
    }, [playSentence]);

  /**
   * 修改速度
   */
  const changeRate = useCallback(
    (nextRate: number) => {
      setRate(nextRate);
      setShowSpeedMenu(false);

      if (audioRef.current) {
        audioRef.current.playbackRate =
          nextRate;
      }
    },
    []
  );

  /**
   * 点击进度条
   */
  const handleProgressClick =
    useCallback(
      (
        event: React.MouseEvent<HTMLDivElement>
      ) => {
        if (
          !audioRef.current ||
          !duration
        ) {
          return;
        }

        const rect =
          event.currentTarget.getBoundingClientRect();

        const ratio =
          (event.clientX -
            rect.left) /
          rect.width;

        const newTime =
          Math.max(
            0,
            Math.min(
              duration,
              duration * ratio
            )
          );

        audioRef.current.currentTime =
          newTime;

        setCurrentTime(newTime);

        setProgress(
          (newTime / duration) * 100
        );
      },
      [duration]
    );

  /**
   * 键盘快捷键
   */
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.target instanceof
          HTMLInputElement ||
        event.target instanceof
          HTMLTextAreaElement
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        handlePlayPause();
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        handlePrevious();
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        handleNext();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    handleNext,
    handlePlayPause,
    handlePrevious,
  ]);

  /**
   * sentences 变化时重置
   */
  useEffect(() => {
    stopAudio();

    setCurrentIndex(0);
    currentIndexRef.current = 0;

    setError("");
  }, [safeSentences, stopAudio]);

  /**
   * 卸载时清理
   */
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const currentSentence =
    safeSentences[currentIndex];

  const formatTime = (
    seconds: number
  ) => {
    if (
      !Number.isFinite(seconds) ||
      seconds < 0
    ) {
      return "0:00";
    }

    const minutes =
      Math.floor(seconds / 60);

    const secs =
      Math.floor(seconds % 60);

    return `${minutes}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  if (safeSentences.length === 0) {
    return null;
  }

  return (
    <section className="reader-audio">
      <div className="audio-top">
        <div className="audio-heading">
          <div className="audio-icon">
            🔊
          </div>

          <div>
            <div className="audio-label">
              ENGLISH AUDIO
            </div>

            <h3>
              英语自然朗读
            </h3>

            <p>
              {localAudioAvailable
                ? "检测到文章音频，优先播放原声"
                : "没有文章音频时自动使用 AI 朗读"}
            </p>
          </div>
        </div>

        <div className="audio-status">
          <span
            className={
              isPlaying
                ? "status-dot status-playing"
                : "status-dot"
            }
          />

          <span>
            {isLoading
              ? "正在加载音频"
              : isPlaying
              ? "正在播放"
              : isPaused
              ? "已暂停"
              : "准备播放"}
          </span>
        </div>
      </div>

      <div className="audio-current">
        <div className="sentence-number">
          {String(
            currentIndex + 1
          ).padStart(2, "0")}

          <span>
            /
            {String(
              safeSentences.length
            ).padStart(2, "0")}
          </span>
        </div>

        <div className="sentence-text">
          {currentSentence?.english}
        </div>

        {currentSentence?.translation && (
          <div className="sentence-translation">
            {currentSentence.translation}
          </div>
        )}
      </div>

      <div
        className="audio-progress"
        onClick={handleProgressClick}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="audio-progress-fill"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="audio-time">
        <span>
          {formatTime(currentTime)}
        </span>

        <span>
          {duration
            ? formatTime(duration)
            : "0:00"}
        </span>
      </div>

      {error && (
        <div className="audio-error">
          <span>!</span>

          <div>
            <strong>
              音频播放提示
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="audio-controls">
        <button
          type="button"
          className="audio-secondary-button"
          onClick={handlePrevious}
          disabled={
            currentIndex <= 0 ||
            isLoading
          }
          aria-label="上一句"
        >
          ◀
        </button>

        <button
          type="button"
          className="audio-main-button"
          onClick={handlePlayPause}
          disabled={isLoading}
          aria-label={
            isPlaying
              ? "暂停"
              : "播放"
          }
        >
          {isLoading ? (
            <span className="spinner" />
          ) : isPlaying ? (
            "Ⅱ"
          ) : (
            "▶"
          )}
        </button>

        <button
          type="button"
          className="audio-secondary-button"
          onClick={handleNext}
          disabled={
            currentIndex >=
              safeSentences.length - 1 ||
            isLoading
          }
          aria-label="下一句"
        >
          ▶
        </button>

        <button
          type="button"
          className="audio-stop-button"
          onClick={handleStop}
          disabled={
            !isPlaying &&
            !isPaused
          }
        >
          ■ 停止
        </button>

        <div className="speed-wrapper">
          <button
            type="button"
            className="speed-button"
            onClick={() =>
              setShowSpeedMenu(
                (value) => !value
              )
            }
          >
            {rate}×
          </button>

          {showSpeedMenu && (
            <div className="speed-menu">
              {SPEEDS.map(
                (speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={
                      rate === speed
                        ? "speed-active"
                        : ""
                    }
                    onClick={() =>
                      changeRate(
                        speed
                      )
                    }
                  >
                    {speed}×
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="audio-bottom">
        <div className="source-info">
          <span className="source-icon">
            {sourceLabel ===
            "文章原声"
              ? "🎧"
              : sourceLabel ===
                "本地文章音频"
              ? "🎵"
              : "✨"}
          </span>

          <span>
            {sourceLabel}
          </span>
        </div>

        <div className="audio-actions">
          <button
            type="button"
            onClick={() =>
              playSentence(
                currentIndex
              )
            }
            disabled={isLoading}
          >
            重新朗读本句
          </button>

          {fullAudioUrl && (
            <button
              type="button"
              onClick={
                playFullLocalAudio
              }
              disabled={isLoading}
            >
              🎧 播放文章原声
            </button>
          )}
        </div>
      </div>

      <div className="audio-tip">
        <span>💡</span>

        <span>
          空格键播放 / 暂停 · ← → 切换句子
        </span>
      </div>

      <style jsx>{`
        .reader-audio {
          width: 100%;
          margin: 22px 0;
          padding: 24px;
          border: 1px solid #e7e9ef;
          border-radius: 20px;
          background: linear-gradient(
            145deg,
            #ffffff 0%,
            #fafbff 100%
          );
          box-shadow:
            0 12px 35px
            rgba(25, 30, 50, 0.06);
        }

        .audio-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .audio-heading {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .audio-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          border-radius: 14px;
          background: #f0efff;
          font-size: 20px;
        }

        .audio-label {
          color: #6366f1;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .audio-top h3 {
          margin: 4px 0 0;
          color: #1d2029;
          font-size: 17px;
        }

        .audio-top p {
          margin: 4px 0 0;
          color: #8a909d;
          font-size: 11px;
        }

        .audio-status {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border: 1px solid #e8eaf0;
          border-radius: 999px;
          color: #7a808d;
          background: #fff;
          font-size: 10px;
          white-space: nowrap;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c7cad2;
        }

        .status-playing {
          background: #6366f1;
          box-shadow:
            0 0 0 4px
            rgba(99, 102, 241, 0.1);
        }

        .audio-current {
          padding: 20px;
          border-radius: 16px;
          background: #f6f7fb;
          border: 1px solid #eceef3;
        }

        .sentence-number {
          margin-bottom: 8px;
          color: #6366f1;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .sentence-number span {
          color: #a4a8b2;
          margin-left: 4px;
        }

        .sentence-text {
          color: #252934;
          font-size: 17px;
          font-weight: 650;
          line-height: 1.75;
        }

        .sentence-translation {
          margin-top: 8px;
          color: #8b909c;
          font-size: 12px;
          line-height: 1.7;
        }

        .audio-progress {
          position: relative;
          height: 7px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9ebf1;
          cursor: pointer;
        }

        .audio-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: #6366f1;
          transition: width 0.12s linear;
        }

        .audio-time {
          display: flex;
          justify-content: space-between;
          margin-top: 7px;
          color: #969ba6;
          font-size: 10px;
        }

        .audio-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }

        .audio-secondary-button,
        .audio-main-button,
        .audio-stop-button,
        .speed-button {
          border: 0;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            background 0.15s ease;
        }

        .audio-secondary-button:hover:not(:disabled),
        .audio-main-button:hover:not(:disabled),
        .audio-stop-button:hover:not(:disabled),
        .speed-button:hover {
          transform: translateY(-1px);
        }

        .audio-secondary-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f0f1f5;
          color: #4d5260;
          font-size: 13px;
        }

        .audio-main-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #6366f1;
          color: #fff;
          font-size: 18px;
          box-shadow:
            0 8px 18px
            rgba(99, 102, 241, 0.25);
        }

        .audio-stop-button {
          height: 40px;
          padding: 0 13px;
          border-radius: 11px;
          background: #f0f1f5;
          color: #5d626f;
          font-size: 11px;
          font-weight: 700;
        }

        .audio-secondary-button:disabled,
        .audio-main-button:disabled,
        .audio-stop-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .speed-wrapper {
          position: relative;
        }

        .speed-button {
          min-width: 48px;
          height: 40px;
          padding: 0 11px;
          border-radius: 11px;
          background: #f0f1f5;
          color: #555b68;
          font-size: 11px;
          font-weight: 800;
        }

        .speed-menu {
          position: absolute;
          right: 0;
          bottom: calc(100% + 8px);
          z-index: 30;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
          width: 120px;
          padding: 7px;
          border: 1px solid #e1e3eb;
          border-radius: 12px;
          background: #fff;
          box-shadow:
            0 15px 35px
            rgba(20, 25, 40, 0.12);
        }

        .speed-menu button {
          height: 30px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #606572;
          cursor: pointer;
          font-size: 10px;
        }

        .speed-menu button:hover,
        .speed-menu .speed-active {
          background: #f0efff;
          color: #6366f1;
          font-weight: 800;
        }

        .audio-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #eceef3;
        }

        .source-info {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #8a909d;
          font-size: 10px;
        }

        .source-icon {
          font-size: 13px;
        }

        .audio-actions {
          display: flex;
          gap: 8px;
        }

        .audio-actions button {
          height: 32px;
          padding: 0 10px;
          border: 1px solid #e3e5eb;
          border-radius: 9px;
          background: #fff;
          color: #666c78;
          cursor: pointer;
          font-size: 10px;
        }

        .audio-actions button:hover {
          border-color: #c9c7f5;
          color: #6366f1;
          background: #fafaff;
        }

        .audio-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .audio-error {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 15px;
          padding: 11px 13px;
          border: 1px solid #fecaca;
          border-radius: 11px;
          background: #fff7f7;
        }

        .audio-error > span {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 19px;
          height: 19px;
          flex: 0 0 19px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
        }

        .audio-error strong {
          color: #9f3f3f;
          font-size: 11px;
        }

        .audio-error p {
          margin: 2px 0 0;
          color: #b36a6a;
          font-size: 10px;
          line-height: 1.5;
        }

        .audio-tip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-top: 15px;
          color: #a0a4ae;
          font-size: 9px;
        }

        .spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(
            255,
            255,
            255,
            0.35
          );
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 700px) {
          .reader-audio {
            padding: 18px;
            border-radius: 17px;
          }

          .audio-top {
            align-items: flex-start;
            flex-direction: column;
          }

          .audio-status {
            align-self: flex-start;
          }

          .sentence-text {
            font-size: 15px;
          }

          .audio-controls {
            flex-wrap: wrap;
          }

          .audio-bottom {
            align-items: flex-start;
            flex-direction: column;
          }

          .audio-actions {
            width: 100%;
          }

          .audio-actions button {
            flex: 1;
          }
        }

        @media (max-width: 480px) {
          .audio-secondary-button {
            width: 36px;
            height: 36px;
          }

          .audio-main-button {
            width: 48px;
            height: 48px;
          }

          .audio-stop-button {
            height: 36px;
          }

          .speed-button {
            height: 36px;
          }

          .sentence-text {
            font-size: 14px;
          }
        }
      `}</style>
    </section>
  );
}