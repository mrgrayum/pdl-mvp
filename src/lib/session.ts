// src/lib/session.ts
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// SAFE to call during page render: just reads cookie if it exists.
export async function readUser() {
  const uid = cookies().get("pdl_uid")?.value;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

// Call this INSIDE a Server Action to create user & set cookie.
export async function ensureUser() {
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
