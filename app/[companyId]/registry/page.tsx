/**
 * UCM05 — Customer Registry.
 *
 * "All users with access to this customer record — via Company membership
 * or Workspace assignment." Operator-only.
 *
 * Pulls the full operator users directory (assignedCompanies +
 * assignedWorkspaces already enriched server-side) and filters to users
 * who match the target customer either by Company membership or by
 * Workspace whose companyId equals this customer.
 *
 * Bottom audit log section (Recent Role Changes) is rendered as a
 * placeholder until the audit module ships.
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
import { Chrome } from "@freshifyv2/portal-shell-ui";
import { OperatorOnly403 } from "@/lib/OperatorOnly";
import { loadChromeContext } from "@freshifyv2/portal-shell-ui";

export const dynamic = "force-dynamic";

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

export default async function CustomerRegistryPage({
  params,
}: {
  params: { companyId: string };
}) {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const isOperator = Boolean(claims.operator);
  if (!isOperator) {
    return (
      <OperatorOnly403
        active="companies"
        pageTitle="Customer — Registry"
        user={{
          userId: claims.userId,
          displayName: claims.displayName || claims.email || "User",
          handle: (claims.email || "").startsWith("+")
            ? (claims.email || "").replace(/[^0-9]/g, "")
            : (claims.email || "").split("@")[0] || "user",
          isOperator: false,
        }}
        activeCompany={claims.companyName ? { name: claims.companyName } : null}
        detail="The customer registry (legacy)"
      />
    );
  }

  const ctx = await loadChromeContext();
  const displayName = claims.displayName || claims.email || "User";
  const handle = handleFromEmail(claims.email);

  let company: CompanyDetail | null = null;
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

  let rows: Array<{
    user: AdminUserView;
    companyName: string;
    workspaceName: string | null;
    globalRole: "Operator" | "Admin" | "Member";
    moduleRole: "Admin" | "Member";
    access: "company" | "workspace_only" | "both";
  }> = [];

  if (company) {
    try {
      const out = await getServiceJson<{ users: AdminUserView[] }>(
        USERS_URL,
        "/v1/admin/users",
        token,
      );
      const users = out.users ?? [];
      for (const u of users) {
        const companyMatch = u.assignedCompanies.find(
          (c) => c.companyId === company!.companyId,
        );
        const workspaceMatches = u.assignedWorkspaces.filter(
          (w) => w.companyId === company!.companyId,
        );
        if (!companyMatch && workspaceMatches.length === 0) continue;
        const access =
          companyMatch && workspaceMatches.length > 0
            ? "both"
            : companyMatch
              ? "company"
              : "workspace_only";
        const moduleRole: "Admin" | "Member" =
          (companyMatch?.role || workspaceMatches[0]?.role) === "admin"
            ? "Admin"
            : "Member";
        // Global role — treat operators specially; otherwise admin status.
        const globalRole: "Operator" | "Admin" | "Member" =
          u.userId === claims!.userId && claims!.operator
            ? "Operator"
            : moduleRole === "Admin"
              ? "Admin"
              : "Member";

        if (workspaceMatches.length === 0) {
          rows.push({
            user: u,
            companyName: company!.name,
            workspaceName: null,
            globalRole,
            moduleRole,
            access,
          });
        } else {
          for (const w of workspaceMatches) {
            rows.push({
              user: u,
              companyName: company!.name,
              workspaceName: w.name,
              globalRole,
              moduleRole,
              access,
            });
          }
        }
      }
    } catch (e) {
      error = (e as Error).message;
    }
  }

  const overrideCount = rows.filter((r) => r.access === "workspace_only").length;

  return (
    <Chrome
      active="companies"
      pageTitle="Customer Registry"
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
        <span className="page-breadcrumb-current">Registry</span>
      </div>

      {error && (
        <div className="warning-banner" style={{ marginBottom: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {error}
        </div>
      )}

      {company && (
        <>
          {/* Hero card */}
          <div className="hero-card">
            <div className="hero-card-left">
              <span
                className="avatar-circle is-lg"
                aria-hidden
                style={{
                  background: "var(--violet-soft)",
                  color: "var(--violet)",
                }}
              >
                {initials(company.name)}
              </span>
              <div className="hero-card-text">
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span className="status-pill is-active">Active</span>
                  <span className="data-table-id">
                    {shortId(company.companyId)}
                  </span>
                  <span className="pill is-violet">
                    {company.kind === "personal" ? "Personal" : "Enterprise"}
                  </span>
                </div>
                <h1 className="hero-card-title">{company.name}</h1>
                <p className="hero-card-subtitle">
                  All users with access to this customer record — via Company
                  membership or Workspace assignment.
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

          <div className="list-card">
            <div className="filter-bar">
              <div className="filter-pills">
                <button type="button" className="filter-pill is-active">
                  All ({rows.length})
                </button>
                <button type="button" className="filter-pill">
                  Overrides ({overrideCount})
                </button>
              </div>
              <div className="search-input-wrap">
                <span className="search-input-icon" aria-hidden>⌕</span>
                <input
                  className="search-input"
                  placeholder="search users, workspaces, roles…"
                  disabled
                />
              </div>
              <button
                type="button"
                className="filter-button"
                aria-label="Filter"
              >
                ⚙
              </button>
            </div>

            {rows.length === 0 ? (
              <div className="list-card-empty">
                <p style={{ margin: 0 }}>
                  No users currently have access to this customer.
                </p>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Company</th>
                      <th>Workspace</th>
                      <th>Global Role</th>
                      <th>Module Role</th>
                      <th>Status</th>
                      <th style={{ width: 80, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const u = r.user;
                      const statusCls =
                        u.status === "active"
                          ? "is-active"
                          : u.status === "pending"
                            ? "is-pending"
                            : "is-inactive";
                      return (
                        <tr key={`${u.userId}-${i}`}>
                          <td>
                            <div className="user-cell">
                              <span className="avatar-circle">
                                {initials(u.displayName || u.email)}
                              </span>
                              <div className="user-cell-text">
                                <Link
                                  href={`/dashboard/users/list/${u.userId}`}
                                  className="user-cell-name"
                                >
                                  {u.displayName || u.email}
                                </Link>
                                <div className="user-cell-handle">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="user-cell">
                              <span className="avatar-circle">
                                {initials(r.companyName)}
                              </span>
                              <div className="user-cell-text">
                                <span className="user-cell-name">
                                  {r.companyName}
                                </span>
                                <div className="user-cell-handle">
                                  Enterprise
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{r.workspaceName ?? "—"}</td>
                          <td>
                            <span
                              className={`pill ${
                                r.globalRole === "Operator"
                                  ? "is-violet"
                                  : r.globalRole === "Admin"
                                    ? "is-pink"
                                    : "is-gray"
                              }`}
                            >
                              {r.globalRole}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`pill ${
                                r.moduleRole === "Admin"
                                  ? "is-violet"
                                  : "is-gray"
                              }`}
                            >
                              {r.moduleRole}
                            </span>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              <span className={`status-pill ${statusCls}`}>
                                {u.status.charAt(0).toUpperCase() +
                                  u.status.slice(1)}
                              </span>
                              {r.access === "workspace_only" && (
                                <span className="status-pill is-pending">
                                  Override
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span aria-hidden style={{ color: "var(--muted)" }}>⋯</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Role Changes (audit placeholder) */}
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-icon" aria-hidden>🕘</span>
              <h3 className="section-card-title">Recent Role Changes</h3>
            </div>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Audit log integration ships in the next release. Recent changes
              to memberships, role assignments, and overrides will appear here.
            </p>
          </div>
        </>
      )}
    </Chrome>
  );
}
