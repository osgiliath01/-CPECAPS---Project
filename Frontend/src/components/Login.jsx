import { useState } from "react";
import logo from "../assets/logo.webp";

const EMPTY = { name: "", username: "", password: "", confirm: "" };

export default function Login({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setForm(EMPTY);
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    const username = form.username.trim();

    if (isRegister) {
      // same limits as the backend's UserCreate schema
      if (name.length < 3) return setError("Full name must be at least 3 characters.");
      if (username.length < 3) return setError("Username must be at least 3 characters.");
      if (form.password.length < 8) return setError("Password must be at least 8 characters.");
      if (form.password !== form.confirm) return setError("The passwords don't match.");
    }

    setBusy(true);
    try {
      if (isRegister) await onRegister({ name, username, password: form.password });
      else await onLogin(username, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <header className="login-brand">
        <img src={logo} alt="Calamba Allied Industrial Corporation" className="login-logo" />
      </header>

      <form className="login-sheet" onSubmit={submit}>
        <div key={mode} className="login-fields">
          <h1>{isRegister ? "Create account" : "Sign in"}</h1>
          {isRegister && (
            <label>
              Full name
              <input
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
                minLength={3}
                maxLength={50}
                autoFocus
                required
              />
            </label>
          )}
          <label>
            Username
            <input
              value={form.username}
              onChange={set("username")}
              autoComplete="username"
              minLength={isRegister ? 3 : undefined}
              maxLength={50}
              autoFocus={!isRegister}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : undefined}
              maxLength={128}
              required
            />
          </label>
          {isRegister && (
            <label>
              Confirm password
              <input
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="pill primary" disabled={busy}>
            {busy
              ? isRegister
                ? "Creating account…"
                : "Signing in…"
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>

          <p className="switch">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" className="link" onClick={switchMode}>
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </form>
    </main>
  );
}