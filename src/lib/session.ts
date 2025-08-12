// src/lib/session.ts
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// Read the user if the cookie already exists (SAFE in Server Components)
export async function readUser() {
  const uid = cookies().get("pdl_uid")?.value;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

// Create a user and SET cookie (MUST be called from a Server Action or Route)
export async function ensureUser() {
  "use server";
  const jar = cookies();
  let uid = jar.get("pdl_uid")?.value;

  if (uid) {
    const existing = await prisma.user.findUnique({ where: { id: uid } });
    if (existing) return existing;
  }

  const created = await prisma.user.create({ data: {} });
  jar.set("pdl_uid", created.id, { httpOnly: false, sameSite: "lax", path: "/" });
  return created;
}
