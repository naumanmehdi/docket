"use client";

import { useState } from "react";

const KINDS = [
  { value: "idea", label: "💡 Idea — an unbuilt thought", url: false },
  { value: "app", label: "🖥 App — a built product", url: true },
  { value: "mcp", label: "🔌 MCP server", url: true },
  { value: "skill", label: "🧩 Agent skill (Claude / OpenAI-compatible)", url: true },
];

export default function ListingForm() {
  const [kind, setKind] = useState("idea");
  const [form, setForm] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ kind: "idle" | "ok" | "err"; text: string }>({
    kind: "idle",
    text: "",
  });
  const [busy, setBusy] = useState(false);

  const needsUrl = KINDS.find((k) => k.value === kind)?.url ?? false;

  function set(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setState({ kind: "idle", text: "" });
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "err", text: data.errors?.join(" · ") ?? "Something went wrong." });
      } else {
        const isIdea = kind === "idea";
        setState({
          kind: "ok",
          text: isIdea
            ? `${data.listing.name} is on the board. Someone (or their agent) may build it.`
            : `${data.listing.name} is live. It’s on the board right now.`,
        });
        setForm({});
      }
    } catch {
      setState({ kind: "err", text: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="kind">What is it?</label>
        <select id="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="name">{kind === "idea" ? "Idea name" : "Name"}</label>
        <input
          id="name"
          placeholder={kind === "idea" ? "Offline-first habit tracker" : "AgentScribe"}
          value={form.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="tagline">One-line {kind === "idea" ? "problem / pitch" : "tagline"}</label>
        <input
          id="tagline"
          placeholder={kind === "idea" ? "Built for night-shift workers who can’t keep a routine" : "Turns meetings into notes"}
          value={form.tagline ?? ""}
          onChange={(e) => set("tagline", e.target.value)}
          required
        />
      </div>
      {needsUrl && (
        <div className="field">
          <label htmlFor="url">URL</label>
          <input
            id="url"
            type="url"
            placeholder="https://…"
            value={form.url ?? ""}
            onChange={(e) => set("url", e.target.value)}
            required
          />
        </div>
      )}
      <div className="field">
        <label htmlFor="description">Description — optional</label>
        <textarea
          id="description"
          placeholder={kind === "idea" ? "Who it’s for, rough requirements, any constraints…" : "A bit more about it"}
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="author">Your handle (X / GitHub) or name</label>
        <input
          id="author"
          placeholder="@naumanmehdi"
          value={form.author ?? ""}
          onChange={(e) => set("author", e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="author_contact">A way for a builder to reach you — optional</label>
        <input
          id="author_contact"
          placeholder={kind === "idea" ? "email or X handle" : "best left blank for an app"}
          value={form.author_contact ?? ""}
          onChange={(e) => set("author_contact", e.target.value)}
        />
      </div>
      <button className="btn primary submit" disabled={busy}>
        {busy ? "Publishing…" : kind === "idea" ? "Publish idea" : "Publish free"}
      </button>
      {state.kind !== "idle" && (
        <div className={`msg ${state.kind}`} role="status">
          {state.text}
        </div>
      )}
    </form>
  );
}
