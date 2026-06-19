/**
 * Companies Module Settings — module-level (not per-record).
 *
 * Sprint 4 / C4 Phase B — BE-backed.
 *
 * Canonical entry for the Companies module's settings:
 *   - Module Admins (the small set of people who can configure this module)
 *   - Available Roles for companies in this module
 *   - Default Role for new invitees
 *   - Module Registry metadata
 *
 * Read access: operators (BE 403s non-operators).
 * Write actions: operators. Surfaced via ModuleSettingsClient.
 *
 * Reached from /dashboard/companies/settings (via shell rewrite).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { readSessionToken, decodeClaims } from "@/lib/session";
import { Chrome } from "@freshifyv2/portal-shell-ui";
import { OperatorOnly403 } from "@/lib/OperatorOnly";
import { loadChromeContext } from "@freshifyv2/portal-shell-ui";
import {
  get,
  type ModuleAdminView,
  type ModuleSettingsView,
} from "@/lib/api";
import ModuleSettingsClient from "./ModuleSettingsClient";

export const dynamic = "force-dynamic";

interface RegistryEntry {
  key: string;
  label: string;
  value: string;
}

const REGISTRY: RegistryEntry[] = [
  { key: "moduleId", label: "Module ID", value: "companies" },
  { key: "service", label: "Backend service", value: "freshify-companies" },
  {
    key: "collections",
    label: "MongoDB collections",
    value:
      "companies, company_admins, company_audit_log, module_admins, module_settings",
  },
  {
    key: "endpoints",
    label: "Public route prefix",
    value:
      "/v1/companies, /v1/admin/companies, /v1/modules/companies",
  },
  { key: "ownsRoleCatalog", label: "Owns role catalog", value: "Yes — company-scope" },
  { key: "ownsRegistry", label: "Owns tenant directory", value: "Yes — tenant directory" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function handleFromEmail(email?: string | null): string {
  if (!email) return "user";
  if (email.startsWith("+")) return email.replace(/[^0-9]/g, "");
  return email.split("@")[0] || email;
}

export default async function CompaniesModuleSettingsPage() {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const displayName = claims.displayName || claims.email || "User";
  const handle = handleFromEmail(claims.email);
  const isOperator = Boolean(claims.operator);

  if (!isOperator) {
    return (
      <OperatorOnly403
        active="companies"
        pageTitle="Customers — Module Settings"
        user={{
          userId: claims.userId,
          displayName,
          handle,
          isOperator: false,
        }}
        activeCompany={claims.companyName ? { name: claims.companyName } : null}
        detail="Customers module settings"
      />
    );
  }

  const chromeCtx = await loadChromeContext();
  if (!chromeCtx) redirect("/login");

  let settings: ModuleSettingsView | null = null;
  let admins: ModuleAdminView[] = [];
  let loadError: string | null = null;
  try {
    settings = await get<ModuleSettingsView>(
      "/v1/modules/companies/settings",
      token,
    );
    const adminsRes = await get<{ admins: ModuleAdminView[] }>(
      "/v1/modules/companies/admins",
      token,
    );
    admins = adminsRes.admins ?? [];
  } catch (e) {
    loadError = (e as Error).message;
  }

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
      </div>

      {loadError && (
        <div className="warning-banner" style={{ marginBottom: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {loadError}
        </div>
      )}

      {settings && (
        <ModuleSettingsClient
          settings={settings}
          admins={admins}
          canMutate={isOperator}
        />
      )}

      {/* MODULE ADMINS */}
      <section className="list-card" style={{ marginBottom: 16 }}>
        <header
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 15 }}>Module Admins</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
              People who can configure this module&apos;s roles, defaults, and admin list.
              Module Admins also have module visibility regardless of item membership.
            </p>
          </div>
          <span className="pill">
            {admins.length} admin{admins.length === 1 ? "" : "s"}
          </span>
        </header>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Source</th>
                <th>Granted by</th>
                <th>Granted at</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)", padding: 16 }}>
                    No module admins configured yet.
                  </td>
                </tr>
              )}
              {admins.map((admin) => (
                <tr key={admin.userId}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        className="avatar-circle"
                        aria-hidden
                        style={{
                          background: "var(--violet-soft)",
                          color: "var(--violet)",
                        }}
                      >
                        {initials(admin.userId)}
                      </span>
                      <Link
                        href={`/dashboard/users/list/${admin.userId}`}
                        style={{ color: "var(--fg)", fontWeight: 500 }}
                      >
                        {admin.userId}
                      </Link>
                    </div>
                  </td>
                  <td>
                    <span className="pill is-violet">
                      {admin.source === "bootstrap" ? "Bootstrap" : "Manual"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>
                    {admin.grantedBy ?? "—"}
                  </td>
                  <td style={{ color: "var(--muted)" }}>
                    {admin.grantedAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AVAILABLE ROLES */}
      {settings && (
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
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                {settings.availableRoleKeys.map((k) => (
                  <tr key={k}>
                    <td>
                      <code style={{ fontSize: 12 }}>{k}</code>
                    </td>
                    <td>
                      {k === settings.defaultRoleKey ? (
                        <span
                          className="pill"
                          style={{
                            background: "var(--violet-soft)",
                            color: "var(--violet)",
                          }}
                        >
                          Default
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODULE REGISTRY */}
      <section className="list-card">
        <header style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Module Registry</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
            Service identifiers and storage layout for this sovereign module.
          </p>
        </header>
        <div style={{ padding: "8px 16px" }}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 2fr)",
              gap: "12px 24px",
              margin: 0,
            }}
          >
            {REGISTRY.map((entry) => (
              <div key={entry.key} style={{ display: "contents" }}>
                <dt
                  style={{
                    color: "var(--fg-2)",
                    fontSize: 14,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {entry.label}
                </dt>
                <dd
                  style={{
                    color: "var(--muted)",
                    fontSize: 14,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                    margin: 0,
                  }}
                >
                  {entry.value}
                </dd>
              </div>
            ))}
            {settings && (
              <div style={{ display: "contents" }}>
                <dt
                  style={{
                    color: "var(--fg-2)",
                    fontSize: 14,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  Settings doc version
                </dt>
                <dd
                  style={{
                    color: "var(--muted)",
                    fontSize: 14,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                    margin: 0,
                  }}
                >
                  v{settings.version} · last updated{" "}
                  {settings.updatedAt.slice(0, 10)}
                  {settings.updatedBy ? ` by ${settings.updatedBy}` : ""}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </Chrome>
  );
}
