/**
 * Server-side fetch helper for the freshify-companies backend.
 */
const COMPANIES_URL =
  process.env.COMPANIES_SERVICE_URL ||
  "https://freshify-companies-sbzaekoo4q-uc.a.run.app";

async function authed(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${COMPANIES_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

export async function get<T>(path: string, token: string): Promise<T> {
  const res = await authed(path, token);
  if (!res.ok) throw new Error(`companies ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function post<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await authed(path, token, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`companies ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function patch<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await authed(path, token, { method: "PATCH", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`companies ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Types (mirror BE schemas) ────────────────────────────────────────────
export interface CompanyListItem {
  companyId: string;
  name: string;
  slug: string | null;
  tier: string | null;
  role: "admin" | "member";
  kind: "personal" | "organization";
}
export interface CompanyDetail {
  companyId: string;
  name: string;
  slug: string | null;
  tier: string | null;
  kind: "personal" | "organization";
  ownerUserId: string;
}
