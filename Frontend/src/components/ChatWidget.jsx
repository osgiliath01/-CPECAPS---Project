import { useEffect, useRef, useState } from "react";

// TODO: replace this with a real request to your backend's chatbot endpoint.
async function askBot(message) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return "The chatbot isn't connected to a backend yet.";
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  // keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  // Escape closes the panel
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  async function send(e) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || busy) return;
    setText("");
    setMessages((m) => [...m, { from: "user", text: msg }]);
    setBusy(true);
    try {
      const reply = await askBot(msg);
      setMessages((m) => [...m, { from: "bot", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <section className="chat-panel" aria-label="Chatbot">
          <header className="chat-head">
            <strong>Assistant</strong>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </header>

          <div className="chat-body" aria-live="polite">
            {messages.map((m, i) => (
              <p key={i} className={`chat-msg ${m.from}`}>
                {m.text}
              </p>
            ))}
            {busy && <p className="chat-msg bot muted">Typing…</p>}
            <div ref={endRef} />
          </div>

          <form className="chat-form" onSubmit={send}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              aria-label="Message"
              autoFocus
            />
            <button className="pill create sm" disabled={busy || !text.trim()}>
              Send
            </button>
          </form>
        </section>
      )}

      <button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path
            d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </>
  );
}