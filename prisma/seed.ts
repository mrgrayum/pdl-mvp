import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // minimal season and event (lock in the future)
  const season = await prisma.season.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      startDate: new Date("2025-02-01T00:00:00Z"),
      endDate: new Date("2025-12-01T00:00:00Z"),
      isActive: true,
    },
  });

  const start = new Date();
  const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const lock = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const event = await prisma.event.create({
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

  // players
  const players = await prisma.$transaction([
    prisma.player.create({ data: { name: "Calvin Heimburg", division: "MPO" } }),
    prisma.player.create({ data: { name: "Paul McBeth", division: "MPO" } }),
    prisma.player.create({ data: { name: "Ricky Wysocki", division: "MPO" } }),
    prisma.player.create({ data: { name: "Paige Pierce", division: "FPO" } }),
    prisma.player.create({ data: { name: "Kristin Tattar", division: "FPO" } }),
    prisma.player.create({ data: { name: "Holyn Handley", division: "FPO" } }),
  ]);

  // player season averages
  const avgs = [
    { name: "Calvin Heimburg", div: "MPO", events: 10, avg: 6.0 },
    { name: "Paul McBeth", div: "MPO", events: 10, avg: 8.0 },
    { name: "Ricky Wysocki", div: "MPO", events: 10, avg: 7.0 },
    { name: "Paige Pierce", div: "FPO", events: 10, avg: 7.0 },
    { name: "Kristin Tattar", div: "FPO", events: 10, avg: 2.0 },
    { name: "Holyn Handley", div: "FPO", events: 10, avg: 5.0 },
  ] as const;

  for (const a of avgs) {
    const p = players.find((pl) => pl.name === a.name)!;
    await prisma.playerSeason.create({
      data: {
        playerId: p.id,
        seasonId: season.id,
        division: a.div,
        eventsPlayed: a.events,
        averageFinish: a.avg,
      } as any,
    });
  }

  console.log({ season: season.year, event: event.name, lockAt: lock.toISOString() });
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
