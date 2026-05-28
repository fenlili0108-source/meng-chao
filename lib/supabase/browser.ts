"use client";

import { createBrowserClient } from "@supabase/ssr";

// 浏览器端用:登录、登出、当前用户。Service role key 绝对不会出现在这里。
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
