/**
 * UCM03 — Edit Customer.
 *
 * Operator-only. Hero + Primary Information form.
 * Out of scope: "Reporting Overview" red banner from Figma.
 */
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { readSessionToken, decodeClaims } from "@/lib/session";
import { get, type CompanyDetail } from "@/lib/api";
import { Chrome } from "@/lib/Chrome";
import { OperatorOnly403 } from "@/lib/OperatorOnly";
import { loadChromeContext } from "@/lib/chromeContext";
import EditCompanyForm from "./EditCompanyForm";

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

export default async function CompanyEditPage({
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
        pageTitle="Edit Customer"
        user={{
          userId: claims.userId,
          displayName: claims.displayName || claims.email || "User",
          handle: (claims.email || "").startsWith("+")
            ? (claims.email || "").replace(/[^0-9]/g, "")
            : (claims.email || "").split("@")[0] || "user",
          isOperator: false,
        }}
        activeCompany={claims.companyName ? { name: claims.companyName } : null}
        detail="Editing customers"
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

  return (
    <Chrome
      active="companies"
      pageTitle="Edit Customer"
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
        <span className="page-breadcrumb-current">Edit</span>
      </div>

      {error && (
        <div className="warning-banner" style={{ marginBottom: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {error}
        </div>
      )}

      {company && (
        <>
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
                </div>
                <h1 className="hero-card-title">{company.name}</h1>
                <p className="hero-card-subtitle">
                  Entity Profile &amp; Logistics Configuration
                </p>
              </div>
            </div>
            <div className="hero-card-actions">
              <button type="button" className="btn btn-secondary" disabled>
                Delete Customer
              </button>
              {/* Save button lives inside EditCompanyForm — the hero button
                  here is purely decorative parity with the Figma layout. */}
            </div>
          </div>

          <EditCompanyForm
            companyId={company.companyId}
            initial={{
              name: company.name,
              slug: company.slug,
              tier: company.tier,
              kind: company.kind,
              type: company.type ?? null,
            }}
            operatorName={displayName}
          />
        </>
      )}
    </Chrome>
  );
}
