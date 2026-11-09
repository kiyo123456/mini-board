// app/realtime-refresher.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// posts テーブルが変わったら、画面を最新にする（ほかの人の投稿やいいねが、すぐに反映される）
export function RealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => router.refresh(),
      )
      .subscribe();

    // 画面を離れるときに、購読をやめる
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;  // 画面には何も表示しない
}
