/**
 * UCM04 — Create Customer.
 *
 * Operator-only. Three in-scope sections:
 *   - System Generated (Identifier preview, Creator, Creator Email — read-only)
 *   - Customer Details (Name, Email, Phone, Address, Account Representative)
 *   - Attach Users (post-create stub — added after the customer record exists)
 *
 * OUT OF SCOPE (deferred):
 *   - Attach Locations, Payable Pricing, Receivable Pricing,
 *     Latest Orders, Reporting Overview.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { readSessionToken, decodeClaims } from "@/lib/session";
import { Chrome } from "@/lib/Chrome";
import { OperatorOnly403 } from "@/lib/OperatorOnly";
import { loadChromeContext } from "@/lib/chromeContext";
import CreateCustomerForm from "./CreateCustomerForm";

export const dynamic = "force-dynamic";

function handleFromEmail(email?: string | null): string {
  if (!email) return "user";
  if (email.startsWith("+")) return email.replace(/[^0-9]/g, "");
  return email.split("@")[0] || email;
}

export default async function NewCustomerPage() {
  const token = readSessionToken();
  if (!token) redirect("/login");
  const claims = decodeClaims(token);
  if (!claims) redirect("/login");

  const isOperator = Boolean(claims.operator);
  if (!isOperator) {
    return (
      <OperatorOnly403
        active="companies"
        pageTitle="New Customer"
        user={{
          userId: claims.userId,
          displayName: claims.displayName || claims.email || "User",
          handle: (claims.email || "").startsWith("+")
            ? (claims.email || "").replace(/[^0-9]/g, "")
            : (claims.email || "").split("@")[0] || "user",
          isOperator: false,
        }}
        activeCompany={claims.companyName ? { name: claims.companyName } : null}
        detail="Creating customers"
      />
    );
  }

  const ctx = await loadChromeContext();
  const displayName = claims.displayName || claims.email || "User";
  const handle = handleFromEmail(claims.email);

  return (
    <Chrome
      active="companies"
      pageTitle="New Customer"
      user={{ userId: claims.userId, displayName, handle, isOperator }}
      activeCompany={ctx?.activeCompany ?? null}
      tenantOptions={ctx?.tenantOptions ?? []}
    >
      <div className="page-breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="page-breadcrumb-sep">›</span>
        <Link href="/dashboard/companies">Customers</Link>
        <span className="page-breadcrumb-sep">›</span>
        <span className="page-breadcrumb-current">New Customer</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-header-title">Create Customer</h1>
          <p className="page-header-sub">
            Add a new tenant to the directory. You can attach users immediately
            after creation.
          </p>
        </div>
      </div>

      <CreateCustomerForm
        creator={{ name: displayName, email: claims.email }}
      />
    </Chrome>
  );
}
