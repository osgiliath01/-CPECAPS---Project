import { useEffect, useRef, useState } from "react";

export default function CreateProjectDialog({ onSave, onClose }) {
  const ref = useRef(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  async function submit(e) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return setError("Enter a project title.");
    setBusy(true);
    setError("");
    try {
      await onSave(clean);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="newproj-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <form onSubmit={submit}>
        <h2 id="newproj-title">Create new project</h2>
        <label>
          Project title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
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
            {busy ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </dialog>
  );
}