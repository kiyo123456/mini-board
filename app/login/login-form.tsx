// app/login/login-form.tsx
"use client";

import { useActionState } from "react";
import { authenticate, type AuthFormState } from "./actions";

const initialState: AuthFormState = { error: null, message: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <label className="block">
        <span className="text-sm">メールアドレス</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded border border-zinc-300 p-2"
        />
      </label>
      <label className="block">
        <span className="text-sm">パスワード（6文字以上）</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          className="mt-1 w-full rounded border border-zinc-300 p-2"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-green-700">{state.message}</p>}
      <div className="flex gap-2">
        <button
          name="intent"
          value="login"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
        >
          ログイン
        </button>
        <button
          name="intent"
          value="signup"
          disabled={pending}
          className="rounded border border-zinc-300 px-4 py-2 disabled:opacity-50"
        >
          新しく登録
        </button>
      </div>
    </form>
  );
}
