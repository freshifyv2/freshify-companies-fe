"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/dashboard/companies/api/create", {
        // Shell rewrites this back to companies-fe /api/create
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `${res.status}`);
      }
      setName("");
      setSlug("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: 16 }}>Create a company</h2>
      <form onSubmit={submit} className="stack">
        <div>
          <label className="label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Acme, Inc." />
        </div>
        <div>
          <label className="label">Slug (optional)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme" />
        </div>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <button type="submit" className="primary" disabled={busy || !name}>
            {busy ? "Creating..." : "Create company"}
          </button>
        </div>
      </form>
    </div>
  );
}
