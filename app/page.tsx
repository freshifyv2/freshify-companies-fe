import { redirect } from "next/navigation";
import Link from "next/link";
import { readSessionToken, decodeClaims } from "@/lib/session";
import { get, type CompanyListItem } from "@/lib/api";
import { Chrome } from "@/lib/Chrome";
import CreateCompanyForm from "./CreateCompanyForm";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default async function CompaniesIndex() {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  let companies: CompanyListItem[] = [];
  let error: string | null = null;
  try {
    const out = await get<{ companies: CompanyListItem[] }>("/v1/companies", token);
    companies = out.companies;
  } catch (e) {
    error = (e as Error).message;
  }

  const total = companies.length;
  const personal = companies.filter((c) => c.kind === "personal").length;
  const org = companies.filter((c) => c.kind === "organization").length;
  const owned = companies.filter((c) => c.role === "admin").length;

  return (
    <Chrome
      active="companies"
      pageTitle="Companies"
      user={{ userId: claims.userId, displayName: claims.displayName, handle: claims.email }}
      activeCompany={claims.companyName ? { name: claims.companyName } : null}
    >
      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="sep">›</span>
        <span className="current">Companies</span>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Companies</h1>
          <div className="sub">Every user has a personal company. Organizations are created and shared.</div>
        </div>
        <div className="page-header-actions">
          <a href="#create-company" className="btn btn-primary btn-sm">+ New company</a>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ color: "#b42318" }}>{error}</div>
        </div>
      )}

      <div className="metrics">
        <div className="metric">
          <div className="metric-icon violet" aria-hidden>◇</div>
          <div className="metric-label">Total companies</div>
          <div className="metric-value">{total}</div>
          <div className="metric-trend muted">Across all your memberships</div>
        </div>
        <div className="metric">
          <div className="metric-icon cyan" aria-hidden>◔</div>
          <div className="metric-label">Personal</div>
          <div className="metric-value">{personal}</div>
          <div className="metric-trend muted">Your own sovereign space</div>
        </div>
        <div className="metric">
          <div className="metric-icon violet" aria-hidden>◉</div>
          <div className="metric-label">Organizations</div>
          <div className="metric-value">{org}</div>
          <div className="metric-trend muted">Shared with other users</div>
        </div>
        <div className="metric">
          <div className="metric-icon cyan" aria-hidden>★</div>
          <div className="metric-label">Admin access</div>
          <div className="metric-value">{owned}</div>
          <div className="metric-trend muted">Companies you administer</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="filter-pills" role="tablist">
          <button className="filter-pill active" type="button">All <span className="count">{total}</span></button>
          <button className="filter-pill" type="button">Personal <span className="count">{personal}</span></button>
          <button className="filter-pill" type="button">Organizations <span className="count">{org}</span></button>
          <button className="filter-pill" type="button">Admin <span className="count">{owned}</span></button>
        </div>
        <div className="search">
          <span className="search-icon" aria-hidden>⌕</span>
          <input placeholder="Search companies..." disabled />
        </div>
      </div>

      <div className="table-card">
        {companies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-glyph" aria-hidden>◇</div>
            <div className="empty-title">No companies yet</div>
            <div className="empty-sub">Create your first company below.</div>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Name</th>
                  <th>Kind</th>
                  <th>Your role</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => {
                  const kindPill = c.kind === "personal" ? "cyan" : "violet";
                  const isActive = c.companyId === claims.companyId;
                  return (
                    <tr key={c.companyId}>
                      <td>
                        <div className="row-avatar">{initials(c.name)}</div>
                      </td>
                      <td>
                        <Link href={`/dashboard/companies/${c.companyId}`} className="table-primary">
                          {c.name}
                        </Link>
                        <div className="table-sub">
                          <code>{c.companyId}</code>
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${kindPill}`}>
                          <span className="dot" /> {c.kind}
                        </span>
                      </td>
                      <td>{c.role}</td>
                      <td className="muted">{c.tier || "—"}</td>
                      <td>
                        {isActive ? (
                          <span className="pill green"><span className="dot" /> Active</span>
                        ) : (
                          <span className="pill"><span className="dot" /> Available</span>
                        )}
                      </td>
                      <td className="table-actions">
                        <Link href={`/dashboard/companies/${c.companyId}`} className="btn btn-ghost btn-sm">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="load-more">
              <button type="button" className="load-more-btn" disabled>
                Load more →
              </button>
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
