// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/lib/database.types";

// サーバー（Server Component / Server Action / Route Handler）用の Supabase クライアント
// リクエストごとに Cookie が違うので、毎回この関数で新しく作る
export async function createClient() {

  // ログイン状態は、開く人・開く時刻ごとに違う。
  // 「リクエストが来てから動かす」と Next.js に伝える（第4章を参照）
  await connection();

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component から呼ばれた場合は Cookie を書き込めないので無視する。
            // （第4章で作る proxy.ts が代わりに書き込む）
          }
        },
      },
    },
  );
}
