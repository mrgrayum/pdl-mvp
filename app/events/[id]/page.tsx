import { prisma } from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

async function upsertPick(data: FormData) {
  "use server";
  const eventId = data.get("eventId") as string;
  const division = data.get("division") as string;
  const now = new Date();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  if (now >= event.lockAt) throw new Error("Picks are locked.");

  const user = await getUser();

  const entries = [
    { category: "POP", playerId: data.get("MPO_POP") as string, division: "MPO" },
    { category: "DROP", playerId: data.get("MPO_DROP") as string, division: "MPO" },
    { category: "LOCK", playerId: data.get("MPO_LOCK") as string, division: "MPO" },
    { category: "POP", playerId: data.get("FPO_POP") as string, division: "FPO" },
    { category: "DROP", playerId: data.get("FPO_DROP") as string, division: "FPO" },
    { category: "LOCK", playerId: data.get("FPO_LOCK") as string, division: "FPO" },
  ] as const;

  // Validate eligibility + lock usage
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) throw new Error("Active season not found");

  for (const e of entries) {
    if (!e.playerId) continue;
    if (e.category !== "LOCK") {
      const ps = await prisma.playerSeason.findFirst({
        where: { playerId: e.playerId, seasonId: season.id },
      });
      if (!ps || !ps.averageFinish || ps.eventsPlayed < 3) {
        throw new Error("Pop/Drop players must have ≥3 events and an average set.");
      }
    } else {
      // Lock usage cap
      const count = await prisma.pick.count({
        where: {
          userId: user.id,
          category: "LOCK",
          playerId: e.playerId,
          event: { seasonId: season.id },
        },
      });
      if (count >= 5) throw new Error("Lock usage cap reached (5 per season for the same player).");
    }
  }

  // Upsert per category
  for (const e of entries) {
    if (!e.playerId) continue;
    await prisma.pick.upsert({
      where: {
        userId_eventId_division_category: {
          userId: user.id,
          eventId,
          division: e.division as any,
          category: e.category as any,
        },
      },
      update: { playerId: e.playerId },
      create: {
        userId: user.id,
        eventId,
        division: e.division as any,
        category: e.category as any,
        playerId: e.playerId,
      },
    });
  }
  redirect(`/leaderboard?event=${eventId}`);
}

export default async function EventDetail({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return <div>Event not found</div>;
  const user = await getUser();

  const [mpo, fpo] = await Promise.all([
    prisma.player.findMany({ where: { division: "MPO" }, orderBy: { name: "asc" } }),
    prisma.player.findMany({ where: { division: "FPO" }, orderBy: { name: "asc" } }),
  ]);

  const picks = await prisma.pick.findMany({
    where: { userId: user.id, eventId: event.id },
  });

  const getPick = (div: "MPO" | "FPO", cat: "POP" | "DROP" | "LOCK") =>
    picks.find(p => p.division === div && p.category === cat)?.playerId ?? "";

  const lockWarning = new Date() >= event.lockAt ? "Picks are locked for this event." : "";

  return (
    <div className="grid gap-6">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{event.name}</h1>
          <div className="text-sm text-gray-600">
            Starts {new Date(event.startDate).toLocaleString()} • Lock {new Date(event.lockAt).toLocaleString()}
          </div>
        </div>
        <Link className="btn" href={`/leaderboard?event=${event.id}`}>View Leaderboard</Link>
      </div>

      {lockWarning && <div className="card text-red-600">{lockWarning}</div>}

      <form action={upsertPick} className="grid-2">
        <input type="hidden" name="eventId" value={event.id} />

        <div className="card">
          <h2 className="font-semibold mb-3">MPO Picks</h2>
          {["POP","DROP","LOCK"].map((cat) => (
            <div className="mb-3" key={cat}>
              <label className="label">{cat}</label>
              <select name={`MPO_${cat}`} className="select" defaultValue={getPick("MPO", cat as any)}>
                <option value="">— Select Player —</option>
                {mpo.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">FPO Picks</h2>
          {["POP","DROP","LOCK"].map((cat) => (
            <div className="mb-3" key={cat}>
              <label className="label">{cat}</label>
              <select name={`FPO_${cat}`} className="select" defaultValue={getPick("FPO", cat as any)}>
                <option value="">— Select Player —</option>
                {fpo.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="col-span-1 md:col-span-2 flex gap-3">
          <button className="btn-primary" type="submit">Save Picks</button>
          <a className="btn" href="/rules">View Rules</a>
        </div>
      </form>
    </div>
  );
}
