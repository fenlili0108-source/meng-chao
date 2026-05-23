import { NextResponse } from "next/server";
import { readDreamsDesc } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const dreams = await readDreamsDesc();
  return NextResponse.json({ dreams });
}
