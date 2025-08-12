import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getUser() {
  const jar = await cookies();
  let uid = jar.get("pdl_uid")?.value;
  if (!uid) {
    const user = await prisma.user.create({ data: {} });
    uid = user.id;
    jar.set("pdl_uid", uid, { httpOnly: false, sameSite: "lax", path: "/" });
    return user;
  }
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    const created = await prisma.user.create({ data: {} });
    jar.set("pdl_uid", created.id, { httpOnly: false, sameSite: "lax", path: "/" });
    return created;
  }
  return user;
}
