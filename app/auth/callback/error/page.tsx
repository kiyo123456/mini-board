// app/auth/error/page.tsx
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">確認できませんでした</h1>
      <p className="mt-4">
        リンクの有効期限が切れているか、すでに使われています。もう一度登録するか、ログインしてください。
      </p>
      <Link href="/login" className="mt-6 inline-block underline">
        ログインページへ
      </Link>
    </main>
  );
}
