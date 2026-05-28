import { NextResponse } from "next/server";
import {
  readOverride,
  writeOverride,
  type OverrideStatus,
  type ProfileOverride,
} from "@/lib/profileOverride";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
  status?: OverrideStatus;
  userText?: string;
}

export async function GET() {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }
  const override = await readOverride(supabase, user.id);
  return NextResponse.json({ override });
}

export async function PATCH(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "请求格式错误。" }, { status: 400 });
  }

  const allowed: OverrideStatus[] = ["none", "confirmed", "rejected", "edited"];
  if (!body.status || !allowed.includes(body.status)) {
    return NextResponse.json(
      { error: "status 必须是 none / confirmed / rejected / edited 之一。" },
      { status: 400 }
    );
  }

  const next: ProfileOverride = { status: body.status };
  if (body.status === "edited") {
    const text = (body.userText ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "选择「修改」时,必须给出新的内容。" },
        { status: 400 }
      );
    }
    next.userText = text;
  }

  const saved = await writeOverride(supabase, user.id, next);
  return NextResponse.json({ override: saved });
}
