/**
 * UCM01 — Customers list.
 *
 * Operators see ALL companies cross-tenant (via /v1/admin/companies).
 * Non-operators see only their own (/v1/companies, role-scoped).
 *
 * Layout follows the RAS Customers screen: 4 metric cards + filter bar
 * (All / Active / Inactive / Draft pills + search + filter button) + table
 * with ID / Customer / Type / Creator / Created / Status / Users columns +
 * Export + "+ New Customer" CTA.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { readSessionToken, decodeClaims } from "@/lib/session";
import {
  get,
  type CompanyListItem,
  type AdminCompanyListItem,
} from "@/lib/api";
import { Chrome } from "@/lib/Chrome";
import { loadChromeContext } from "@/lib/chromeContext";

export const dynamic = "force-dynamic";

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

interface RowVM {
  companyId: string;
  name: string;
  kind: "personal" | "organization";
  tier: string | null;
  status: "active" | "inactive" | "draft";
  memberCount: number;
  createdAt?: string;
  ownerUserId?: string;
}

// Deploy 5.16 — status filter + search are now wired via URL searchParams
// (?status=active&q=acme). All filtering is done server-side so the page
// stays a Server Component. Pills use <Link> + search uses a GET form.
type StatusFilter = "all" | "active" | "inactive" | "draft";
function parseStatusFilter(v: string | string[] | undefined): StatusFilter {
  const s = Array.isArray(v) ? v[0] : v;
  if (s === "active" || s === "inactive" || s === "draft") return s;
  return "all";
}
function parseQuery(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? "").trim().slice(0, 80);
}

export default async function CompaniesIndex({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const statusFilter = parseStatusFilter(sp.status);
  const query = parseQuery(sp.q);
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const ctx = await loadChromeContext();
  const isOperator = Boolean(claims.operator);
  const displayName = claims.displayName || claims.email || "User";
  const handle = handleFromEmail(claims.email);

  let rows: RowVM[] = [];
  let error: string | null = null;

  if (isOperator) {
    try {
      const out = await get<{ companies: AdminCompanyListItem[] }>(
        "/v1/admin/companies",
        token,
      );
      rows = out.companies.map((c) => ({
        companyId: c.companyId,
        name: c.name,
        kind: c.kind,
        tier: c.tier,
        status: c.status,
        memberCount: c.memberCount,
        createdAt: c.createdAt,
        ownerUserId: c.ownerUserId,
      }));
    } catch (e) {
      error = (e as Error).message;
    }
  } else {
    try {
      const out = await get<{ companies: CompanyListItem[] }>(
        "/v1/companies",
        token,
      );
      rows = out.companies.map((c) => ({
        companyId: c.companyId,
        name: c.name,
        kind: c.kind,
        tier: c.tier,
        status: c.kind === "personal" ? "draft" : "active",
        memberCount: 0,
      }));
    } catch (e) {
      error = (e as Error).message;
    }
  }

  const total = rows.length;
  const active = rows.filter((r) => r.status === "active").length;
  const inactive = rows.filter((r) => r.status === "inactive").length;
  const draft = rows.filter((r) => r.status === "draft").length;

  // Deploy 5.16 — apply status pill + search filter to the visible rows.
  // Counts above stay anchored to the *full* dataset so the pills always
  // show the true totals.
  const qLower = query.toLowerCase();
  const visibleRows = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!qLower) return true;
    const hay = [
      r.name,
      r.companyId,
      r.tier ?? "",
      r.kind,
      r.status,
      r.ownerUserId ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(qLower);
  });
  const buildHref = (status: StatusFilter) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/dashboard/companies?${qs}` : "/dashboard/companies";
  };
  const newThisMonth = rows.filter((r) => {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;
  const activeRate = total ? Math.round((active / total) * 100) : 0;

  // Creator name lookup — for the rows table we just show "RAS Admin" for
  // the operator-owned default tenant and the truncated owner id otherwise.
  function creatorLabel(ownerUserId?: string): string {
    if (!ownerUserId) return "System";
    if (ownerUserId === claims!.userId) return displayName;
    return `User · ${ownerUserId.replace(/^usr_/, "").slice(0, 6)}`;
  }

  return (
    <Chrome
      active="companies"
      pageTitle="Customers"
      user={{ userId: claims.userId, displayName, handle, isOperator }}
      activeCompany={ctx?.activeCompany ?? null}
      tenantOptions={ctx?.tenantOptions ?? []}
    >
      <div className="page-breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="page-breadcrumb-sep">›</span>
        <span className="page-breadcrumb-current">Customers</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-header-title">Overview</h1>
          <p className="page-header-sub">
            {isOperator
              ? "Customer directory across every tenant."
              : "Your active customer relationships."}
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/dashboard/companies/settings" className="btn btn-secondary">
            <span aria-hidden>⚙</span> Module Settings
          </Link>
          <button type="button" className="btn btn-secondary">
            <span aria-hidden>⬆</span> Export
          </button>
          <Link href="/dashboard/companies/new" className="btn btn-primary">
            + New Customer
          </Link>
        </div>
      </div>

      {error && (
        <div className="warning-banner" style={{ marginBottom: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {error}
        </div>
      )}

      {/* RAS metric cards */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-icon" aria-hidden>◇</span>
            <span className="metric-card-badge">
              +{newThisMonth} THIS MONTH
            </span>
          </div>
          <div className="metric-card-body">
            <p className="metric-card-label">Total Customers</p>
            <p className="metric-card-value">{total}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-icon is-green" aria-hidden>✓</span>
            <span className="metric-card-badge">{activeRate}% ACTIVE RATE</span>
          </div>
          <div className="metric-card-body">
            <p className="metric-card-label">Active</p>
            <p className="metric-card-value">{active}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-icon is-amber" aria-hidden>⊘</span>
            <span className="metric-card-badge is-amber">DORMANT</span>
          </div>
          <div className="metric-card-body">
            <p className="metric-card-label">Inactive</p>
            <p className="metric-card-value">{inactive}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-icon" aria-hidden>📝</span>
            <span className="metric-card-badge is-gray">DRAFTS</span>
          </div>
          <div className="metric-card-body">
            <p className="metric-card-label">Draft</p>
            <p className="metric-card-value">{draft}</p>
          </div>
        </div>
      </div>

      <div className="list-card">
        <div className="filter-bar">
          <div className="filter-pills">
            <Link
              href={buildHref("all")}
              className={`filter-pill ${statusFilter === "all" ? "is-active" : ""}`}
            >
              All ({total})
            </Link>
            <Link
              href={buildHref("active")}
              className={`filter-pill ${statusFilter === "active" ? "is-active" : ""}`}
            >
              Active ({active})
            </Link>
            <Link
              href={buildHref("inactive")}
              className={`filter-pill ${statusFilter === "inactive" ? "is-active" : ""}`}
            >
              Inactive ({inactive})
            </Link>
            <Link
              href={buildHref("draft")}
              className={`filter-pill ${statusFilter === "draft" ? "is-active" : ""}`}
            >
              Draft ({draft})
            </Link>
          </div>
          <form method="GET" action="/dashboard/companies" className="search-input-wrap">
            {statusFilter !== "all" && (
              <input type="hidden" name="status" value={statusFilter} />
            )}
            <span className="search-input-icon" aria-hidden>⌕</span>
            <input
              className="search-input"
              name="q"
              defaultValue={query}
              placeholder="Search by name, tier, status, owner…"
              autoComplete="off"
            />
            {query && (
              <Link
                href={buildHref(statusFilter)}
                className="search-input-clear"
                aria-label="Clear search"
              >
                ×
              </Link>
            )}
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="list-card-empty">
            <p style={{ margin: "24px 0 8px", fontWeight: 600, color: "var(--fg)" }}>
              No customers yet
            </p>
            <p style={{ margin: 0 }}>
              Click <strong>+ New Customer</strong> to add the first one.
            </p>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="list-card-empty">
            <p style={{ margin: "24px 0 8px", fontWeight: 600, color: "var(--fg)" }}>
              No customers match these filters
            </p>
            <p style={{ margin: 0 }}>
              Try a different filter or{" "}
              <Link href="/dashboard/companies">clear filters</Link>.
            </p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Creator</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Users</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => {
                  const typePillCls =
                    r.kind === "personal" ? "is-pink" : "is-violet";
                  const typeLabel =
                    r.kind === "personal" ? "Personal" : "Enterprise";
                  const statusCls =
                    r.status === "active"
                      ? "is-active"
                      : r.status === "inactive"
                        ? "is-inactive"
                        : "is-pending";
                  return (
                    <tr key={r.companyId} className="is-clickable">
                      <td className="data-table-id">{shortId(r.companyId)}</td>
                      <td>
                        <div className="user-cell">
                          <span className="avatar-circle">{initials(r.name)}</span>
                          <div className="user-cell-text">
                            <Link
                              href={`/dashboard/companies/${r.companyId}`}
                              className="user-cell-name"
                            >
                              {r.name}
                            </Link>
                            <div className="user-cell-handle">
                              {r.tier || "Standard"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${typePillCls}`}>{typeLabel}</span>
                      </td>
                      <td>
                        <div className="user-cell">
                          <span className="avatar-circle">
                            {initials(creatorLabel(r.ownerUserId))}
                          </span>
                          <span className="user-cell-name">
                            {creatorLabel(r.ownerUserId)}
                          </span>
                        </div>
                      </td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>
                        <span className={`status-pill ${statusCls}`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className="tag-cell">
                          <span className="tag-chip">
                            👥 {r.memberCount}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="load-more">
          <span className="load-more-link" aria-disabled="true">
            Load More →
          </span>
        </div>
      </div>
    </Chrome>
  );
}
