import { NextResponse } from "next/server";
import { readDreamsDesc } from "@/lib/storage";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }
  const dreams = await readDreamsDesc(supabase, user.id);
  return NextResponse.json({ dreams });
}
