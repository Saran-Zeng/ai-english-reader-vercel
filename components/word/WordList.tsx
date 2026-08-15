import { prisma } from "@/lib/database/prisma";
import WordCard from "./WordCard";

export default async function WordList() {
  const vocabulary = await prisma.vocabulary.findMany({
    orderBy: {
      id: "desc",
    },
    take: 50,
    include: {
      article: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (vocabulary.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <div className="text-5xl">📚</div>

        <h2 className="mt-4 text-xl font-bold text-gray-900">
          还没有词汇
        </h2>

        <p className="mt-2 text-gray-500">
          先去 AI 阅读分析一篇英文文章，AI 会自动提取重点词汇。
        </p>

        <a
          href="/reader"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          去分析文章
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              📚 我的词汇
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              共收录 {vocabulary.length} 个重点词汇
            </p>
          </div>

          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600">
            {vocabulary.length} 个
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {vocabulary.map((item) => (
          <WordCard
            key={item.id}
            word={item.word}
            meaning={item.meaning}
            partOfSpeech={item.partOfSpeech}
            example={item.example}
            articleTitle={item.article?.title}
            articleId={item.article?.id}
          />
        ))}
      </div>
    </div>
  );
}