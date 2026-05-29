import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { readSessionToken } from "@/lib/session";
import { get, type CompanyDetail } from "@/lib/api";
import AddMemberForm from "./AddMemberForm";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: { companyId: string };
}) {
  const token = readSessionToken();
  if (!token) redirect("/login");

  let company: CompanyDetail | null = null;
  let error: string | null = null;
  try {
    company = await get<CompanyDetail>(`/v1/companies/${params.companyId}`, token);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("404")) notFound();
    error = msg;
  }

  return (
    <div className="container">
      <div className="stack" style={{ gap: 24 }}>
        <div>
          <Link href="/dashboard/companies" className="nav-link">← All companies</Link>
        </div>

        {error && <div className="card"><div className="error">{error}</div></div>}

        {company && (
          <>
            <div className="between">
              <div>
                <div className="kicker">Company</div>
                <h1 style={{ marginTop: 8 }}>{company.name}</h1>
              </div>
              <span className="pill">{company.kind}</span>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: 16 }}>Details</h2>
              <table>
                <tbody>
                  <tr><th style={{ width: 200 }}>Company ID</th><td><code style={{ fontSize: 13 }}>{company.companyId}</code></td></tr>
                  <tr><th>Slug</th><td>{company.slug || "—"}</td></tr>
                  <tr><th>Tier</th><td>{company.tier || "—"}</td></tr>
                  <tr><th>Owner User ID</th><td><code style={{ fontSize: 13 }}>{company.ownerUserId}</code></td></tr>
                </tbody>
              </table>
            </div>

            <AddMemberForm companyId={company.companyId} />

            <div className="card">
              <h2 style={{ marginBottom: 8 }}>Workspaces in this company</h2>
              <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                Workspaces are scoped to the active company in your session.
              </p>
              <Link href="/dashboard/workspaces" className="nav-link">Go to workspaces →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
