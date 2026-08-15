import { prisma } from "@/lib/database/prisma";
import Link from "next/link";

export default async function GrammarCard() {
  const grammar = await prisma.grammar.findMany({
    orderBy: {
      id: "desc",
    },
    take: 30,
    include: {
      article: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (grammar.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <div className="text-5xl">📖</div>

        <h2 className="mt-4 text-xl font-bold text-gray-900">
          还没有语法知识
        </h2>

        <p className="mt-2 text-gray-500">
          分析英文文章后，AI 会自动提取重点语法。
        </p>

        <Link
          href="/reader"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          去分析文章
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
        <h2 className="text-xl font-bold text-gray-900">
          📖 语法知识库
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          已从你的文章中提取 {grammar.length} 个重点语法
        </p>
      </div>

      <div className="space-y-5">
        {grammar.map((item, index) => (
          <div
            key={item.id}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {item.title}
                </h2>

                <div className="mt-4 rounded-xl bg-gray-50 p-5">
                  <p className="leading-7 text-gray-700">
                    {item.explanation}
                  </p>
                </div>

                {item.example && (
                  <div className="mt-4 rounded-xl border-l-4 border-purple-300 bg-purple-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                      Example
                    </p>

                    <p className="mt-2 leading-7 text-gray-700">
                      {item.example}
                    </p>
                  </div>
                )}

                {item.article && (
                  <Link
                    href={`/articles/${item.article.id}`}
                    className="mt-4 inline-block text-sm text-blue-600 hover:underline"
                  >
                    来源文章：{item.article.title}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}