// 「系统对你的理解」用户反馈/修改 —— Supabase 版

import type { SupabaseClient } from "@supabase/supabase-js";

export type OverrideStatus = "none" | "confirmed" | "rejected" | "edited";

export interface ProfileOverride {
  status: OverrideStatus;
  userText?: string;
  updatedAt?: string;
}

const DEFAULT: ProfileOverride = { status: "none" };

export async function readOverride(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileOverride> {
  const { data, error } = await supabase
    .from("profile_overrides")
    .select("status, user_text, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT;
  return {
    status: (data.status as OverrideStatus) ?? "none",
    userText: data.user_text ?? undefined,
    updatedAt: data.updated_at ?? undefined,
  };
}

export async function writeOverride(
  supabase: SupabaseClient,
  userId: string,
  o: ProfileOverride
): Promise<ProfileOverride> {
  const { data, error } = await supabase
    .from("profile_overrides")
    .upsert(
      {
        user_id: userId,
        status: o.status,
        user_text: o.userText ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("status, user_text, updated_at")
    .single();
  if (error) throw error;
  return {
    status: data.status as OverrideStatus,
    userText: data.user_text ?? undefined,
    updatedAt: data.updated_at ?? undefined,
  };
}
