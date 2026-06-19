"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  creator: { name: string; email: string };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function CreateCustomerForm({ creator }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [rep, setRep] = useState(creator.name);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idPreview = name ? `#C-${slugify(name).toUpperCase().slice(0, 4) || "NEW"}` : "#C-NEW";
  const slugPreview = slugify(name);

  async function submit(asDraft: boolean) {
    setBusy(true);
    setDraft(asDraft);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name,
      };
      if (slugPreview) body.slug = slugPreview;
      const res = await fetch("/dashboard/companies/api/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error || `${res.status}`);
      }
      const companyId = (j.companyId as string) || "";
      if (companyId) {
        router.push(`/dashboard/companies/${companyId}`);
        return;
      }
      router.push("/dashboard/companies");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setDraft(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      {/* Top action row */}
      <div
        className="page-header"
        style={{ marginBottom: 16, paddingBottom: 0 }}
      >
        <div />
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => submit(true)}
            disabled={busy || !name}
          >
            {busy && draft ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !name}
          >
            {busy && !draft ? "Creating…" : "Create Customer"}
          </button>
        </div>
      </div>

      {/* System Generated */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-icon" aria-hidden>⚙</span>
          <h3 className="section-card-title">System Generated</h3>
        </div>
        <div className="field-grid">
          <div className="field">
            <label className="field-label">IDENTIFIER</label>
            <input
              className="field-input is-readonly"
              value={idPreview}
              readOnly
            />
            <span className="field-hint">Auto-assigned on save.</span>
          </div>
          <div className="field">
            <label className="field-label">CREATOR</label>
            <input
              className="field-input is-readonly"
              value={creator.name}
              readOnly
            />
          </div>
          <div className="field">
            <label className="field-label">CREATOR EMAIL</label>
            <input
              className="field-input is-readonly"
              value={creator.email}
              readOnly
            />
          </div>
          <div className="field">
            <label className="field-label">SLUG PREVIEW</label>
            <input
              className="field-input is-readonly"
              value={slugPreview || "—"}
              readOnly
            />
            <span className="field-hint">
              Derived from name. Editable after creation.
            </span>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-icon" aria-hidden>◐</span>
          <h3 className="section-card-title">Customer Details</h3>
        </div>
        <div className="field-grid">
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
            <label className="field-label">EMAIL</label>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@acme.com"
            />
            <span className="field-hint">
              Primary point of contact. Stored on the directory only for now.
            </span>
          </div>
          <div className="field">
            <label className="field-label">PHONE</label>
            <input
              className="field-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 555 0100"
            />
          </div>
          <div className="field">
            <label className="field-label">ADDRESS</label>
            <input
              className="field-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Madison, WI"
            />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">ACCOUNT REPRESENTATIVE</label>
            <input
              className="field-input"
              value={rep}
              onChange={(e) => setRep(e.target.value)}
              placeholder="Search representatives…"
            />
            <span className="field-hint">
              Defaults to current operator. Free-text in this release.
            </span>
          </div>
        </div>
      </div>

      {/* Attach Users (stub — runs after create from the detail page) */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-icon" aria-hidden>👥</span>
          <h3 className="section-card-title">Attach Users</h3>
        </div>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Users are attached after the customer record exists. Click{" "}
          <strong>Create Customer</strong> to continue — you&apos;ll land on the
          detail page where you can attach users immediately.
        </p>
      </div>

      {error && (
        <div className="warning-banner" style={{ marginTop: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {error}
        </div>
      )}
    </form>
  );
}
