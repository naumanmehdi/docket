"use client";

import { useState } from "react";

const FIELDS: Array<{
  name: "name" | "url" | "tagline" | "category" | "x_handle";
  label: string;
  placeholder: string;
  type?: string;
}> = [
  { name: "name", label: "Tool name", placeholder: "AgentScribe" },
  { name: "url", label: "Website URL", placeholder: "https://agentscribe.dev", type: "url" },
  { name: "tagline", label: "One-line tagline", placeholder: "Turns meetings into notes" },
  { name: "category", label: "Category", placeholder: "Productivity" },
  { name: "x_handle", label: "X (Twitter) handle — optional", placeholder: "@agentscribe" },
];

export default function ListingForm() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ kind: "idle" | "ok" | "err"; text: string }>({
    kind: "idle",
    text: "",
  });
  const [busy, setBusy] = useState(false);

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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "err", text: data.errors?.join(" · ") ?? "Something went wrong." });
      } else {
        setState({
          kind: "ok",
          text: `${data.listing.name} is live. It’s on the board right now.`,
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
      {FIELDS.map((f) => (
        <div className="field" key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            name={f.name}
            type={f.type ?? "text"}
            placeholder={f.placeholder}
            value={form[f.name] ?? ""}
            onChange={(e) => set(f.name, e.target.value)}
            required={f.name !== "x_handle"}
          />
        </div>
      ))}
      <button className="btn primary submit" disabled={busy}>
        {busy ? "Listing…" : "List it free"}
      </button>
      {state.kind !== "idle" && (
        <div className={`msg ${state.kind}`} role="status">
          {state.text}
        </div>
      )}
    </form>
  );
}
