import Link from "next/link";
import { prisma } from "@/src/lib/prisma";

export default async function Events() {
  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } , include: { season: true }});
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Events</h1>
      <div className="grid gap-3">
        {events.map(ev => (
          <div key={ev.id} className="card flex items-center justify-between">
            <div>
              <div className="font-semibold">{ev.name}</div>
              <div className="text-sm text-gray-600">
                Season {ev.season.year} • Starts {new Date(ev.startDate).toLocaleString()} • Lock {new Date(ev.lockAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <Link className="btn" href={`/events/${ev.id}`}>Make Picks</Link>
              <Link className="btn" href={`/leaderboard?event=${ev.id}`}>Leaderboard</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
