import { prisma } from "@/src/lib/prisma";

function sum(arr: number[]) { return arr.reduce((a,b)=>a+b,0); }

export default async function Leaderboard({ searchParams }: { searchParams: { event?: string } }) {
  const eventId = searchParams.event ?? null;
  const event = eventId ? await prisma.event.findUnique({ where: { id: eventId } }) : null;
  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });

  if (!event && events.length) {
    return <div className="card">Pick an event on the <a className="underline" href="/events">Events</a> page.</div>;
  }

  const picks = await prisma.pick.findMany({
    where: { eventId: eventId ?? undefined },
    include: { user: true, scores: true },
  });

  const byUser = new Map<string, { name: string, total: number, breakdown: Record<string, number> }>();
  for (const p of picks) {
    const key = p.userId;
    const totalPoints = sum(p.scores.map(s => s.points));
    const bucket = `${p.division}/${p.category}`;
    if (!byUser.has(key)) byUser.set(key, { name: p.user.name ?? p.user.id.slice(0, 6), total: 0, breakdown: {} as any });
    const row = byUser.get(key)!;
    row.total += totalPoints;
    row.breakdown[bucket] = (row.breakdown[bucket] ?? 0) + totalPoints;
  }

  const rows = Array.from(byUser.entries()).map(([userId, row]) => ({ userId, ...row }))
    .sort((a,b) => b.total - a.total);

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Event Leaderboard</h1>
          {event && <div className="text-sm text-gray-600">Event: {event.name}</div>}
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">MPO/Pop</th>
              <th className="py-2 pr-4">MPO/Drop</th>
              <th className="py-2 pr-4">MPO/Lock</th>
              <th className="py-2 pr-4">FPO/Pop</th>
              <th className="py-2 pr-4">FPO/Drop</th>
              <th className="py-2 pr-4">FPO/Lock</th>
              <th className="py-2 pr-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-t">
                <td className="py-2 pr-4">{r.name}</td>
                <td className="py-2 pr-4">{r.breakdown["MPO/POP"] ?? 0}</td>
                <td className="py-2 pr-4">{r.breakdown["MPO/DROP"] ?? 0}</td>
                <td className="py-2 pr-4">{r.breakdown["MPO/LOCK"] ?? 0}</td>
                <td className="py-2 pr-4">{r.breakdown["FPO/POP"] ?? 0}</td>
                <td className="py-2 pr-4">{r.breakdown["FPO/DROP"] ?? 0}</td>
                <td className="py-2 pr-4">{r.breakdown["FPO/LOCK"] ?? 0}</td>
                <td className="py-2 pr-4 font-semibold">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
