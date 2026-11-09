// next.config.ts
import type { NextConfig } from "next";

// 画像を置いている Supabase の URL（例：https://abcdefghijk.supabase.co、ローカルなら http://127.0.0.1:54321）
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
// ローカルの Supabase につないでいるか
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabaseUrl.hostname);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Server Action に送れるデータの大きさ（初期値は 1MB。画像を送るので 6MB にする）
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  // next/image で表示してよい、外部の画像の場所
  images: {
    // ローカルの Supabase の画像は、最適化せずにそのまま表示する
    unoptimized: isLocalSupabase,
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
