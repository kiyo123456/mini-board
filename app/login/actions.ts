// app/login/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ログインフォームの状態（表示するメッセージ）
export type AuthFormState = {
  error: string | null;
  message: string | null;
};

// ログイン・新規登録（押されたボタンで分ける）
export async function authenticate(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const intent = formData.get("intent");  // "login" か "signup"
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  if (intent === "signup") {
    // 確認メールのリンクを開いたあとに戻ってくる場所（このアプリの /auth/callback）
    const origin = (await headers()).get("origin");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      return { error: `登録できませんでした：${error.message}`, message: null };
    }
    return { error: null, message: "確認メールを送りました。メールのリンクを開くと登録が完了します" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: `ログインできませんでした：${error.message}`, message: null };
  }
  redirect("/");
}

// ログアウトする
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
