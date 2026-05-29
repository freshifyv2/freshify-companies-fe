import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sovereign Portal — Companies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <div className="brand">Sovereign Portal</div>
            <div className="nav-links">
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <Link href="/dashboard/companies" className="nav-link active">Companies</Link>
              <Link href="/dashboard/workspaces" className="nav-link">Workspaces</Link>
              <Link href="/dashboard/users/account" className="nav-link">Account</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
