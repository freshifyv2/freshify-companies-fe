"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddMemberForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/dashboard/companies/api/members?companyId=${encodeURIComponent(companyId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `${res.status}`);
      }
      setSuccess(`Added ${userId} as ${role}.`);
      setUserId("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field-grid">
        <div className="field">
          <label className="field-label">USER ID</label>
          <input
            className="field-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="usr_..."
            required
          />
        </div>
        <div className="field">
          <label className="field-label">ROLE</label>
          <select
            className="field-input field-select"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "member")}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      {error && (
        <div className="warning-banner" style={{ marginTop: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {error}
        </div>
      )}
      {success && (
        <div className="warning-banner" style={{ marginTop: 16, background: "var(--green-soft)", color: "var(--green-text)" }}>
          <span className="warning-banner-icon" aria-hidden>✓</span>
          {success}
        </div>
      )}
      <div style={{ marginTop: 20 }}>
        <button type="submit" className="btn btn-primary" disabled={busy || !userId}>
          {busy ? "Adding..." : "Add Member"}
        </button>
      </div>
    </form>
  );
}
