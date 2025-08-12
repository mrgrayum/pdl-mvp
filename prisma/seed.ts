// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) Season (find-or-create by year)
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

  // 2) Event (find-or-create by name within season)
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

  // 3) Players (find-or-create by name + division)
  const playersToAdd = [
    { name: "Calvin Heimburg", division: "MPO" as const },
    { name: "Paul McBeth", division: "MPO" as const },
    { name: "Ricky Wysocki", division: "MPO" as const },
    { name: "Paige Pierce", division: "FPO" as const },
    { name: "Kristin Tattar", division: "FPO" as const },
    { name: "Holyn Handley", division: "FPO" as const },
  ];

  const players: { id: string; name: string; division: "MPO" | "FPO" }[] = [];
  for (const p of playersToAdd) {
    let pl = await prisma.player.findFirst({
      where: { name: p.name, division: p.division },
    });
    if (!pl) {
      pl = await prisma.player.create({ data: p });
    }
    players.push(pl);
  }

  // 4) PlayerSeason averages (find-or-create)
  const avgs = [
    { name: "Calvin Heimburg", div: "MPO" as const, events: 10, avg: 6.0 },
    { name: "Paul McBeth", div: "MPO" as const, events: 10, avg: 8.0 },
    { name: "Ricky Wysocki", div: "MPO" as const, events: 10, avg: 7.0 },
    { name: "Paige Pierce", div: "FPO" as const, events: 10, avg: 7.0 },
    { name: "Kristin Tattar", div: "FPO" as const, events: 10, avg: 2.0 },
    { name: "Holyn Handley", div: "FPO" as const, events: 10, avg: 5.0 },
  ];

  for (const a of avgs) {
    const p = players.find((pl) => pl.name === a.name && pl.division === a.div);
    if (!p) continue;
    const existing = await prisma.playerSeason.findFirst({
      where: { playerId: p.id, seasonId: season.id },
    });
    if (!existing) {
      await prisma.playerSeason.create({
        data: {
          playerId: p.id,
          seasonId: season.id,
          division: a.div,
          eventsPlayed: a.events,
          averageFinish: a.avg,
        },
      });
    }
  }

  console.log({
    season: season.year,
    event: event.name,
    lockAt: event.lockAt.toISOString(),
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
