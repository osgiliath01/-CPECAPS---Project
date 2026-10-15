import { useState } from "react";
import { useModal } from "../hooks/useModal";

export default function PasswordDialog({ onSave, onClose }) {
  const [ref, dialogProps] = useModal(onClose);
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.new_password.length < 8) return setError("Use at least 8 characters for the new password.");
    if (form.new_password !== form.confirm_password) return setError("The new passwords don't match.");
    if (form.new_password === form.old_password)
      return setError("Choose a password different from your current one.");
    setBusy(true);
    try {
      // PasswordChangeSchema requires all three fields
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <dialog className="dialog" aria-labelledby="pw-title" {...dialogProps}>
      <form onSubmit={submit}>
        <h2 id="pw-title">Change password</h2>
        <label>
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={form.old_password}
            onChange={set("old_password")}
            required
            autoFocus
          />
        </label>
        <label>
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={form.new_password}
            onChange={set("new_password")}
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={set("confirm_password")}
            required
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="pill" onClick={() => ref.current.close()}>
            Cancel
          </button>
          <button className="pill primary" disabled={busy}>
            {busy ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>
    </dialog>
  );
}