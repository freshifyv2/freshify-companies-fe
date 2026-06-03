/**
 * OperatorOnly403 — shared "operator access required" panel.
 *
 * Deploy 5 / Portal v3. Used by URM operator-only pages so non-operators see
 * a clear 403 view instead of being silently redirected to /dashboard.
 * Matches the pattern established in portal-shell /dashboard/portal-settings.
 */
import { Chrome } from "@/lib/Chrome";

interface Props {
  active: "users" | "companies" | "workspaces" | "dashboard";
  pageTitle: string;
  user: { userId: string; displayName: string; handle: string; isOperator: boolean };
  activeCompany?: { name: string } | null;
  detail?: string; // optional context line, e.g. "User detail"
}

export function OperatorOnly403({ active, pageTitle, user, activeCompany, detail }: Props) {
  return (
    <Chrome
      active={active}
      pageTitle={pageTitle}
      user={user}
      activeCompany={activeCompany ?? null}
    >
      <div className="card" style={{ maxWidth: 640 }}>
        <h2 style={{ marginTop: 0 }}>Operator access required</h2>
        <p style={{ color: "var(--muted)" }}>
          {detail ?? "This page"} can only be viewed by portal operators. If you
          believe you should have access, contact your portal administrator.
        </p>
      </div>
    </Chrome>
  );
}
