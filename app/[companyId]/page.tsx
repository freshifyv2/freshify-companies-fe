/**
 * UCM02 — Customer detail.
 *
 * Sections (full RAS Figma minus out-of-scope blocks):
 *   - Hero card (Active pill + #C-xxx + subtype + name + Deactivate / Edit)
 *   - Attached Users & Roles (table — KEEP)
 *   - Company Details (quadrant: Address / Communication / Creation / RAS Rep)
 *
 * OUT OF SCOPE (deferred to later RAS work):
 *   - Attached Locations, Latest Orders, Payable/Receivable Pricing Sets,
 *     Performance report banner.
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

function formatDate(d?: string | Date | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CompanyDetailPage({
  params,
}: {
  params: { companyId: string };
}) {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const ctx = await loadChromeContext();
  const isOperator = Boolean(claims.operator);
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

  // Attached users — fetch the operator user directory and filter to those
  // who have this company in their assignedCompanies. Falls back silently
  // for non-operators.
  let attachedUsers: AdminUserView[] = [];
  let owner: AdminUserView | null = null;
  if (isOperator) {
    try {
      const out = await getServiceJson<{ users: AdminUserView[] }>(
        USERS_URL,
        "/v1/admin/users",
        token,
      );
      attachedUsers = (out.users ?? []).filter((u) =>
        u.assignedCompanies?.some((c) => c.companyId === params.companyId),
      );
      if (company?.ownerUserId) {
        owner = (out.users ?? []).find(
          (u) => u.userId === company!.ownerUserId,
        ) ?? null;
      }
    } catch {
      attachedUsers = [];
    }
  }

  const typeLabel = company?.kind === "personal" ? "Personal" : "Enterprise";

  return (
    <Chrome
      active="companies"
      pageTitle="Customer Detail"
      user={{ userId: claims.userId, displayName, handle, isOperator }}
      activeCompany={ctx?.activeCompany ?? null}
      tenantOptions={ctx?.tenantOptions ?? []}
    >
      <div className="page-breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="page-breadcrumb-sep">›</span>
        <Link href="/dashboard/companies">Customers</Link>
        <span className="page-breadcrumb-sep">›</span>
        <span className="page-breadcrumb-current">{company?.name || "—"}</span>
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
                  <span className="data-table-id">{shortId(company.companyId)}</span>
                  <span className="pill is-violet">{typeLabel}</span>
                </div>
                <h1 className="hero-card-title">{company.name}</h1>
                <p className="hero-card-subtitle">
                  Entity Profile &amp; Logistics Configuration
                </p>
              </div>
            </div>
            <div className="hero-card-actions">
              {isOperator && (
                <Link
                  href={`/dashboard/companies/${company.companyId}/roles`}
                  className="btn btn-secondary"
                >
                  Roles
                </Link>
              )}
              <button type="button" className="btn btn-secondary" disabled>
                Deactivate
              </button>
              <Link
                href={`/dashboard/companies/${company.companyId}/edit`}
                className="btn btn-primary"
              >
                Edit Company
              </Link>
            </div>
          </div>

          {/* Attached Users & Roles */}
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-icon" aria-hidden>◐</span>
              <h3 className="section-card-title">Attached Users &amp; Roles</h3>
              <Link
                href={`/dashboard/companies/${company.companyId}/registry`}
                className="btn btn-link btn-sm"
                style={{ marginLeft: "auto" }}
              >
                View full registry →
              </Link>
            </div>
            {attachedUsers.length === 0 ? (
              <div className="list-card-empty">
                {isOperator ? (
                  <p style={{ margin: 0 }}>No users attached to this customer yet.</p>
                ) : (
                  <p style={{ margin: 0 }}>
                    User registry is available to operators only.
                  </p>
                )}
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Assigned Role</th>
                      <th>Status</th>
                      <th style={{ width: 80, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attachedUsers.map((u) => {
                      const role =
                        u.assignedCompanies.find(
                          (c) => c.companyId === company!.companyId,
                        )?.role || "member";
                      const statusCls =
                        u.status === "active"
                          ? "is-active"
                          : u.status === "pending"
                            ? "is-pending"
                            : "is-inactive";
                      return (
                        <tr key={u.userId}>
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
                                <div className="user-cell-handle">
                                  {u.title || u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`pill ${
                                role === "admin" ? "is-violet" : "is-gray"
                              }`}
                            >
                              {role === "admin" ? "Admin" : "Member"}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${statusCls}`}>
                              {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                            </span>
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

          {/* Company Details quadrant */}
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-icon" aria-hidden>◉</span>
              <h3 className="section-card-title">Company Details</h3>
            </div>
            <div className="field-grid quadrant-grid">
              {/* Address */}
              <div className="quadrant-cell">
                <h4 className="quadrant-title">Address</h4>
                <p className="quadrant-line">{company.name}</p>
                <p className="quadrant-line is-muted">
                  Address on file — RAS Hub
                </p>
              </div>
              {/* Communication */}
              <div className="quadrant-cell">
                <h4 className="quadrant-title">Communication</h4>
                <p className="quadrant-line">{owner?.email || "—"}</p>
                <p className="quadrant-line is-muted">No phone on file</p>
              </div>
              {/* Creation Details */}
              <div className="quadrant-cell">
                <h4 className="quadrant-title">Creation Details</h4>
                <p className="quadrant-line">
                  Created by{" "}
                  {owner?.displayName ||
                    (company.ownerUserId === claims.userId ? displayName : "—")}
                </p>
                <p className="quadrant-line is-muted">Standard tier</p>
              </div>
              {/* RAS Representative */}
              <div className="quadrant-cell">
                <h4 className="quadrant-title">RAS Representative</h4>
                <div
                  className="user-cell"
                  style={{ marginTop: 4 }}
                >
                  <span className="avatar-circle">
                    {initials(displayName)}
                  </span>
                  <div className="user-cell-text">
                    <span className="user-cell-name">{displayName}</span>
                    <div className="user-cell-handle">Operator</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Chrome>
  );
}
