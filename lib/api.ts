/**
 * Server-side fetch helper for the freshify-companies backend.
 */
const COMPANIES_URL =
  process.env.COMPANIES_SERVICE_URL ||
  "https://freshify-companies-sbzaekoo4q-uc.a.run.app";

export const USERS_URL =
  process.env.USERS_SERVICE_URL ||
  "https://freshify-users-sbzaekoo4q-uc.a.run.app";

export const WORKSPACES_URL =
  process.env.WORKSPACES_SERVICE_URL ||
  "https://freshify-workspaces-sbzaekoo4q-uc.a.run.app";

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

/** Generic GET to a sibling sovereign module BE. */
export async function getServiceJson<T>(
  baseUrl: string,
  path: string,
  token: string,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${baseUrl}${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Types (mirror BE schemas) ────────────────────────────────────────────
export interface CompanyListItem {
  companyId: string;
  name: string;
  slug: string | null;
  tier: string | null;
  role: "admin" | "member" | "operator";
  kind: "personal" | "organization";
}
// Sprint 2 / 2.1a — closed CompanyType enum mirrored from the backend.
// Source of truth lives at freshify-companies/src/types/companyType.ts.
export const COMPANY_TYPES = [
  "Enterprise",
  "Client",
  "Sub-Contractor",
  "Partner",
  "Affiliate",
] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export interface CompanyDetail {
  companyId: string;
  name: string;
  slug: string | null;
  tier: string | null;
  kind: "personal" | "organization";
  ownerUserId: string;
  // Sprint 2 / 2.6 — type surfaced so the edit form can render the
  // type selector with the current value pre-selected.
  type: CompanyType | null;
}

export interface AdminCompanyListItem {
  companyId: string;
  name: string;
  slug: string | null;
  tier: string | null;
  // Sprint 2 / 2.2 — surfaces CompanyType so the list can render type chips
  // and the FE can drive the ?type= filter pills.
  type: CompanyType | null;
  kind: "personal" | "organization";
  ownerUserId: string;
  status: "active" | "inactive" | "draft";
  memberCount: number;
  createdAt: string;
}
