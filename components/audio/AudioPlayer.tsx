"use client";

import { useEffect, useRef, useState } from "react";

type AudioPlayerProps = {
  text: string;
  title?: string;
};

export default function AudioPlayer({
  text,
  title = "文章朗读",
}: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(
    null
  );

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function speak() {
    if (!text?.trim()) return;

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setPlaying(true);
      setPaused(false);
    };

    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
    };

    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };

    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
  }

  function pause() {
    if (!playing) return;

    window.speechSynthesis.pause();
    setPaused(true);
  }

  function resume() {
    if (!paused) return;

    window.speechSynthesis.resume();
    setPaused(false);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  }

  function changeRate(newRate: number) {
    setRate(newRate);

    if (playing) {
      window.speechSynthesis.cancel();

      setTimeout(() => {
        const utterance =
          new SpeechSynthesisUtterance(text);

        utterance.lang = "en-US";
        utterance.rate = newRate;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          setPlaying(true);
          setPaused(false);
        };

        utterance.onend = () => {
          setPlaying(false);
          setPaused(false);
        };

        utterance.onerror = () => {
          setPlaying(false);
          setPaused(false);
        };

        utteranceRef.current = utterance;

        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  }

  if (!text?.trim()) {
    return null;
  }

  return (
    <div className="audio-player">
      <div className="audio-title">
        <span className="audio-icon">🔊</span>

        <div>
          <strong>{title}</strong>

          <span>
            {playing
              ? paused
                ? "已暂停"
                : "正在朗读..."
              : "准备朗读"}
          </span>
        </div>
      </div>

      <div className="audio-controls">
        {!playing ? (
          <button
            className="audio-main-button"
            onClick={speak}
          >
            ▶ 开始朗读
          </button>
        ) : paused ? (
          <button
            className="audio-main-button"
            onClick={resume}
          >
            ▶ 继续
          </button>
        ) : (
          <button
            className="audio-main-button"
            onClick={pause}
          >
            ⏸ 暂停
          </button>
        )}

        {playing && (
          <button
            className="audio-stop-button"
            onClick={stop}
          >
            ■ 停止
          </button>
        )}
      </div>

      <div className="audio-speed">
        <span>速度</span>

        {[0.75, 1, 1.25, 1.5].map(
          (speed) => (
            <button
              key={speed}
              className={
                rate === speed
                  ? "speed-active"
                  : ""
              }
              onClick={() =>
                changeRate(speed)
              }
            >
              {speed}×
            </button>
          )
        )}
      </div>

      <style jsx>{`
        .audio-player {
          margin: 18px 0;
          padding: 18px;
          border: 1px solid #e4e7ef;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 6px 22px
            rgba(20, 25, 40, 0.04);
        }

        .audio-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .audio-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: #eef0ff;
          font-size: 20px;
        }

        .audio-title div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .audio-title strong {
          color: #292d38;
          font-size: 14px;
        }

        .audio-title span {
          color: #9298a5;
          font-size: 11px;
        }

        .audio-controls {
          display: flex;
          gap: 8px;
        }

        .audio-main-button,
        .audio-stop-button {
          border: 0;
          border-radius: 9px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
        }

        .audio-main-button {
          background: #6366f1;
          color: white;
        }

        .audio-main-button:hover {
          background: #5558df;
        }

        .audio-stop-button {
          background: #f1f2f6;
          color: #626876;
        }

        .audio-speed {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 13px;
          flex-wrap: wrap;
        }

        .audio-speed > span {
          margin-right: 3px;
          color: #858b98;
          font-size: 11px;
        }

        .audio-speed button {
          border: 1px solid #e0e3eb;
          border-radius: 7px;
          padding: 5px 8px;
          background: #ffffff;
          color: #747a87;
          font-size: 10px;
          cursor: pointer;
        }

        .audio-speed button:hover {
          background: #f7f7ff;
        }

        .audio-speed .speed-active {
          border-color: #bfc3ff;
          background: #eef0ff;
          color: #5b5fe5;
          font-weight: 800;
        }

        @media (max-width: 600px) {
          .audio-player {
            padding: 15px;
          }

          .audio-controls {
            width: 100%;
          }

          .audio-main-button,
          .audio-stop-button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}