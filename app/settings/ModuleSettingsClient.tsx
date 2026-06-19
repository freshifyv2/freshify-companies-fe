"use client";

/**
 * Sprint 4 — Module Registry Settings (Phase B) — client island for
 * Companies Module Settings.
 *
 * Wires the Add Admin / Remove Admin / Set Default Role mutations to the
 * BE-backed proxy routes in app/api/module-{settings,admins}/.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ModuleAdminView, ModuleSettingsView } from "@/lib/api";

interface Props {
  settings: ModuleSettingsView;
  admins: ModuleAdminView[];
  canMutate: boolean;
}

export default function ModuleSettingsClient({
  settings,
  admins,
  canMutate,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newAdminId, setNewAdminId] = useState("");
  const [defaultRoleKey, setDefaultRoleKey] = useState(settings.defaultRoleKey);

  function flash(msg: string) {
    setSuccess(msg);
    setError(null);
    startTransition(() => router.refresh());
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newAdminId.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/dashboard/companies/api/module-admins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: newAdminId.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `${res.status}`);
      setNewAdminId("");
      flash("✓ Module admin added.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeAdmin(userId: string) {
    if (!confirm(`Remove ${userId} from module admins?`)) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/dashboard/companies/api/module-admins/${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `${res.status}`);
      flash(j.removed ? "✓ Module admin removed." : "Already not an admin.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveDefaultRole(e: React.FormEvent) {
    e.preventDefault();
    if (defaultRoleKey === settings.defaultRoleKey) {
      setSuccess("Nothing to save.");
      setError(null);
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/dashboard/companies/api/module-settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ defaultRoleKey }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `${res.status}`);
      flash(`✓ Default role set to ${defaultRoleKey}.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      {error && (
        <div className="warning-banner" style={{ marginBottom: 16 }}>
          <span className="warning-banner-icon" aria-hidden>⚠</span>
          {error}
        </div>
      )}
      {success && (
        <div
          className="warning-banner"
          style={{
            marginBottom: 16,
            background: "var(--green-soft)",
            color: "var(--green-text)",
          }}
        >
          <span className="warning-banner-icon" aria-hidden>✓</span>
          {success}
        </div>
      )}

      {/* ADD ADMIN */}
      {canMutate && (
        <section className="section-card" style={{ marginBottom: 16 }}>
          <div className="section-card-header">
            <span className="section-card-icon" aria-hidden>+</span>
            <h3 className="section-card-title">Add Module Admin</h3>
          </div>
          <form onSubmit={addAdmin}>
            <div className="field-grid">
              <div className="field">
                <label className="field-label">USER ID</label>
                <input
                  className="field-input"
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  placeholder="usr_..."
                  required
                />
                <span className="field-hint">
                  Grant a user the ability to configure the Companies module.
                </span>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending || !newAdminId.trim()}
              >
                {pending ? "Working..." : "Add Admin"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SET DEFAULT ROLE */}
      {canMutate && (
        <section className="section-card" style={{ marginBottom: 16 }}>
          <div className="section-card-header">
            <span className="section-card-icon" aria-hidden>◐</span>
            <h3 className="section-card-title">Default Role for New Invitees</h3>
          </div>
          <form onSubmit={saveDefaultRole}>
            <div className="field-grid">
              <div className="field">
                <label className="field-label">DEFAULT ROLE</label>
                <select
                  className="field-input field-select"
                  value={defaultRoleKey}
                  onChange={(e) => setDefaultRoleKey(e.target.value)}
                >
                  {settings.availableRoleKeys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <span className="field-hint">
                  Must be one of the available roles above.
                </span>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  pending || defaultRoleKey === settings.defaultRoleKey
                }
              >
                {pending ? "Saving..." : "Save Default Role"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* REMOVE ADMIN INLINE ACTIONS */}
      {canMutate && admins.length > 0 && (
        <section className="list-card" style={{ marginBottom: 16 }}>
          <header
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 15 }}>Remove Module Admin</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Revoke a user&apos;s module-admin grant. The action is idempotent.
            </p>
          </header>
          <div style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {admins.map((a) => (
              <button
                key={a.userId}
                type="button"
                className="btn btn-secondary"
                onClick={() => removeAdmin(a.userId)}
                disabled={pending}
              >
                Remove {a.userId}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
