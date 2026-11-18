// app/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { deletePost } from "./actions";
import { LikeButton } from "./like-button";
import { logout } from "./login/actions";
import { PostForm } from "./post-form";
import Image from "next/image";
import { RealtimeRefresher } from "./realtime-refresher";

// ログイン状態を表示する部品
async function UserMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  if (!email) {
    return (
      <Link href="/login" className="text-sm underline">
        ログイン
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-zinc-500">{email}</span>
      <form action={logout}>
        <button type="submit" className="underline">
          ログアウト
        </button>
      </form>
    </div>
  );
}

// ログインしている人にだけ投稿フォームを出す部品
async function PostFormArea() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return (
      <p className="mt-6 text-zinc-500">
        投稿するには
        <Link href="/login" className="underline">
          ログイン
        </Link>
        してください。
      </p>
    );
  }
  return <PostForm />;
}

// 投稿の一覧を取得して表示する部品
async function PostList() {
  const supabase = await createClient();

  // ログインしている人の ID（ログインしていなければ undefined）
  const { data: claimsData } = await supabase.auth.getClaims();
  const myId = claimsData?.claims?.sub;

  // 投稿の一覧と、自分がいいねした投稿は、互いに関係ないので同時に読む（待ち時間が1回分で済む）
  // await Promise.all([処理A, 処理B])
  // → [Aの結果, Bの結果]   ← 必ずこの順番
  const [{ data: posts, error }, { data: likes }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, content, created_at, user_id, image_path, like_count")
      .order("created_at", { ascending: false }),
    myId
      ? supabase.from("likes").select("post_id").eq("user_id", myId)
      : Promise.resolve({ data: [] as { post_id: number }[] }),
  ]);

  if (error) {
    return (
      <p className="mt-6 text-red-600">
        読み込みに失敗しました：{error.message}
      </p>
    );
  }

  // 自分がいいねした投稿の ID（ログインしていなければ空）
  const likedIds = new Set(likes?.map((like) => like.post_id));

  if (posts.length === 0) {
    return <p className="mt-6 text-zinc-500">まだ投稿がありません。</p>;
  }
  
  // postlistの最終的な描画
  return (
    <ul className="mt-6 space-y-3">
      {posts.map((post) => (
        <li key={post.id} className="rounded border border-zinc-200 p-4">
          <p className="whitespace-pre-wrap">{post.content}</p>
          {post.image_path && (
            <Image
              src={
                supabase.storage
                  .from("post-images")
                  .getPublicUrl(post.image_path).data.publicUrl
              }
              alt=""
              width={640}
              height={480}
              className="mt-3 h-auto w-full rounded"
            />
          )}
          <div className="mt-2 flex items-center justify-between text-sm text-zinc-500">
            <span className="flex items-center gap-3">
              <span>
                {new Date(post.created_at).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                })}
              </span>
              {myId ? (
                <LikeButton
                  postId={post.id}
                  liked={likedIds.has(post.id)}
                  count={post.like_count}
                />
              ) : (
                <span>♡ {post.like_count}</span>
              )}
            </span>
            {post.user_id === myId && (
              <span className="flex items-center gap-3">
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">
                  あなたの投稿
                </span>
                <form action={deletePost.bind(null, post.id)}>
                  <button type="submit" className="hover:text-red-600">
                    削除
                  </button>
                </form>
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// 上記三つの関数の結果をまとめて描画
export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">ミニ掲示板</h1>
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      </header>
      <Suspense fallback={null}>
        <PostFormArea />
      </Suspense>
      <Suspense fallback={<p className="mt-6 text-zinc-500">読み込み中…</p>}>
        <PostList />
      </Suspense>
      <RealtimeRefresher />
    </main>
  );
}
