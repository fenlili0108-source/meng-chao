// 梦境存储 —— Supabase Postgres (台阶二:多用户)
//
// 函数签名尽量兼容旧版,把数据库 snake_case ↔ 应用 camelCase 的转换
// 局限在这一层。所有读写自动走 RLS:用户只能看到/写入 user_id = auth.uid() 的行,
// 数据库层强制隔离。

import type { SupabaseClient } from "@supabase/supabase-js";

export interface StoredDream {
  id: string;
  createdAt: string;
  rawInput: string;
  emotions?: string;
  entities?: string;
  dayContext?: string;
  interpretation: string;
  interpretationThis?: string;
  interpretationRelated?: string;
}

interface DreamRow {
  id: string;
  user_id: string;
  created_at: string;
  raw_input: string;
  emotions: string | null;
  entities: string | null;
  day_context: string | null;
  interpretation: string | null;
  interpretation_this: string | null;
  interpretation_related: string | null;
}

function rowToDream(r: DreamRow): StoredDream {
  return {
    id: r.id,
    createdAt: r.created_at,
    rawInput: r.raw_input,
    emotions: r.emotions ?? undefined,
    entities: r.entities ?? undefined,
    dayContext: r.day_context ?? undefined,
    interpretation: r.interpretation ?? "",
    interpretationThis: r.interpretation_this ?? undefined,
    interpretationRelated: r.interpretation_related ?? undefined,
  };
}

// 全部梦,按 createdAt 升序(便于哈希、按时间塞 prompt)
export async function readAllDreams(
  supabase: SupabaseClient,
  userId: string
): Promise<StoredDream[]> {
  const { data, error } = await supabase
    .from("dreams")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DreamRow[]).map(rowToDream);
}

// 全部梦,倒序(列表页用)
export async function readDreamsDesc(
  supabase: SupabaseClient,
  userId: string
): Promise<StoredDream[]> {
  const { data, error } = await supabase
    .from("dreams")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DreamRow[]).map(rowToDream);
}

export async function appendDream(
  supabase: SupabaseClient,
  userId: string,
  input: Omit<StoredDream, "id" | "createdAt">
): Promise<StoredDream> {
  const { data, error } = await supabase
    .from("dreams")
    .insert({
      user_id: userId,
      raw_input: input.rawInput,
      emotions: input.emotions ?? null,
      entities: input.entities ?? null,
      day_context: input.dayContext ?? null,
      interpretation: input.interpretation,
      interpretation_this: input.interpretationThis ?? null,
      interpretation_related: input.interpretationRelated ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToDream(data as DreamRow);
}

// 删除一条梦。RLS 已经保证只能删自己的,这里再带 user_id 是双保险。
// 返回真实删除的行数。0 表示该 id 不存在或不属于该用户。
export async function deleteDream(
  supabase: SupabaseClient,
  userId: string,
  dreamId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("dreams")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("id", dreamId);
  if (error) throw error;
  return count ?? 0;
}

// 删光该用户的所有梦。返回删了几行。
export async function deleteAllDreamsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("dreams")
    .delete({ count: "exact" })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}
