// app/like-button.tsx
"use client";

import { useOptimistic, useState } from "react";
import { toggleLike } from "./actions";

type Like = { liked: boolean; count: number };

// いいねボタン：押した瞬間に ♥ と数を先に変え、裏でサーバーに保存する（楽観的 UI）
export function LikeButton({ postId, liked, count }: { postId: number } & Like) {
  // サーバーから届いた本当の値（liked・count）を元に、「仮の値」を持つ
  // 保存が終わって画面が作り直されると、仮の値は消え、本当の値に戻る
  const [optimistic, setOptimistic] = useOptimistic<Like, Like>(
    { liked, count },
    (_current, next) => next,
  );
  const [error, setError] = useState<string | null>(null);

  async function action() {
    setError(null);
    // ① 先に画面だけ変える
    setOptimistic({
      liked: !optimistic.liked,
      count: optimistic.count + (optimistic.liked ? -1 : 1),
    });
    // ② 裏でサーバーに保存する。失敗したら、仮の値は自動で元に戻る
    try {
      await toggleLike(postId, optimistic.liked);
    } catch {
      setError("いいねできませんでした");
    }
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <button
        type="submit"
        className={optimistic.liked ? "text-pink-600" : "hover:text-pink-600"}
      >
        {optimistic.liked ? "♥" : "♡"} {optimistic.count}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
