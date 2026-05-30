import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { readSessionToken, decodeClaims } from "@/lib/session";
import { get, type CompanyDetail } from "@/lib/api";
import { Chrome } from "@/lib/Chrome";
import AddMemberForm from "./AddMemberForm";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
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

  let company: CompanyDetail | null = null;
  let error: string | null = null;
  try {
    company = await get<CompanyDetail>(`/v1/companies/${params.companyId}`, token);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("404")) notFound();
    error = msg;
  }

  const isActive = company?.companyId === claims.companyId;

  return (
    <Chrome
      active="companies"
      pageTitle={company?.name || "Company"}
      user={{ userId: claims.userId, displayName: claims.displayName, handle: claims.email }}
      activeCompany={claims.companyName ? { name: claims.companyName } : null}
    >
      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="sep">›</span>
        <Link href="/dashboard/companies">Companies</Link>
        <span className="sep">›</span>
        <span className="current">{company?.name || "—"}</span>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ color: "#b42318" }}>{error}</div>
        </div>
      )}

      {company && (
        <>
          <div className="profile-card">
            <div className="profile-avatar">{initials(company.name)}</div>
            <div className="profile-info">
              <div className="profile-name-row">
                <h1>{company.name}</h1>
                {isActive ? (
                  <span className="pill green"><span className="dot" /> Active</span>
                ) : (
                  <span className="pill"><span className="dot" /> Available</span>
                )}
                <span className={`pill ${company.kind === "personal" ? "cyan" : "violet"}`}>
                  {company.kind}
                </span>
              </div>
              <div className="profile-handle">
                <code>{company.companyId}</code>
              </div>
              <div className="profile-meta">
                {company.slug && <span>slug: <strong>{company.slug}</strong></span>}
                <span>tier: <strong>{company.tier || "—"}</strong></span>
              </div>
            </div>
            <div className="profile-actions">
              <button className="btn btn-ghost btn-sm" type="button" disabled>Edit</button>
            </div>
          </div>

          <div className="kicker">Company details</div>
          <div className="card">
            <table className="kv-table">
              <tbody>
                <tr><th>Company ID</th><td><code>{company.companyId}</code></td></tr>
                <tr><th>Slug</th><td>{company.slug || "—"}</td></tr>
                <tr><th>Tier</th><td>{company.tier || "—"}</td></tr>
                <tr><th>Owner User ID</th><td><code>{company.ownerUserId}</code></td></tr>
              </tbody>
            </table>
          </div>

          <div className="kicker">Attached members</div>
          <AddMemberForm companyId={company.companyId} />

          <div className="kicker">Workspaces in this company</div>
          <div className="card">
            <p className="muted" style={{ marginBottom: 12 }}>
              Workspaces are scoped to the active company in your session.
            </p>
            <Link href="/dashboard/workspaces" className="btn btn-ghost btn-sm">
              Go to workspaces →
            </Link>
          </div>
        </>
      )}
    </Chrome>
  );
}
