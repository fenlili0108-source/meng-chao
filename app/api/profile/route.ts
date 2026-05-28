import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  PROFILE_SYSTEM_PROMPT,
  buildProfileUserMessage,
  parseProfileJson,
  type ProfileJson,
} from "@/lib/prompts";
import { readAllDreams } from "@/lib/storage";
import { readOverride } from "@/lib/profileOverride";
import { computeDreamsHash, readCache, writeCache } from "@/lib/profileCache";
import { requireUser } from "@/lib/supabase/server";
import { consumeAiCall } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNLOCK_AT = 5;

export async function GET(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  const dreams = await readAllDreams(supabase, user.id);
  const totalDreams = dreams.length;

  if (totalDreams < UNLOCK_AT) {
    const override = await readOverride(supabase, user.id);
    return NextResponse.json({
      locked: true,
      totalDreams,
      unlockAt: UNLOCK_AT,
      need: UNLOCK_AT - totalDreams,
      override,
    });
  }

  const dreamsHash = computeDreamsHash(dreams);
  const override = await readOverride(supabase, user.id);

  // 命中缓存:直接返回
  if (!force) {
    const cached = await readCache(supabase, user.id);
    if (cached && cached.dreamsHash === dreamsHash) {
      return NextResponse.json({
        locked: false,
        totalDreams,
        unlockAt: UNLOCK_AT,
        profile: cached.profile,
        override,
        generatedAt: cached.generatedAt,
        fromCache: true,
      });
    }
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端没找到 DEEPSEEK_API_KEY。" },
      { status: 500 }
    );
  }

  // 真要调 AI 之前过 rate limit
  const usage = await consumeAiCall(supabase, user.id);
  if (!usage.ok) {
    return NextResponse.json(
      {
        error: `今天的 AI 配额用完了(${usage.limit} 次/天)。你可以继续看上次生成的画像。`,
      },
      { status: 429 }
    );
  }

  const userMessage = buildProfileUserMessage(
    dreams.map((d) => ({
      createdAt: d.createdAt,
      rawInput: d.rawInput,
      emotions: d.emotions,
      entities: d.entities,
      dayContext: d.dayContext,
    }))
  );

  const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });

  let raw: string;
  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: [
        { role: "system", content: PROFILE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });
    raw = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      {
        error: "生成画像时出错了。可能是网络或 API 的问题,稍后再试一次。",
        details: message,
      },
      { status: 502 }
    );
  }

  let profile: ProfileJson = parseProfileJson(raw);
  if (
    !profile.understanding &&
    profile.motifs.length === 0 &&
    profile.emotion_distribution.length === 0
  ) {
    profile = {
      understanding: "",
      motifs: [],
      emotion_distribution: [],
      motif_frequency: [],
    };
  }

  const generatedAt = new Date().toISOString();

  if (profile.understanding) {
    await writeCache(supabase, user.id, {
      dreamsHash,
      dreamsCount: totalDreams,
      generatedAt,
      profile,
    });
  }

  return NextResponse.json({
    locked: false,
    totalDreams,
    unlockAt: UNLOCK_AT,
    profile,
    override,
    generatedAt,
    fromCache: false,
  });
}
