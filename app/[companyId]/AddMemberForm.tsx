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
    <div className="card">
      <div className="card-header">
        <h2>Add a member</h2>
        <p className="muted">Assign a user to this company with a role.</p>
      </div>
      <form onSubmit={submit} className="stack">
        <div className="row-2">
          <div className="field">
            <label className="field-label">User ID</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="usr_..."
              required
            />
          </div>
          <div className="field">
            <label className="field-label">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")}>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
        {error && <div className="field-error">{error}</div>}
        {success && <div className="field-success">{success}</div>}
        <div className="cluster">
          <button type="submit" className="btn btn-primary" disabled={busy || !userId}>
            {busy ? "Adding..." : "Add member"}
          </button>
        </div>
      </form>
    </div>
  );
}
