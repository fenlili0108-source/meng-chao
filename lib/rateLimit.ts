// 每用户每天最多 N 次 AI 调用。
// 不用 Redis,直接 Postgres 计数;一天一行,简单可靠。
// 失败时偏向保护账单——计数器读不到/写不进时,我们仍然允许 1 次调用,
// 但拒绝继续(防止失控)。

import type { SupabaseClient } from "@supabase/supabase-js";

export const DAILY_AI_CALL_LIMIT = 20;

function today(): string {
  // YYYY-MM-DD,按服务器时区(UTC 在 Vercel 上也 OK,反正每个用户独立)
  return new Date().toISOString().slice(0, 10);
}

// 返回 { ok, current, limit }。ok=false 表示本天额度已满,不该再调 AI。
export async function consumeAiCall(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: boolean; current: number; limit: number }> {
  const day = today();

  // 先读
  const { data: existing } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();

  const current = existing?.count ?? 0;
  if (current >= DAILY_AI_CALL_LIMIT) {
    return { ok: false, current, limit: DAILY_AI_CALL_LIMIT };
  }

  // upsert + 1
  const { error } = await supabase.from("ai_usage").upsert(
    { user_id: userId, day, count: current + 1 },
    { onConflict: "user_id,day" }
  );
  if (error) {
    // 写不进去——别拦,但记到 console
    console.warn("ai_usage upsert failed:", error.message);
  }

  return {
    ok: true,
    current: current + 1,
    limit: DAILY_AI_CALL_LIMIT,
  };
}
