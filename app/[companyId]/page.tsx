import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { readSessionToken, decodeClaims } from "@/lib/session";
import { get, type CompanyDetail } from "@/lib/api";
import { Chrome } from "@/lib/Chrome";
import AddMemberForm from "./AddMemberForm";

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

export default async function CompanyDetailPage({
  params,
}: {
  params: { companyId: string };
}) {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const isOperator = Boolean(claims.operator);
  const displayName = claims.displayName || claims.email || "User";
  const handle = handleFromEmail(claims.email);

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
      pageTitle="Company Detail"
      user={{ userId: claims.userId, displayName, handle, isOperator }}
      activeCompany={claims.companyName ? { name: claims.companyName } : null}
    >
      <div className="page-breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="page-breadcrumb-sep">›</span>
        <Link href="/dashboard/companies">Companies</Link>
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
              <span className="avatar-circle is-lg" aria-hidden style={{ background: "var(--violet-soft)", color: "var(--violet)" }}>
                {initials(company.name)}
              </span>
              <div className="hero-card-text">
                <span className="status-pill is-active hero-card-status">
                  {isActive ? "Active session" : "Available"}
                </span>
                <h1 className="hero-card-title">{company.name}</h1>
                <p className="hero-card-subtitle">
                  {company.kind === "personal" ? "Personal company" : "Organization"} · {company.tier || "Standard"} tier
                </p>
              </div>
            </div>
            <div className="hero-card-actions">
              <button type="button" className="btn btn-primary" disabled>
                Update Company
              </button>
            </div>
          </div>

          {/* Primary Information */}
          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title">Primary Information</h3>
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="field-label">COMPANY ID</label>
                <input className="field-input is-readonly" value={company.companyId} readOnly />
              </div>
              <div className="field">
                <label className="field-label">SLUG</label>
                <input className="field-input is-readonly" value={company.slug || "—"} readOnly />
              </div>
              <div className="field">
                <label className="field-label">KIND</label>
                <input className="field-input is-readonly" value={company.kind} readOnly />
              </div>
              <div className="field">
                <label className="field-label">TIER</label>
                <input className="field-input is-readonly" value={company.tier || "Standard"} readOnly />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="field-label">OWNER USER ID</label>
                <input className="field-input is-readonly" value={company.ownerUserId} readOnly />
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-icon" aria-hidden>◐</span>
              <h3 className="section-card-title">Attached Members</h3>
            </div>
            <AddMemberForm companyId={company.companyId} />
          </div>

          {/* Workspaces */}
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-icon" aria-hidden>◉</span>
              <h3 className="section-card-title">Workspaces</h3>
            </div>
            <div className="assignment-row">
              <div className="assignment-row-info">
                <h4 className="assignment-row-name">View all workspaces in this company</h4>
                <span className="assignment-row-sub">Workspaces are scoped to the active company in your session.</span>
              </div>
              <Link href="/dashboard/workspaces" className="btn btn-secondary btn-sm">
                Go to workspaces →
              </Link>
            </div>
          </div>
        </>
      )}
    </Chrome>
  );
}
