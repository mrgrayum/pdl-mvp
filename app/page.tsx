import Link from "next/link";
import Card from "@/components/Card";

export default function Home() {
  return (
    <div className="grid gap-6">
      <Card>
        <h1 className="text-2xl font-bold mb-2">Pop Drop Lock — Prototype</h1>
        <p className="mb-4">Quick MVP to submit picks and see scoring. Uses anonymous cookie users for easy testing.</p>
        <div className="flex gap-3">
          <Link className="btn-primary" href="/events">Go to Events</Link>
          <Link className="btn" href="/rules">Rules</Link>
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold mb-2">Getting started</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Visit <code>/api/init</code> once to seed demo data (if not already seeded).</li>
          <li>Open <Link className="underline" href="/events">Events</Link> and pick the active event.</li>
          <li>Submit your MPO & FPO Pop/Drop/Lock picks before the lock time.</li>
          <li>Admin enters event results, then runs scoring. Check the <Link className="underline" href="/leaderboard">leaderboard</Link>.</li>
        </ol>
      </Card>
    </div>
  );
}
