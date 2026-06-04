/**
 * UCM Module Settings — combined Roles + Registry route.
 *
 * Single operator-only page replacing the prior split between /roles and
 * /registry. Both sections are rendered on this page so operators have a
 * one-screen view of "everything about this customer's UCM configuration."
 * The legacy /roles and /registry routes remain in place for direct links
 * and bookmarks but the canonical entry point from the customer detail
 * is now /module-settings.
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
import { OperatorOnly403 } from "@/lib/OperatorOnly";

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

interface AdminUserView {
  userId: string;
  displayName: string | null;
  email: string;
  title: string | null;
  status: "active" | "pending" | "inactive";
  assignedCompanies: Array<{
    companyId: string;
    name: string;
    role?: "admin" | "member";
    isPrimary?: boolean;
  }>;
  assignedWorkspaces: Array<{
    workspaceId: string;
    name: string;
    companyId?: string;
    role?: "admin" | "member";
  }>;
}

const ALL_CAPS = [
  "read",
  "write",
  "manage_users",
  "manage_settings",
  "manage_roles",
  "transfer_ownership",
  "delete",
] as const;
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function shortId(id: string): string {
  const cleaned = id.replace(/^cmp_/, "").replace(/[^A-Za-z0-9]/g, "");
  return `#C-${cleaned.slice(0, 4).toUpperCase()}`;
}

export default async function CompanyModuleSettingsPage({
  params,
}: {
  params: { companyId: string };
}) {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");
  const isOperator = Boolean(claims.operator);

  const ctx = await loadChromeContext();
  const displayName = claims.displayName || claims.email || "User";
  const handle = handleFromEmail(claims.email);
  if (!isOperator) {
    return (
      <OperatorOnly403
        active="companies"
        pageTitle="Customer — Module Settings"
        user={{ userId: claims.userId, displayName, handle, isOperator: false }}
        activeCompany={ctx?.activeCompany ?? (claims.companyName ? { name: claims.companyName } : null)}
        detail="Customer module settings"
      />
    );
  }

  let company: CompanyDetail | null = null;
  let catalog: RoleCatalog | null = null;
  let allUsers: AdminUserView[] = [];
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
    catalog = await getServiceJson<RoleCatalog>(USERS_URL, "/v1/role-catalogs/company", token);
  } catch (e) {
    error = (e as Error).message;
  }
  try {
    const res = await getServiceJson<{ users: AdminUserView[] }>(USERS_URL, "/v1/admin/users", token);
    allUsers = res.users || [];
  } catch (e) {
    error = (e as Error).message;
  }

  // Build registry — users with access via Company or Workspace assignment
  const registry = (allUsers || [])
    .filter((u) =>
      (u.assignedCompanies || []).some((c) => c.companyId === params.companyId) ||
      (u.assignedWorkspaces || []).some((w) => w.companyId === params.companyId),
    )
    .map((u) => {
      const companyMembership = (u.assignedCompanies || []).find((c) => c.companyId === params.companyId);
      const workspaceMatches = (u.assignedWorkspaces || []).filter((w) => w.companyId === params.companyId);
      return {
        userId: u.userId,
        displayName: u.displayName,
        email: u.email,
        title: u.title,
        status: u.status,
        viaCompany: !!companyMembership,
        companyRole: companyMembership?.role,
        workspaceCount: workspaceMatches.length,
        workspaces: workspaceMatches,
      };
    });

  return (
    <Chrome
      active="companies"
      pageTitle="Customer Settings"
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
            <Link href={`/dashboard/companies/${company.companyId}`}>{company.name}</Link>
            <span className="page-breadcrumb-sep">›</span>
          </>
        )}
        <span className="page-breadcrumb-current">Settings</span>
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
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span className="data-table-id">{shortId(company.companyId)}</span>
                <span className="pill is-violet">Settings</span>
              </div>
              <h1 className="hero-card-title">{company.name}</h1>
              <p className="hero-card-subtitle">
                Per-customer roles and membership registry. Operator-only.
              </p>
            </div>
          </div>
          <div className="hero-card-actions">
            <Link href={`/dashboard/companies/${company.companyId}`} className="btn btn-secondary">
              Back to detail
            </Link>
          </div>
        </div>
      )}

      {/* Section navigation pills */}
      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <a href="#roles" className="filter-pill is-active">Roles</a>
        <a href="#registry" className="filter-pill">Registry</a>
      </div>

      {/* ── Roles ───────────────────────────────────────────────────── */}
      <div id="roles" className="section-card" style={{ marginBottom: 20 }}>
        <div className="section-card-header">
          <h3 className="section-card-title">Role Tiers</h3>
          {catalog ? (
            <span className="user-cell-handle">
              {catalog.catalogId} · v{catalog.version}
            </span>
          ) : null}
        </div>
        {catalog ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th style={{ width: 80 }}>Rank</th>
                  <th>Auto-assigned</th>
                  {ALL_CAPS.map((c) => (
                    <th key={c} style={{ textAlign: "center", whiteSpace: "nowrap" }}>{CAP_LABEL[c]}</th>
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
                            <span className="user-cell-name" style={{ fontWeight: 600 }}>{r.name}</span>
                            <div className="user-cell-handle">{r.key}</div>
                          </span>
                        </div>
                      </td>
                      <td><span className="pill is-gray">{r.rank}</span></td>
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
                            <span className="status-pill is-active" style={{ display: "inline-block" }}>✓</span>
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
        ) : (
          <p style={{ color: "var(--muted)", padding: 16 }}>Catalog unavailable.</p>
        )}
      </div>

      {/* ── Registry ────────────────────────────────────────────────── */}
      <div id="registry" className="section-card">
        <div className="section-card-header">
          <h3 className="section-card-title">Customer Registry</h3>
          <span className="user-cell-handle">{registry.length} users with access</span>
        </div>
        {registry.length === 0 ? (
          <p style={{ color: "var(--muted)", padding: 16 }}>No users have access to this customer yet.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Title</th>
                  <th>Access via</th>
                  <th>Workspaces</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {registry.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <div className="user-cell">
                        <span className="avatar-circle">{initials(u.displayName || u.email || "?")}</span>
                        <div className="user-cell-text">
                          <span className="user-cell-name">{u.displayName || u.email || "(unnamed)"}</span>
                          <div className="user-cell-handle">@{handleFromEmail(u.email)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.title || <span className="user-cell-handle">—</span>}</td>
                    <td>
                      {u.viaCompany ? (
                        <span className="pill is-violet">Company · {u.companyRole || "member"}</span>
                      ) : (
                        <span className="pill is-gray">Workspace only</span>
                      )}
                    </td>
                    <td>{u.workspaceCount}</td>
                    <td>
                      <span className={`status-pill is-${u.status}`}>{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Chrome>
  );
}
