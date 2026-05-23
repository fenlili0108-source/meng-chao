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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNLOCK_AT = 5;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  const dreams = await readAllDreams();
  const totalDreams = dreams.length;

  // 解锁门槛:不到 5 个梦直接锁,不调 AI
  if (totalDreams < UNLOCK_AT) {
    const override = await readOverride();
    return NextResponse.json({
      locked: true,
      totalDreams,
      unlockAt: UNLOCK_AT,
      need: UNLOCK_AT - totalDreams,
      override,
    });
  }

  const dreamsHash = computeDreamsHash(dreams);
  const override = await readOverride();

  // ✦ 命中缓存:只要哈希一致且不是 force 刷新,直接复用
  if (!force) {
    const cached = await readCache();
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

  // —— 缓存未命中,真正调 AI ——
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "服务端没找到 DEEPSEEK_API_KEY。请在项目根目录创建 .env.local 并填入,然后重启 dev server。",
      },
      { status: 500 }
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

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });

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
  if (!profile.understanding && profile.motifs.length === 0 && profile.emotion_distribution.length === 0) {
    profile = {
      understanding: "",
      motifs: [],
      emotion_distribution: [],
      motif_frequency: [],
    };
  }

  const generatedAt = new Date().toISOString();

  // 落盘缓存(只在有 understanding 时才存,坏结果不污染缓存)
  if (profile.understanding) {
    await writeCache({
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
