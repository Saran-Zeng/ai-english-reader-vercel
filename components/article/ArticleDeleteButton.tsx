"use client";

import { useRouter } from "next/navigation";

type Props = {
  articleId: string;
};

export default function ArticleDeleteButton({ articleId }: Props) {
  const router = useRouter();

  async function handleDelete() {
    const ok = confirm("确定删除这篇文章吗？");

    if (!ok) return;

    await fetch(`/api/articles/${articleId}`, {
      method: "DELETE",
    });

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        padding: "8px 14px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        background: "#ef4444",
        color: "white",
      }}
    >
      删除
    </button>
  );
}