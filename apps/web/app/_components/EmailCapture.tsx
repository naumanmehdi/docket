"use client";

import { useState } from "react";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "ok" | "err"; text: string }>({
    kind: "idle",
    text: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setState({ kind: "idle", text: "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "err", text: data.errors?.join(" · ") ?? "Something went wrong." });
      } else {
        setState({ kind: "ok", text: "You’re on the launch list. Talk soon." });
        setEmail("");
      }
    } catch {
      setState({ kind: "err", text: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email"
        />
        <button className="btn primary" disabled={busy}>
          {busy ? "Joining…" : "Join the launch list"}
        </button>
      </div>
      {state.kind !== "idle" && (
        <div className={`msg ${state.kind}`} role="status">
          {state.text}
        </div>
      )}
    </form>
  );
}
