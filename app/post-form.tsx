// app/post-form.tsx
"use client";

import { useActionState } from "react";
import { createPost, type PostFormState } from "./actions";

const initialState: PostFormState = { error: null, content: "" };

export function PostForm() {
  const [state, formAction, pending] = useActionState(createPost, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-2">
      <textarea
        name="content"
        defaultValue={state.content}
        required
        maxLength={280}
        rows={3}
        placeholder="いまどうしてる？（280文字まで）"
        className="w-full rounded border border-zinc-300 p-3"
      />
      <input
        type="file"
        name="image"
        accept="image/*"
        className="block text-sm text-zinc-600"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "投稿中…" : "投稿する"}
      </button>
    </form>
  );
}
