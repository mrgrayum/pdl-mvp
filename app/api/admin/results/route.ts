import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const eventId = formData.get("eventId") as string;
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const players = await prisma.player.findMany();
  for (const p of players) {
    const finalPlaceRaw = formData.get(`finalPlace_${p.id}`);
    const dnf = formData.get(`dnf_${p.id}`) ? true : false;
    let finalPlace: number | null = null;
    if (typeof finalPlaceRaw === "string" && finalPlaceRaw.trim() !== "") {
      const n = Number(finalPlaceRaw);
      if (!Number.isNaN(n)) finalPlace = n;
    }
    if (finalPlace !== null || dnf) {
      await prisma.eventResult.upsert({
        where: { eventId_playerId: { eventId, playerId: p.id } },
        update: { finalPlace, dnf },
        create: { eventId, playerId: p.id, division: p.division, finalPlace, dnf },
      });
    }
  }
  return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
