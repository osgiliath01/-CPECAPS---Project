import { useState } from "react";
import { useModal } from "../hooks/useModal";
import { cents, fmtStamp, todayISO } from "../utils/format";

export default function EntryDialog({ mode, entry, defaultProject, projectTitles, user, onSave, onClose }) {
  const [ref, dialogProps] = useModal(onClose);
  const [form, setForm] = useState(() =>
    mode === "edit"
      ? { date: entry.date, cv_no: entry.cv_no, payee: entry.payee, amount: String(entry.amount) }
      : { project_title: defaultProject, date: todayISO(), cv_no: "", payee: "", amount: "" }
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = mode === "create" && !!defaultProject;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError("Enter an amount greater than zero.");

    const title = (locked ? defaultProject : form.project_title).trim();
    if (!locked && projectTitles.some((t) => t.trim().toLowerCase() === title.toLowerCase())) {
      return setError("A project with this title already exists. Open it from the list and add the record there.");
    }

    setBusy(true);
    try {
      if (mode === "create") {
        await onSave({
          project_title: title,
          date: form.date,
          cv_no: form.cv_no.trim(),
          payee: form.payee.trim(),
          amount: amount.toFixed(2),
        });
      } else {
        const next = {
          date: form.date,
          cv_no: form.cv_no.trim(),
          payee: form.payee.trim(),
          amount: amount.toFixed(2),
        };
        const changes = {};
        for (const k of Object.keys(next)) {
          const same = k === "amount" ? cents(entry.amount) === cents(next.amount) : entry[k] === next[k];
          if (!same) changes[k] = next[k];
        }
        if (Object.keys(changes).length === 0) {
          ref.current.close();
          return;
        }
        await onSave({ ...changes, editor_name: user.name });
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <dialog className="dialog" aria-labelledby="entry-title" {...dialogProps}>
      <form onSubmit={submit}>
        <h2 id="entry-title">
          {mode === "edit" ? "Edit record" : locked ? "Add record" : "Create new project"}
        </h2>

        {mode === "create" &&
          (locked ? (
            <p className="hint">
              Adding a record to <strong>{defaultProject}</strong>.
            </p>
          ) : (
            <label>
              New project title
              <input
                value={form.project_title}
                onChange={set("project_title")}
                required
                autoFocus
              />
            </label>
          ))}

        <div className="row">
          <label>
            Date
            <input type="date" value={form.date} onChange={set("date")} required />
          </label>
          <label>
            CV no.
            <input value={form.cv_no} onChange={set("cv_no")} required />
          </label>
        </div>
        <label>
          Payee / Particulars
          <input value={form.payee} onChange={set("payee")} required />
        </label>
        <label>
          Amount (PHP)
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={set("amount")}
            required
          />
        </label>

        <p className="hint">
          {mode === "create"
            ? `Encoded by ${user.name}.`
            : `Added by ${entry.created_by} on ${fmtStamp(entry.created_at)}. Your name will be recorded as the editor.`}
        </p>

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
            {busy ? "Saving…" : mode === "create" ? "Add record" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}