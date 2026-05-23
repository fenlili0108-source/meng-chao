// 「系统对你的理解」一句话——用户对它的反馈和修正。
// 本地 JSON,和 data/dreams.json 同目录。
//
// 状态机:
//   - none      : 用户还没操作
//   - confirmed : 用户点了「准」
//   - rejected  : 用户点了「不准」(但还没自己写)
//   - edited    : 用户写了自己的版本

import { promises as fs } from "node:fs";
import path from "node:path";

export type OverrideStatus = "none" | "confirmed" | "rejected" | "edited";

export interface ProfileOverride {
  status: OverrideStatus;
  // 当 status === "edited" 时,这就是用户写的版本,前端要优先展示它
  userText?: string;
  updatedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "profile_override.json");

const DEFAULT: ProfileOverride = { status: "none" };

async function ensure(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, JSON.stringify(DEFAULT, null, 2), "utf-8");
  }
}

export async function readOverride(): Promise<ProfileOverride> {
  await ensure();
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as ProfileOverride;
    if (parsed && typeof parsed === "object" && parsed.status) return parsed;
    return DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export async function writeOverride(o: ProfileOverride): Promise<ProfileOverride> {
  await ensure();
  const next: ProfileOverride = {
    ...o,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}
