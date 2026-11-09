// proxy.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // ページを開くたびに、ログイン状態（Cookie のトークン）を新しくする
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 画像やビルド済みファイルなど、ログイン状態に関係しないものは除く
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
