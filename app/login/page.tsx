// app/login/page.tsx
import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">ログイン</h1>
      <LoginForm />
      <Link href="/" className="mt-6 inline-block text-sm text-zinc-500 underline">
        掲示板に戻る
      </Link>
    </main>
  );
}
