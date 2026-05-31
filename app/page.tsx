import { redirect } from "next/navigation";
import Link from "next/link";
import { readSessionToken, decodeClaims } from "@/lib/session";
import { get, type CompanyListItem } from "@/lib/api";
import { Chrome } from "@/lib/Chrome";
import CreateCompanyForm from "./CreateCompanyForm";

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
  // cmp_lxOvblVD_DYzK1Tu → C-LXOV
  const cleaned = id.replace(/^cmp_/, "").replace(/[^A-Za-z0-9]/g, "");
  return `#C-${cleaned.slice(0, 4).toUpperCase()}`;
}

function formatDate(d?: string | Date | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CompaniesIndex() {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const isOperator = Boolean(claims.operator);
  const displayName = claims.displayName || claims.email || "User";
  const handle = handleFromEmail(claims.email);

  let companies: CompanyListItem[] = [];
  let error: string | null = null;
  try {
    const out = await get<{ companies: CompanyListItem[] }>("/v1/companies", token);
    companies = out.companies;
  } catch (e) {
    error = (e as Error).message;
  }

  const total = companies.length;
  const active = companies.filter((c) => c.companyId === claims.companyId).length || total;
  const inactive = 0;
  const draft = 0;

  return (
    <Chrome
      active="companies"
      pageTitle="Companies"
      user={{ userId: claims.userId, displayName, handle, isOperator }}
      activeCompany={claims.companyName ? { name: claims.companyName } : null}
    >
      <div className="page-breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="page-breadcrumb-sep">›</span>
        <span className="page-breadcrumb-current">Companies</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-header-title">Overview</h1>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary">
            <span aria-hidden>⬆</span> Export
          </button>
          <a href="#create-company" className="btn btn-primary">
            + New Company
          </a>
        </div>
      </div>

      {error && (
        <div className="warning-banner" style={{ marginBottom: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {error}
        </div>
      )}

      {/* RAS-style metric cards */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-icon" aria-hidden>◇</span>
            <span className="metric-card-badge">+{total} TOTAL</span>
          </div>
          <div className="metric-card-body">
            <p className="metric-card-label">Total Companies</p>
            <p className="metric-card-value">{total}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-icon is-green" aria-hidden>✓</span>
            <span className="metric-card-badge">{total > 0 ? Math.round((active / total) * 100) : 0}% ACTIVE</span>
          </div>
          <div className="metric-card-body">
            <p className="metric-card-label">Active</p>
            <p className="metric-card-value">{active}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-icon is-amber" aria-hidden>⊘</span>
            <span className="metric-card-badge is-amber">PENDING</span>
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

      {/* RAS table card with filter bar */}
      <div className="list-card">
        <div className="filter-bar">
          <div className="filter-pills">
            <button type="button" className="filter-pill is-active">All</button>
            <button type="button" className="filter-pill">Active</button>
            <button type="button" className="filter-pill">Inactive</button>
            <button type="button" className="filter-pill">Draft</button>
          </div>
          <div className="search-input-wrap">
            <span className="search-input-icon" aria-hidden>⌕</span>
            <input
              className="search-input"
              placeholder="search for name, title, company, location, active date, expire, date, draft date..."
              disabled
            />
          </div>
          <button type="button" className="filter-button" aria-label="Filter">⚙</button>
        </div>

        {companies.length === 0 ? (
          <div className="list-card-empty">
            <p style={{ margin: "24px 0 8px", fontWeight: 600, color: "var(--fg)" }}>No companies yet</p>
            <p style={{ margin: 0 }}>Create your first company below to get started.</p>
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Your Role</th>
                    <th>Workspaces</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => {
                    const isActive = c.companyId === claims.companyId;
                    const typePillCls = c.kind === "personal" ? "is-pink" : "is-violet";
                    const typeLabel = c.kind === "personal" ? "Personal" : "Organization";
                    return (
                      <tr key={c.companyId} className="is-clickable">
                        <td className="data-table-id">{shortId(c.companyId)}</td>
                        <td>
                          <div className="user-cell">
                            <span className="avatar-circle">{initials(c.name)}</span>
                            <div className="user-cell-text">
                              <Link
                                href={`/dashboard/companies/${c.companyId}`}
                                className="user-cell-name"
                                style={{ color: "var(--fg)", textDecoration: "none" }}
                              >
                                {c.name}
                              </Link>
                              <div className="user-cell-handle">{c.tier || "Standard"}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`pill ${typePillCls}`}>{typeLabel}</span>
                        </td>
                        <td>
                          <span className="pill is-gray">{c.role}</span>
                        </td>
                        <td>
                          <span className="tag-cell">
                            <span className="tag-chip">workspaces</span>
                            <span className="tag-chip-overflow">view</span>
                          </span>
                        </td>
                        <td>
                          {isActive ? (
                            <span className="status-pill is-active">Active</span>
                          ) : (
                            <span className="status-pill is-active">Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="load-more">
              <span className="load-more-link" aria-disabled="true">
                Load More →
              </span>
            </div>
          </>
        )}
      </div>

      <div id="create-company" style={{ marginTop: 32 }}>
        <CreateCompanyForm />
      </div>
    </Chrome>
  );
}
