// app/api/dev-seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    // Season (find-or-create)
    let season = await prisma.season.findFirst({ where: { year: 2025 } });
    if (!season) {
      season = await prisma.season.create({
        data: {
          year: 2025,
          startDate: new Date("2025-02-01T00:00:00Z"),
          endDate: new Date("2025-12-01T00:00:00Z"),
          isActive: true,
        },
      });
    }

    // Event (find-or-create) — lock time set ~24h from now so you can make picks
    let event = await prisma.event.findFirst({
      where: { seasonId: season.id, name: "Prototype Open" },
    });
    if (!event) {
      const start = new Date();
      const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const lock = new Date(Date.now() + 24 * 60 * 60 * 1000);
      event = await prisma.event.create({
        data: {
          seasonId: season.id,
          name: "Prototype Open",
          venue: "MVP Course",
          city: "Anywhere, USA",
          startDate: start,
          endDate: end,
          lockAt: lock,
        },
      });
    }

    // Players (find-or-create)
    const playersToAdd = [
      { name: "Calvin Heimburg", division: "MPO" as any },
      { name: "Paul McBeth", division: "MPO" as any },
      { name: "Ricky Wysocki", division: "MPO" as any },
      { name: "Paige Pierce", division: "FPO" as any },
      { name: "Kristin Tattar", division: "FPO" as any },
      { name: "Holyn Handley", division: "FPO" as any },
    ];
    for (const p of playersToAdd) {
      const exists = await prisma.player.findFirst({
        where: { name: p.name, division: p.division },
      });
      if (!exists) await prisma.player.create({ data: p });
    }

    return NextResponse.json({
      ok: true,
      season: season.year,
      event: event.name,
      lockAt: event.lockAt,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
