import { prisma } from "@/src/lib/prisma";

async function scoreEvent(formData: FormData) {
  "use server";
  const eventId = formData.get("eventId") as string;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  const picks = await prisma.pick.findMany({ where: { eventId }, include: { player: true, event: { include: { season: true } } } });

  for (const pick of picks) {
    const result = await prisma.eventResult.findUnique({ where: { eventId_playerId: { eventId, playerId: pick.playerId } } });
    let pts = 0;
    if (pick.category === "POP") {
      if (result?.dnf) pts = 0;
      else {
        const ps = await prisma.playerSeason.findFirst({ where: { playerId: pick.playerId, seasonId: pick.event.seasonId } });
        if (ps?.averageFinish != null && result?.finalPlace != null) {
          pts = Math.round(ps.averageFinish - result.finalPlace);
        }
      }
    } else if (pick.category === "DROP") {
      if (result?.dnf) pts = 10;
      else {
        const ps = await prisma.playerSeason.findFirst({ where: { playerId: pick.playerId, seasonId: pick.event.seasonId } });
        if (ps?.averageFinish != null && result?.finalPlace != null) {
          pts = Math.round(result.finalPlace - ps.averageFinish);
        }
      }
    } else if (pick.category === "LOCK") {
      if (result?.dnf) pts = 0;
      else if (result?.finalPlace === 1) pts = 25;
      else if ((result?.finalPlace ?? 99) <= 5) pts = 10;
      else if ((result?.finalPlace ?? 99) <= 10) pts = 5;
      else pts = 0;
    }
    await prisma.pickScore.create({ data: { pickId: pick.id, scope: "FINAL", points: pts, reason: "admin score" } });
  }
}

export default async function Admin() {
  const events = await prisma.event.findMany({ orderBy: { startDate: "desc" } });
  const players = await prisma.player.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="grid gap-6">
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Admin</h1>
        <p className="text-sm text-gray-600">Enter event results for players, then run scoring.</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Enter Results</h2>
        <form action={"/api/admin/results"} method="post" className="grid gap-3">
          <label className="label">Event</label>
          <select name="eventId" className="select">
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map(p => (
              <div key={p.id} className="border rounded-xl p-3">
                <div className="font-medium">{p.name} <span className="text-xs text-gray-500">({p.division})</span></div>
                <div className="flex gap-2 mt-2">
                  <input className="input" name={`finalPlace_${p.id}`} placeholder="Final Place (number)" />
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" name={`dnf_${p.id}`} /> DNF
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-primary" type="submit">Save Results</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Score Event</h2>
        <form action={scoreEvent}>
          <label className="label">Event</label>
          <select name="eventId" className="select">
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div className="mt-3">
            <button className="btn-primary" type="submit">Run Scoring</button>
          </div>
        </form>
      </div>
    </div>
  );
}
