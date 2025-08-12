import { NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const pexec = promisify(exec);

export async function GET() {
  try {
    await pexec("node -e "import('./node_modules/.bin/tsx');"").catch(()=>{});
    await pexec("npx tsx prisma/seed.ts");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
