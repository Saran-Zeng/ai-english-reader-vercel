"use client";

import { useState } from "react";
import Link from "next/link";

type WordCardProps = {
  word: string;
  meaning: string;
  partOfSpeech?: string | null;
  example?: string | null;
  articleTitle?: string;
  articleId?: string;
};

export default function WordCard({
  word,
  meaning,
  partOfSpeech,
  example,
  articleTitle,
  articleId,
}: WordCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {word}
          </h2>

          {partOfSpeech && (
            <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              {partOfSpeech}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAnswer(!showAnswer)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          {showAnswer ? "隐藏" : "查看"}
        </button>
      </div>

      <div className="mt-6 rounded-xl bg-gray-50 p-5">
        {showAnswer ? (
          <>
            <p className="text-lg font-medium text-gray-900">
              {meaning}
            </p>

            {example && (
              <div className="mt-4 border-l-4 border-blue-300 bg-white p-4">
                <p className="text-sm leading-6 text-gray-600">
                  {example}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-400">
            先想一下这个单词的意思，再点击「查看」
          </p>
        )}
      </div>

      {articleId && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <Link
            href={`/articles/${articleId}`}
            className="text-sm text-blue-600 hover:underline"
          >
            来源文章：{articleTitle || "查看文章"}
          </Link>
        </div>
      )}
    </div>
  );
}