import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Pop Drop Lock — MVP",
  description: "Prototype app for Pop Drop Lock",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <div className="container flex items-center justify-between py-4">
            <Link href="/" className="font-semibold">Pop Drop Lock</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/events">Events</Link>
              <Link href="/leaderboard">Event Leaderboard</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="container py-6">{children}</main>
      </body>
    </html>
  );
}
