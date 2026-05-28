// 画像缓存 —— Supabase 版。一行/用户。

import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileJson } from "./prompts";
import type { StoredDream } from "./storage";

export interface ProfileCache {
  dreamsHash: string;
  dreamsCount: number;
  generatedAt: string;
  profile: ProfileJson;
}

// 对所有梦的关键字段做稳定哈希。
// 顺序按 createdAt 升序,保证"梦的内容没变"时哈希一致。
export function computeDreamsHash(dreams: StoredDream[]): string {
  const sorted = [...dreams].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1
  );
  const h = crypto.createHash("sha256");
  for (const d of sorted) {
    h.update(d.id);
    h.update("");
    h.update(d.rawInput ?? "");
    h.update("");
    h.update(d.emotions ?? "");
    h.update("");
    h.update(d.entities ?? "");
    h.update("");
    h.update(d.dayContext ?? "");
    h.update("");
  }
  return h.digest("hex");
}

export async function readCache(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileCache | null> {
  const { data, error } = await supabase
    .from("profile_cache")
    .select("dreams_hash, dreams_count, generated_at, profile")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    dreamsHash: data.dreams_hash,
    dreamsCount: data.dreams_count,
    generatedAt: data.generated_at,
    profile: data.profile as ProfileJson,
  };
}

export async function writeCache(
  supabase: SupabaseClient,
  userId: string,
  c: ProfileCache
): Promise<void> {
  const { error } = await supabase.from("profile_cache").upsert(
    {
      user_id: userId,
      dreams_hash: c.dreamsHash,
      dreams_count: c.dreamsCount,
      generated_at: c.generatedAt,
      profile: c.profile,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
