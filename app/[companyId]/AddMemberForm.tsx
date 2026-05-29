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
      <h2 style={{ marginBottom: 16 }}>Add a member</h2>
      <form onSubmit={submit} className="stack">
        <div>
          <label className="label">User ID</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="usr_..."
            required
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")}>
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <div>
          <button type="submit" className="primary" disabled={busy || !userId}>
            {busy ? "Adding..." : "Add member"}
          </button>
        </div>
      </form>
    </div>
  );
}
