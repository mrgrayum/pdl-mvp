// app/events/[id]/page.tsx
import { prisma } from "@/src/lib/prisma";
import { readUser, ensureUser } from "@/src/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

async function upsertPick(formData: FormData) {
  "use server";
  const eventId = formData.get("eventId") as string;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  if (new Date() >= event.lockAt) throw new Error("Picks are locked.");

  // Create a user & set cookie here (this is a Server Action so it's allowed)
  const user = await ensureUser();

  const entries = [
    { division: "MPO", category: "POP",  playerId: formData.get("MPO_POP")  as string },
    { division: "MPO", category: "DROP", playerId: formData.get("MPO_DROP") as string },
    { division: "MPO", category: "LOCK", playerId: formData.get("MPO_LOCK") as string },
    { division: "FPO", category: "POP",  playerId: formData.get("FPO_POP")  as string },
    { division: "FPO", category: "DROP", playerId: formData.get("FPO_DROP") as string },
    { division: "FPO", category: "LOCK", playerId: formData.get("FPO_LOCK") as string },
  ] as const;

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) throw new Error("Active season not found");

  // Rule checks
  for (const e of entries) {
    if (!e.playerId) continue;

    if (e.category !== "LOCK") {
      const ps = await prisma.playerSeason.findFirst({
        where: { playerId: e.playerId, seasonId: season.id },
      });
      if (!ps || ps.eventsPlayed < 3 || ps.averageFinish == null) {
        throw new Error("Pop/Drop players must have ≥3 events and an average set.");
      }
    } else {
      const used = await prisma.pick.count({
        where: {
          userId: user.id,
          category: "LOCK",
          playerId: e.playerId,
          event: { seasonId: season.id },
        },
      });
      if (used >= 5) {
        throw new Error("Lock usage cap reached (5 per season for the same player).");
      }
    }
  }

  // Upsert the six picks
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
  if (!event) return <div className="card">Event not found</div>;

  // Read user (no cookie writing during render)
  const user = await readUser();

  const [mpo, fpo, picks] = await Promise.all([
    prisma.player.findMany({ where: { division: "MPO" }, orderBy: { name: "asc" } }),
    prisma.player.findMany({ where: { division: "FPO" }, orderBy: { name: "asc" } }),
    user
      ? prisma.pick.findMany({ where: { userId: user.id, eventId: event.id } })
      : Promise.resolve([] as any[]),
  ]);

  const getPick = (div: "MPO" | "FPO", cat: "POP" | "DROP" | "LOCK") =>
    picks.find((p) => p.division === div && p.category === cat)?.playerId ?? "";

  const locked = new Date() >= event.lockAt;

  return (
    <div className="grid gap-6">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{event.name}</h1>
          <div className="text-sm text-gray-600">
            Starts {new Date(event.startDate).toLocaleString()} • Lock{" "}
            {new Date(event.lockAt).toLocaleString()}
          </div>
        </div>
        <Link className="btn" href={`/leaderboard?event=${event.id}`}>
          View Leaderboard
        </Link>
      </div>

      {locked && <div className="card text-red-600">Picks are locked for this event.</div>}

      <form action={upsertPick} className="grid-2">
        <input type="hidden" name="eventId" value={event.id} />

        <div className="card">
          <h2 className="font-semibold mb-3">MPO Picks</h2>
          {["POP", "DROP", "LOCK"].map((cat) => (
            <div className="mb-3" key={`MPO_${cat}`}>
              <label className="label">{cat}</label>
              <select
                name={`MPO_${cat}`}
                className="select"
                defaultValue={getPick("MPO", cat as any)}
                disabled={locked}
              >
                <option value="">— Select Player —</option>
                {mpo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">FPO Picks</h2>
          {["POP", "DROP", "LOCK"].map((cat) => (
            <div className="mb-3" key={`FPO_${cat}`}>
              <label className="label">{cat}</label>
              <select
                name={`FPO_${cat}`}
                className="select"
                defaultValue={getPick("FPO", cat as any)}
                disabled={locked}
              >
                <option value="">— Select Player —</option>
                {fpo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {!locked && (
          <div className="col-span-1 md:col-span-2 flex gap-3">
            <button className="btn-primary" type="submi
