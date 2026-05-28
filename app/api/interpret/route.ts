import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  parseInterpretation,
  type HistoricalDream,
} from "@/lib/prompts";
import { appendDream, readDreamsDesc } from "@/lib/storage";
import { requireUser } from "@/lib/supabase/server";
import { consumeAiCall } from "@/lib/rateLimit";

export const runtime = "nodejs";

interface InterpretBody {
  rawInput?: string;
  emotions?: string;
  entities?: string;
  dayContext?: string;
}

export async function POST(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  let body: InterpretBody;
  try {
    body = (await req.json()) as InterpretBody;
  } catch {
    return NextResponse.json({ error: "请求格式错误。" }, { status: 400 });
  }

  const rawInput = (body.rawInput ?? "").trim();
  if (!rawInput) {
    return NextResponse.json(
      { error: "梦的内容不能为空——哪怕只是几个关键词也行。" },
      { status: 400 }
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端没找到 DEEPSEEK_API_KEY。" },
      { status: 500 }
    );
  }

  // Rate limit:每天 20 次 AI 调用
  const usage = await consumeAiCall(supabase, user.id);
  if (!usage.ok) {
    return NextResponse.json(
      {
        error: `今天的 AI 配额用完了(${usage.limit} 次/天),明天再来。`,
      },
      { status: 429 }
    );
  }

  // 检索历史(台阶一:最近 5 个)
  const all = await readDreamsDesc(supabase, user.id);
  const history: HistoricalDream[] = all.slice(0, 5).map((d) => ({
    id: d.id,
    createdAt: d.createdAt,
    rawInput: d.rawInput,
    emotions: d.emotions,
  }));

  const userMessage = buildUserMessage(
    {
      rawInput,
      emotions: body.emotions,
      entities: body.entities,
      dayContext: body.dayContext,
    },
    history
  );

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });

  let interpretation: string;
  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });
    interpretation = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!interpretation) {
      return NextResponse.json(
        { error: "模型返回为空,请稍后再试一次。" },
        { status: 502 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      {
        error: "调用解读引擎时出错了。可能是网络或 API key 的问题,稍后再试一次。",
        details: message,
      },
      { status: 502 }
    );
  }

  const parsed = parseInterpretation(interpretation);

  const saved = await appendDream(supabase, user.id, {
    rawInput,
    emotions: body.emotions?.trim() || undefined,
    entities: body.entities?.trim() || undefined,
    dayContext: body.dayContext?.trim() || undefined,
    interpretation,
    interpretationThis: parsed.thisDream || undefined,
    interpretationRelated: parsed.related || undefined,
  });

  return NextResponse.json({
    dream: saved,
    referencedHistoryCount: history.length,
  });
}

export async function GET() {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }
  const all = await readDreamsDesc(supabase, user.id);
  return NextResponse.json({ dreams: all });
}
