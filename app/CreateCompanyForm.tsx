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
      <div className="card-header">
        <h2>Create a company</h2>
        <p className="muted">Organizations are sovereign — each gets its own ID, members, and workspaces.</p>
      </div>
      <form onSubmit={submit} className="stack">
        <div className="row-2">
          <div className="field">
            <label className="field-label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Acme, Inc." />
          </div>
          <div className="field">
            <label className="field-label">Slug (optional)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme" />
          </div>
        </div>
        {error && <div className="field-error">{error}</div>}
        <div className="cluster">
          <button type="submit" className="btn btn-primary" disabled={busy || !name}>
            {busy ? "Creating..." : "Create company"}
          </button>
        </div>
      </form>
    </div>
  );
}
