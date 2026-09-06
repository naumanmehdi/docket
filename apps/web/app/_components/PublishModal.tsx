"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";
import { categoriesFor } from "@/lib/taxonomy";

type Kind = "idea" | "app" | "mcp" | "skill";
const KINDS: Kind[] = ["idea", "app", "mcp", "skill"];

const KIND_LABEL: Record<Kind, string> = {
  idea: "💡 Idea — an unbuilt thought",
  app: "App — a built product",
  mcp: "MCP server",
  skill: "Agent skill (Claude / OpenAI-compatible)",
};
const NAME_LABEL: Record<Kind, string> = {
  idea: "Idea name", app: "App name", mcp: "MCP name", skill: "Skill name",
};
const TAG_LABEL: Record<Kind, string> = {
  idea: "One-line problem / pitch", app: "One-line tagline", mcp: "One-line tagline", skill: "One-line tagline",
};
const NAME_PH: Record<Kind, string> = {
  idea: "e.g. Offline-first habit tracker", app: "e.g. AgentScribe", mcp: "e.g. supabase-mcp", skill: "e.g. copy-craft",
};

export default function PublishModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"form" | "agent">("form");
  const [kind, setKind] = useState<Kind>("idea");
  const [cats, setCats] = useState<string[]>([]);
  const [catQuery, setCatQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [author, setAuthor] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const needsUrl = kind !== "idea";
  const isIdea = kind === "idea";
  const catsAvail = isIdea ? [] : categoriesFor(kind);
  const catMatches = catsAvail.filter((c) => c.toLowerCase().includes(catQuery.trim().toLowerCase()));

  // close on outside click of category menu + Escape
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); setMenuOpen(false); }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  function reset() {
    setTab("form"); setKind("idea"); setCats([]); setCatQuery(""); setName(""); setTag(""); setUrl("");
    setDesc(""); setAuthor(""); setMsg(null); setMenuOpen(false);
  }

  function addCat(c: string) {
    if (cats.includes(c) || cats.length >= 3) return;
    setCats((p) => [...p, c]); setCatQuery("");
    setMenuOpen(false); // close so the user can pick the next category cleanly
  }

  async function submit() {
    setBusy(true); setMsg(null);
    const payload: Record<string, string | string[]> = { kind, name, tagline: tag, description: desc, author };
    if (!isIdea) {
      if (url) payload.url = url;
      if (cats.length) payload.category = cats.join(", "); // single category column; multi is comma-joined
    }
    try {
      const res = await fetch("/api/listings", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: "err", text: data.errors?.join(" · ") ?? "Something went wrong." });
      } else {
        setMsg({ kind: "ok", text: isIdea ? `“${name}” is on the board, open to build.` : `“${name}” is live on the board.` });
        reset();
      }
    } catch {
      setMsg({ kind: "err", text: "Network error — please try again." });
    } finally { setBusy(false); }
  }

  return (
    <div className={`modal-mask${open ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="mhead">
          <h3>Publish to {SITE.name}</h3>
          <button className="x" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* tabs */}
        <div className="mtab">
          <button className={tab === "form" ? "on" : ""} onClick={() => setTab("form")}>Web form</button>
          <button className={tab === "agent" ? "on" : ""} onClick={() => setTab("agent")}>Or ask your agent</button>
        </div>

        {tab === "form" ? (
          <>
            {/* kind selector */}
            <label className="mlab">What are you publishing?</label>
            <select
              className="minput"
              value={kind}
              onChange={(e) => { setKind(e.target.value as Kind); setCats([]); setCatQuery(""); }}
            >
              {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>

            <label className="mlab">{NAME_LABEL[kind]}</label>
            <input className="minput" placeholder={NAME_PH[kind]} value={name} onChange={(e) => setName(e.target.value)} />

            <label className="mlab">{TAG_LABEL[kind]}</label>
            <input className="minput" placeholder={isIdea ? "The problem it solves / who it’s for" : "One line: what it is"} value={tag} onChange={(e) => setTag(e.target.value)} />

            {needsUrl && (
              <>
                <label className="mlab">URL</label>
                <input className="minput" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
              </>
            )}

            {!isIdea && (
              <>
                <label className="mlab">Category — optional, up to 3</label>
                <div className="combo" ref={menuRef}>
                  <input
                    className="minput"
                    placeholder="Search categories…"
                    value={catQuery}
                    onFocus={() => setMenuOpen(true)}
                    onChange={(e) => { setCatQuery(e.target.value); setMenuOpen(true); }}
                  />
                  <div className={`cmenu${menuOpen ? " open" : ""}`}>
                    {catMatches.length === 0 ? (
                      <div className="none">No matches</div>
                    ) : catMatches.map((c) => (
                      <div
                        key={c}
                        className={`mi ${cats.includes(c) ? "sel" : ""} ${cats.length >= 3 && !cats.includes(c) ? "dim" : ""}`}
                        onClick={() => addCat(c)}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
                {cats.length > 0 && (
                  <div className="selcats">
                    {cats.map((c) => (
                      <span key={c} className="sc">
                        {c}
                        <button className="x" onClick={() => setCats((p) => p.filter((x) => x !== c))} aria-label="Remove">×</button>
                      </span>
                    ))}
                    <span className="catcount">{cats.length} of 3 used</span>
                  </div>
                )}
              </>
            )}

            <label className="mlab">Description — optional</label>
            <textarea className="minput" rows={3} placeholder={isIdea ? "Who it’s for, rough requirements, constraints…" : "A bit more about it"} value={desc} onChange={(e) => setDesc(e.target.value)} />

            <label className="mlab">Your handle (X / GitHub)</label>
            <input className="minput" placeholder="@yourhandle" value={author} onChange={(e) => setAuthor(e.target.value)} />

            <button className="pbtn" onClick={submit} disabled={busy}>
              {busy ? "Publishing…" : `Publish ${isIdea ? "idea" : "free"} →`}
            </button>

            {msg && <div className={`msg ${msg.kind}`}>{msg.text}</div>}
          </>
        ) : (
          <div className="agentpane">
            <p>Prefer your agent to do it? Just say one line where you already work:</p>
            <div className="agent">“publish my idea about an <b>offline habit tracker for night-shift workers</b>”<br />→ it appears on the board as <b>open to build</b>.</div>
            <p>Works for apps, MCPs and skills too:</p>
            <div className="agent">“list my app” · “register this MCP” · “I made a Claude skill”</div>
            <div className="agent">connect: <b>install docket from https://{SITE.domain}/mcp</b></div>
            <p className="hint2">Switching back to the web form publishes right here — same board.</p>
          </div>
        )}
      </div>
    </div>
  );
}
