import { cookies } from "next/headers";

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "sp_session";

export function readSessionToken(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export function requireToken(): string {
  const t = readSessionToken();
  if (!t) throw new Error("no_session");
  return t;
}
