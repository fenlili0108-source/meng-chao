import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// OAuth 回调:Supabase 把用户带到这里 + 带一个 ?code=...,
// 这里用 code 换 session(写 cookie),然后跳转回 next。
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
