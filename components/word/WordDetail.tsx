"use client";

import { useState } from "react";

type WordDetailProps = {
  word: string;
  meaning: string;
  partOfSpeech?: string | null;
  example?: string | null;
};

export default function WordDetail({
  word,
  meaning,
  partOfSpeech,
  example,
}: WordDetailProps) {
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          {word}
        </h1>

        {partOfSpeech && (
          <p className="mt-2 text-sm text-blue-600">
            {partOfSpeech}
          </p>
        )}
      </div>

      <div className="mt-8">
        {!showMeaning ? (
          <button
            type="button"
            onClick={() => setShowMeaning(true)}
            className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700"
          >
            显示中文意思
          </button>
        ) : (
          <div className="rounded-xl bg-gray-50 p-6">
            <p className="text-xl font-semibold text-gray-900">
              {meaning}
            </p>

            {example && (
              <div className="mt-5 rounded-xl bg-white p-5">
                <p className="text-sm font-medium text-gray-500">
                  Example
                </p>

                <p className="mt-2 leading-7 text-gray-700">
                  {example}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowMeaning(false)}
              className="mt-5 text-sm text-gray-500 hover:text-gray-700"
            >
              再测试一次
            </button>
          </div>
        )}
      </div>
    </div>
  );
}