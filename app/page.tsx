import { redirect } from "next/navigation";
import Link from "next/link";
import { readSessionToken } from "@/lib/session";
import { get, type CompanyListItem } from "@/lib/api";
import CreateCompanyForm from "./CreateCompanyForm";

export const dynamic = "force-dynamic";

export default async function CompaniesIndex() {
  const token = readSessionToken();
  if (!token) redirect("/login");

  let companies: CompanyListItem[] = [];
  let error: string | null = null;
  try {
    const out = await get<{ companies: CompanyListItem[] }>("/v1/companies", token);
    companies = out.companies;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="container">
      <div className="stack" style={{ gap: 24 }}>
        <div className="between">
          <div>
            <div className="kicker">Companies</div>
            <h1 style={{ marginTop: 8 }}>Your companies</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Every user has a personal company. Organizations are created and shared.
            </p>
          </div>
        </div>

        {error && <div className="card"><div className="error">{error}</div></div>}

        <div className="card">
          {companies.length === 0 ? (
            <div className="muted">No companies yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kind</th>
                  <th>Role</th>
                  <th>Tier</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.companyId}>
                    <td>
                      <Link href={`/dashboard/companies/${c.companyId}`}>{c.name}</Link>
                    </td>
                    <td><span className="pill">{c.kind}</span></td>
                    <td>{c.role}</td>
                    <td className="muted">{c.tier || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/dashboard/companies/${c.companyId}`} className="nav-link">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <CreateCompanyForm />
      </div>
    </div>
  );
}
