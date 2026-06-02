/**
 * UCM-Roles — Company Role Settings.
 *
 * Read-only catalog view of `company.v1` from role_catalogs.
 * Operator-only for now (the catalog is framework-shipped; future versions
 * will allow per-customer fork via Layer 2).
 */
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { readSessionToken, decodeClaims } from "@/lib/session";
import {
  get,
  getServiceJson,
  USERS_URL,
  type CompanyDetail,
} from "@/lib/api";
import { Chrome } from "@/lib/Chrome";
import { loadChromeContext } from "@/lib/chromeContext";

export const dynamic = "force-dynamic";

interface RoleEntry {
  key: string;
  name: string;
  rank: number;
  capabilities: string[];
  isAutoAssigned: "owner_on_create" | "invite_default" | null;
}

interface RoleCatalog {
  catalogId: string;
  scope: "company" | "workspace" | "module";
  moduleKey: string | null;
  version: number;
  roles: RoleEntry[];
  updatedAt: string;
}

const ALL_CAPS: string[] = [
  "read",
  "write",
  "manage_users",
  "manage_settings",
  "manage_roles",
  "transfer_ownership",
  "delete",
];

const CAP_LABEL: Record<string, string> = {
  read: "Read",
  write: "Write",
  manage_users: "Manage users",
  manage_settings: "Manage settings",
  manage_roles: "Manage roles",
  transfer_ownership: "Transfer ownership",
  delete: "Delete",
};

function handleFromEmail(email?: string | null): string {
  if (!email) return "user";
  if (email.startsWith("+")) return email.replace(/[^0-9]/g, "");
  return email.split("@")[0] || email;
}

function shortId(id: string): string {
  const cleaned = id.replace(/^cmp_/, "").replace(/[^A-Za-z0-9]/g, "");
  return `#C-${cleaned.slice(0, 4).toUpperCase()}`;
}

export default async function CompanyRolesPage({
  params,
}: {
  params: { companyId: string };
}) {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const isOperator = Boolean(claims.operator);
  if (!isOperator) redirect(`/dashboard/companies/${params.companyId}`);

  const ctx = await loadChromeContext();
  const displayName = claims.displayName || claims.email || "User";
  const handle = handleFromEmail(claims.email);

  let company: CompanyDetail | null = null;
  let catalog: RoleCatalog | null = null;
  let error: string | null = null;
  try {
    company = await get<CompanyDetail>(
      `/v1/companies/${params.companyId}`,
      token,
    );
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("404")) notFound();
    error = msg;
  }
  try {
    catalog = await getServiceJson<RoleCatalog>(
      USERS_URL,
      "/v1/role-catalogs/company",
      token,
    );
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Chrome
      active="companies"
      pageTitle="Role Settings"
      user={{ userId: claims.userId, displayName, handle, isOperator }}
      activeCompany={ctx?.activeCompany ?? null}
      tenantOptions={ctx?.tenantOptions ?? []}
    >
      <div className="page-breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="page-breadcrumb-sep">›</span>
        <Link href="/dashboard/companies">Customers</Link>
        <span className="page-breadcrumb-sep">›</span>
        {company && (
          <>
            <Link href={`/dashboard/companies/${company.companyId}`}>
              {company.name}
            </Link>
            <span className="page-breadcrumb-sep">›</span>
          </>
        )}
        <span className="page-breadcrumb-current">Roles</span>
      </div>

      {error && (
        <div className="warning-banner" style={{ marginBottom: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {error}
        </div>
      )}

      {company && (
        <div className="hero-card">
          <div className="hero-card-left">
            <div className="hero-card-text">
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span className="data-table-id">
                  {shortId(company.companyId)}
                </span>
                <span className="pill is-violet">Framework default</span>
              </div>
              <h1 className="hero-card-title">{company.name}: Role Settings</h1>
              <p className="hero-card-subtitle">
                Company catalog{" "}
                {catalog ? (
                  <>
                    <code>{catalog.catalogId}</code> · v{catalog.version}
                  </>
                ) : (
                  "—"
                )}{" "}
                — sovereign module role tiers and capabilities (read-only in
                v0.2).
              </p>
            </div>
          </div>
          <div className="hero-card-actions">
            <Link
              href={`/dashboard/companies/${company.companyId}`}
              className="btn btn-secondary"
            >
              Back to detail
            </Link>
          </div>
        </div>
      )}

      {catalog && (
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="section-card-title">Role Tiers</h3>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th style={{ width: 80 }}>Rank</th>
                  <th>Auto-assigned</th>
                  {ALL_CAPS.map((c) => (
                    <th
                      key={c}
                      style={{ textAlign: "center", whiteSpace: "nowrap" }}
                    >
                      {CAP_LABEL[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...catalog.roles]
                  .sort((a, b) => b.rank - a.rank)
                  .map((r) => (
                    <tr key={r.key}>
                      <td>
                        <div className="user-cell">
                          <span className="user-cell-text">
                            <span
                              className="user-cell-name"
                              style={{ fontWeight: 600 }}
                            >
                              {r.name}
                            </span>
                            <div className="user-cell-handle">{r.key}</div>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="pill is-gray">{r.rank}</span>
                      </td>
                      <td>
                        {r.isAutoAssigned === "owner_on_create" ? (
                          <span className="pill is-violet">Owner on create</span>
                        ) : r.isAutoAssigned === "invite_default" ? (
                          <span className="pill is-pink">Invite default</span>
                        ) : (
                          <span className="user-cell-handle">—</span>
                        )}
                      </td>
                      {ALL_CAPS.map((c) => (
                        <td key={c} style={{ textAlign: "center" }}>
                          {r.capabilities.includes(c) ? (
                            <span
                              className="status-pill is-active"
                              style={{ display: "inline-block" }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span className="user-cell-handle">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            Catalog version {catalog.version} · last updated{" "}
            {new Date(catalog.updatedAt).toLocaleString()}. Role editing
            ships in a future release.
          </p>
        </div>
      )}
    </Chrome>
  );
}
