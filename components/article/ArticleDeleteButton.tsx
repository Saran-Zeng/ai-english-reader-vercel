```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

type ArticleDeleteButtonProps = {
  articleId: string;
  articleTitle: string;
};

export default function ArticleDeleteButton({
  articleId,
  articleTitle,
}: ArticleDeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm(
      `确定要删除《${articleTitle}》吗？\n\n删除后将无法恢复。`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert("删除失败，请稍后再试。");
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="article-delete-button"
      title="删除文章"
    >
      {deleting ? "删除中..." : "🗑 删除"}
    </button>
  );
}
```
