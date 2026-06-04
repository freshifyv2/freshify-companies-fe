/**
 * Companies Module Settings — module-level (not per-record).
 *
 * Canonical entry for the Companies module's settings:
 *   - Module Admins (the small set of people who can configure this module)
 *   - Available Roles for companies in this module
 *   - Default Role for new invitees
 *   - Module Registry metadata
 *
 * Read access: anyone with module visibility. Write actions gated to
 * Module Admins (Phase B).
 *
 * Reached from /dashboard/companies/settings (via shell rewrite).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { readSessionToken, decodeClaims } from "@/lib/session";
import { Chrome } from "@/lib/Chrome";
import { loadChromeContext } from "@/lib/chromeContext";

export const dynamic = "force-dynamic";

interface ModuleAdmin {
  userId: string;
  displayName: string;
  email: string;
  addedAt: string;
  source: "bootstrap" | "manual";
}

interface RoleRow {
  key: string;
  label: string;
  scope: string;
  isDefault?: boolean;
  description: string;
}

interface RegistryEntry {
  key: string;
  label: string;
  value: string;
}

// Phase A: hardcoded Module Admin list. Phase B: BE-backed.
const MODULE_ADMINS: ModuleAdmin[] = [
  {
    userId: "usr_KV1im21A_b8OotEV",
    displayName: "Alex Morgan",
    email: "alex.morgan@sovereign.dev",
    addedAt: "2026-04-12",
    source: "bootstrap",
  },
];

const ROLES: RoleRow[] = [
  { key: "company.admin", label: "Company Admin", scope: "Company", description: "Manage users, workspaces, and settings within their own company." },
  { key: "company.member", label: "Company Member", scope: "Company", isDefault: true, description: "Default role for invited company users." },
  { key: "company.guest", label: "Company Guest", scope: "Company", description: "Limited read-only access scoped to specific items." },
];

const REGISTRY: RegistryEntry[] = [
  { key: "moduleId", label: "Module ID", value: "companies" },
  { key: "service", label: "Backend service", value: "freshify-companies" },
  { key: "collections", label: "MongoDB collections", value: "companies, company_members, company_role_catalog, audit_log" },
  { key: "endpoints", label: "Public route prefix", value: "/v1/companies, /v1/admin/companies" },
  { key: "ownsRoleCatalog", label: "Owns role catalog", value: "Yes — company-scope" },
  { key: "ownsRegistry", label: "Owns directory registry", value: "Yes — tenant directory" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default async function CompaniesModuleSettingsPage() {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const chromeCtx = await loadChromeContext();
  if (!chromeCtx) redirect("/login");

  const isModuleAdmin = MODULE_ADMINS.some((a) => a.userId === claims.userId);

  return (
    <Chrome
      active="companies"
      pageTitle="Customers — Module Settings"
      user={chromeCtx.user}
      activeCompany={chromeCtx.activeCompany}
      tenantOptions={chromeCtx.tenantOptions}
    >
      <div className="page-breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="page-breadcrumb-sep">›</span>
        <Link href="/dashboard/companies">Customers</Link>
        <span className="page-breadcrumb-sep">›</span>
        <span className="page-breadcrumb-current">Module Settings</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-header-title">Customers Module Settings</h1>
          <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
            Who administers the Customers module, what roles are available, and module metadata.
          </p>
        </div>
        <div className="page-header-actions">
          {isModuleAdmin && (
            <button type="button" className="btn btn-primary" disabled>
              + Add Module Admin
            </button>
          )}
        </div>
      </div>

      {/* MODULE ADMINS */}
      <section className="list-card" style={{ marginBottom: 16 }}>
        <header style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15 }}>Module Admins</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
              People who can configure this module&apos;s roles, defaults, and admin list.
              Module Admins also have module visibility regardless of item membership.
            </p>
          </div>
          <span className="pill">{MODULE_ADMINS.length} admin{MODULE_ADMINS.length === 1 ? "" : "s"}</span>
        </header>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Source</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {MODULE_ADMINS.map((admin) => (
                <tr key={admin.userId}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="avatar-circle" aria-hidden style={{ background: "var(--violet-soft)", color: "var(--violet)" }}>
                        {initials(admin.displayName)}
                      </span>
                      <Link href={`/dashboard/users/list/${admin.userId}`} style={{ color: "var(--fg)", fontWeight: 500 }}>
                        {admin.displayName}
                      </Link>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{admin.email}</td>
                  <td>
                    <span className="pill is-violet">
                      {admin.source === "bootstrap" ? "Bootstrap" : "Manual"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{admin.addedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AVAILABLE ROLES */}
      <section className="list-card" style={{ marginBottom: 16 }}>
        <header style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Available Roles</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
            Role catalog applied to company members. The default role is assigned to new invitees.
          </p>
        </header>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role key</th>
                <th>Label</th>
                <th>Scope</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.key}>
                  <td><code style={{ fontSize: 12 }}>{r.key}</code></td>
                  <td>{r.label}</td>
                  <td><span className="pill is-violet">{r.scope}</span></td>
                  <td>
                    {r.isDefault ? (
                      <span className="pill" style={{ background: "var(--violet-soft)", color: "var(--violet)" }}>Default</span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "var(--muted)" }}>{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODULE REGISTRY */}
      <section className="list-card">
        <header style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Module Registry</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
            Service identifiers and storage layout for this sovereign module.
          </p>
        </header>
        <div style={{ padding: "8px 16px" }}>
          <dl style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 2fr)", gap: "12px 24px", margin: 0 }}>
            {REGISTRY.map((entry) => (
              <div key={entry.key} style={{ display: "contents" }}>
                <dt style={{ color: "var(--fg-2)", fontSize: 14, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>{entry.label}</dt>
                <dd style={{ color: "var(--muted)", fontSize: 14, padding: "8px 0", borderBottom: "1px solid var(--line)", margin: 0 }}>{entry.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </Chrome>
  );
}
