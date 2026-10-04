import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Server actions call this first: middleware guards pages, not action POSTs. */
export async function requireAdmin() {
  const jar = await cookies();
  const s = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!s) redirect("/admin/login");
  return s;
}
