// Signed session cookie for the single admin. Edge-safe (used by middleware).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "cst_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

const key = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
};

export async function createSessionToken(email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const admin = (process.env.ADMIN_EMAIL ?? "akivacohen336@gmail.com").toLowerCase();
    return String(payload.email).toLowerCase() === admin ? { email: admin } : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
