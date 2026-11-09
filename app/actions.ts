// app/actions.ts
"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "post-images"; // 画像を入れるバケット
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 画像は 5MB まで

// 投稿フォームの状態（フォームに表示するエラーと、入力していた本文）
export type PostFormState = {
  error: string | null;
  content: string;
};

// 投稿する
export async function createPost(
  prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const content = String(formData.get("content") ?? "").trim();

  // 入力のチェック（データベースの check 制約と同じ 1〜280 文字）
  if (content.length === 0) {
    return { error: "本文を入力してください", content };
  }
  if (content.length > 280) {
    return { error: "本文は280文字以内にしてください", content };
  }

  const supabase = await createClient();

  // ログインしているか確かめる（Server Action は誰でも呼べるので、必ずここで確かめる）
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { error: "投稿するにはログインしてください", content };
  }

  // 画像が選ばれていれば、Storage にアップロードする
  const image = formData.get("image");
  let imagePath: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      return { error: "画像ファイルを選んでください", content };
    }
    if (image.size > MAX_IMAGE_SIZE) {
      return { error: "画像は5MB以内にしてください", content };
    }

    // 保存場所：<自分の ID>/<重ならない名前>.<拡張子>
    const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
    imagePath = `${data.claims.sub}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(imagePath, image, { contentType: image.type });

    if (uploadError) {
      return {
        error: `画像をアップロードできませんでした：${uploadError.message}`,
        content,
      };
    }
  }

  const { error } = await supabase
    .from("posts")
    .insert({ content, image_path: imagePath });

  if (error) {
    // 投稿に失敗したら、先にアップロードした画像を消しておく
    if (imagePath) {
      await supabase.storage.from(BUCKET).remove([imagePath]);
    }

    return { error: `投稿できませんでした：${error.message}`, content };
  }

  refresh(); // 画面を最新のデータで表示し直す
  return { error: null, content: "" };
}

// 投稿を削除する
export async function deletePost(id: number) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    throw new Error("削除するにはログインしてください");
  }

  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .select("id, image_path");

  if (error) {
    throw new Error(`削除できませんでした：${error.message}`);
  }

  if (data.length === 0) {
    throw new Error(
      "削除できませんでした（対象の投稿がないか、削除が許可されていません）",
    );
  }

  // 画像付きの投稿なら、Storage の画像も消す
  const imagePath = data[0].image_path;
  if (imagePath) {
    await supabase.storage.from(BUCKET).remove([imagePath]);
  }

  refresh();
}

// いいねする・取り消す（liked：今いいねしているか）
export async function toggleLike(postId: number, liked: boolean) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    throw new Error("いいねするにはログインしてください");
  }

  const { error } = liked
    ? await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", claimsData.claims.sub)
    : await supabase.from("likes").insert({ post_id: postId });

  if (error) {
    throw new Error(`いいねできませんでした：${error.message}`);
  }

  refresh();
}
