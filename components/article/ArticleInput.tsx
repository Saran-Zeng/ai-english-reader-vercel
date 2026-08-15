"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArticleInput() {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!content.trim()) {
      setError("请先输入英文文章");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI 分析失败");
      }

      if (!data.article?.id) {
        throw new Error("文章创建成功，但没有返回文章 ID");
      }

      router.push(`/articles/${data.article.id}`);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "AI 分析失败，请稍后重试"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          输入英文文章
        </h2>

        <p className="mt-2 text-gray-500">
          粘贴一篇英文文章，AI 将自动分析词汇、句子、语法和文章难度。
        </p>
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Paste your English article here..."
        className="min-h-[320px] w-full rounded-xl border border-gray-300 p-5 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        disabled={loading}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading || !content.trim()}
        className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "AI 正在分析..." : "开始AI分析"}
      </button>
    </div>
  );
}