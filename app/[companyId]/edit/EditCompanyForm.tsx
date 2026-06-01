"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  companyId: string;
  initial: {
    name: string;
    slug: string | null;
    tier: string | null;
    kind: "personal" | "organization";
  };
  operatorName: string;
}

export default function EditCompanyForm({
  companyId,
  initial,
  operatorName,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [tier, setTier] = useState(initial.tier ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body: Record<string, unknown> = {};
      if (name !== initial.name) body.name = name;
      const normSlug = slug.trim() || null;
      if (normSlug !== initial.slug) body.slug = normSlug;
      const normTier = tier.trim() || null;
      if (normTier !== initial.tier) body.tier = normTier;

      if (Object.keys(body).length === 0) {
        setSuccess("Nothing to save.");
        setBusy(false);
        return;
      }

      const res = await fetch(
        `/dashboard/companies/api/admin/${encodeURIComponent(companyId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error || `${res.status}`);
      }
      const changed = (j.changed as string[] | undefined) ?? [];
      setSuccess(
        changed.length > 0
          ? `✓ Saved: ${changed.join(", ")}`
          : "✓ Saved.",
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-icon" aria-hidden>◐</span>
          <h3 className="section-card-title">Primary Information</h3>
        </div>
        <div className="field-grid">
          <div className="field">
            <label className="field-label">IDENTIFIER</label>
            <input
              className="field-input is-readonly"
              value={companyId}
              readOnly
            />
            <span className="field-hint">System-generated, immutable.</span>
          </div>
          <div className="field">
            <label className="field-label">STATUS</label>
            <select className="field-input field-select" disabled value="active">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
            <span className="field-hint">
              Status changes coming in a future release.
            </span>
          </div>
          <div className="field">
            <label className="field-label">COMPANY NAME</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Acme, Inc."
            />
          </div>
          <div className="field">
            <label className="field-label">SLUG</label>
            <input
              className="field-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="acme"
            />
            <span className="field-hint">
              Lowercase letters, digits, and dashes only.
            </span>
          </div>
          <div className="field">
            <label className="field-label">TIER</label>
            <input
              className="field-input"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              placeholder="Standard"
            />
          </div>
          <div className="field">
            <label className="field-label">KIND</label>
            <input
              className="field-input is-readonly"
              value={initial.kind}
              readOnly
            />
            <span className="field-hint">
              Kind is set at creation and cannot change.
            </span>
          </div>
          <div className="field">
            <label className="field-label">CREATOR</label>
            <input
              className="field-input is-readonly"
              value={operatorName}
              readOnly
            />
          </div>
          <div className="field">
            <label className="field-label">RAS REPRESENTATIVE</label>
            <input
              className="field-input is-readonly"
              value={operatorName}
              readOnly
            />
          </div>
        </div>

        {error && (
          <div className="warning-banner" style={{ marginTop: 16 }}>
            <span className="warning-banner-icon" aria-hidden>⚠</span>
            {error}
          </div>
        )}
        {success && (
          <div
            className="warning-banner"
            style={{
              marginTop: 16,
              background: "var(--green-soft)",
              color: "var(--green-text)",
            }}
          >
            <span className="warning-banner-icon" aria-hidden>✓</span>
            {success}
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !name}
          >
            {busy ? "Saving..." : "Save Changes"}
          </button>
          <a
            href={`/dashboard/companies/${companyId}`}
            className="btn btn-secondary"
          >
            Cancel
          </a>
        </div>
      </div>
    </form>
  );
}
