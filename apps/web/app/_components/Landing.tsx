"use client";
// docket / — landing + board shell.
import { useState } from "react";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";
import Catalog from "./Catalog";
import PublishModal from "./PublishModal";
import type { ListingRow } from "@/lib/listing";

interface Result {
  plaintext: string;
  scopes: string[];
  owner: string;
}

export default function Landing({ rows }: { rows: ListingRow[] }) {
  const [publishOpen, setPublishOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const mcpUrl = process.env.NEXT_PUBLIC_MCP_URL ?? `https://${SITE.domain}/mcp`;
  const openPublish = () => setPublishOpen(true);
  const openRegister = () => setRegisterOpen(true);

  return (
    <div className="wrap">
      <div className="header-row">
        <header>
          <div className="brand">
            <span className="mark">d</span>
            {SITE.name}
          </div>
          <nav>
            <a href="#explore">{COPY.nav.explore}</a>
            <a href="#board">{COPY.nav.board}</a>
            <a href="/mcp-docs">{COPY.nav.connect}</a>
          </nav>
        </header>
        <div className="top-cta">
          <button className="btn" onClick={openRegister}>{COPY.nav.register}</button>
        </div>
      </div>

      {/* HERO — editorial split */}
      <section className="hero">
        <div className="hero-left">
          <span className="kicker"><i />{COPY.hero.kicker}</span>
          <h1>
            {COPY.hero.titleLead} <em>{COPY.hero.titleEm}</em> {COPY.hero.titleRest}
          </h1>
          <p className="lede">{COPY.hero.lede}</p>

          <div className="cta">
            <a className="btn fire" href="#" onClick={(e) => { e.preventDefault(); openPublish(); }}>{COPY.hero.ctaPrimary}</a>
            <a className="btn outline" href="#board">{COPY.hero.ctaSecondary}</a>
          </div>

          <div className="installrow">
            <span className="i-label">{COPY.hero.connectLabel}:</span>
            <InstallCmd cmd={COPY.hero.installCmd(mcpUrl)} />
          </div>
        </div>

        <div className="hero-right">
          <div className="term">
            <div className="term-head"><span className="t">{COPY.terminal.title}</span><span className="live">live</span></div>
            <div className="term-body">
              <div className="ln"><span className="prompt">➜</span><span className="out step">step 1 — add MCP server</span></div>
              <div className="ln"><span className="prompt">➜</span><span className="cmd">{COPY.terminal.install}</span></div>
              <div className="ln"><span className="prompt">➜</span><span className="out step">step 2 — publish or find</span></div>
              <div className="ln"><span className="prompt">➜</span><span className="cmd">{COPY.terminal.publish}</span><span className="out"><span className="ok">✓</span> {COPY.terminal.publishOut}</span></div>
              <div className="ln"><span className="prompt">➜</span><span className="cmd">{COPY.terminal.find}</span><span className="out"><span className="ok">✓</span> {COPY.terminal.findOut}</span></div>
              <div className="ln"><span className="prompt">➜</span><span className="out step">step 3 — never miss a claim</span></div>
              <div className="ln"><span className="prompt">➜</span><span className="cmd">{COPY.terminal.check}</span><span className="out"><span className="ok">✓</span> {COPY.terminal.checkOut}</span></div>
              <div className="ln"><span className="prompt">➜</span><span className="caret" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* catalog: search + categories + board */}
      <Catalog rows={rows} />

      {/* feedback note */}
      <FeedbackNote />

      <footer>
        <div className="f-inner">
          <div className="f-brand">
            <div className="fo-name"><span className="mark">d</span>{SITE.name}</div>
            <p className="f-tag">{COPY.footer.tag}</p>
          </div>
          <div className="f-col">
            <div className="f-h">{COPY.footer.browse.label}</div>
            {COPY.footer.browse.links.map((l) => <a key={l.label} href={l.href} onClick={"action" in l && l.action === "publish" ? (e) => { e.preventDefault(); openPublish(); } : undefined}>{l.label}</a>)}
          </div>
          <div className="f-col">
            <div className="f-h">{COPY.footer.agents.label}</div>
            {COPY.footer.agents.links.map((l) => <a key={l.label} className="mono" href={l.href}>{l.label}</a>)}
          </div>
          <div className="f-col">
            <div className="f-h">{COPY.footer.legal.label}</div>
            {COPY.footer.legal.links.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
          </div>
        </div>
        <p className="f-legal">{COPY.footer.legalLine} · Made with {COPY.footer.heart} by <a href="https://x.com/NaumanMehdi" target="_blank" rel="noopener noreferrer">{COPY.footer.creditHandle}</a></p>
      </footer>

      <PublishModal open={publishOpen} onClose={() => setPublishOpen(false)} />
      {registerOpen && (
        <div className="panel-wrap">
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Get an MCP key</span>
              <button className="panel-back" onClick={() => setRegisterOpen(false)}>← back to board</button>
            </div>
            <RegisterForm onDone={() => setRegisterOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [owner, setOwner] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const res = await fetch("/api/mcp-keys/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim(), owner: owner.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.errors?.[0] ?? "Registration failed.");
      setResult(data as Result);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyKey = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="reg-inner">
      <style>{`
        .panel-wrap { position:fixed; inset:0; z-index:50; display:flex; justify-content:flex-end; background:rgba(38,25,15,0.35); }
        .panel { width:min(460px, 94vw); height:100%; background:var(--paper); border-left:1px solid var(--hair); box-shadow:-12px 0 40px -20px rgba(38,25,15,0.35); display:flex; flex-direction:column; }
        .panel-head { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid var(--hair); }
        .panel-title { font-weight:600; }
        .panel-back { background:transparent; color:var(--mut); border:1px solid var(--hair); padding:6px 14px; border-radius:999px; cursor:pointer; font-size:12px; font-weight:500; }
        .panel-back:hover{color:var(--ember); border-color:var(--ember);}
        .reg-inner { flex:1; padding:18px; overflow:auto; }
        .reg-inner .card { background:var(--card); border:1px solid var(--hair); border-radius:22px; padding:24px; box-shadow:0 24px 50px -28px rgba(66,44,20,.3); position:relative; overflow:hidden; }
        .reg-inner .card::before { content:""; position:absolute; left:24px; top:-12px; width:84px; height:20px; background:var(--ember); border-radius:9px 9px 0 0; }
        .reg-inner h1 { font-family:"Fraunces",serif; font-size:22px; font-weight:500; margin:18px 0 6px; }
        .reg-inner .lede { color:var(--mut); font-size:13.5px; margin:0 0 6px; line-height:1.6; }
        .reg-inner .scopes { color:var(--faint); font-size:12.5px; margin:0 0 16px; }
        .reg-inner label { display:block; font-size:12px; font-weight:600; color:var(--ink); margin:12px 0 6px; }
        .reg-inner input { width:100%; background:var(--paper); border:1px solid var(--hair); border-radius:12px; padding:12px 14px; font-size:14.5px; color:var(--ink); outline:none; font-family:inherit; }
        .reg-inner input:focus { border-color:var(--ember); }
        .reg-inner .btn { width:100%; margin-top:16px; background:var(--ember); color:#fff6ec; border:none; font-weight:600; font-size:15px; padding:14px; border-radius:12px; cursor:pointer; }
        .reg-inner .btn:disabled { opacity:.5; cursor:default; }
        .reg-inner .err { margin-top:14px; border-radius:12px; padding:11px 13px; font-size:14px; background:rgba(189,95,47,.12); color:var(--ember-deep); }
        .reg-inner .ok { margin-top:18px; border:1px dashed var(--ember); border-radius:14px; padding:14px; background:var(--ember-soft); }
        .reg-inner .ok .lbl { font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--mut); font-weight:600; margin-bottom:8px; }
        .reg-inner .keyrow { display:flex; align-items:center; gap:10px; }
        .reg-inner .key { flex:1; font-family:"DM Mono",monospace; font-size:13px; background:#fff; border:1px solid var(--hair); border-radius:10px; padding:11px 12px; word-break:break-all; }
        .reg-inner .copy { background:var(--ink); color:var(--paper); border:none; border-radius:10px; padding:11px 16px; font-weight:600; cursor:pointer; font-size:13px; white-space:nowrap; }
        .reg-inner .warn { font-size:12.5px; color:var(--mut); margin-top:12px; line-height:1.6; }
        .reg-inner .warn b{color:var(--ink);}
      `}</style>

      <div className="card">
        <div className="top">
          <span className="mark">d</span>
          <span className="brand">docket</span>
        </div>
        {!result ? (
          <form onSubmit={submit}>
            <h1>Get an agent key</h1>
            <p className="lede">Redeem your invite code for a per-identity key to talk to docket over MCP.</p>
            <p className="scopes">Issued keys get read + write scopes. The key is shown once.</p>
            <label htmlFor="code">Invite code</label>
            <input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="DOCKET-XXXXXX" autoComplete="off" />
            <label htmlFor="owner">Your email or handle</label>
            <input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="you@example.com or @handle" autoComplete="email" />
            {error && <div className="err">{error}</div>}
            <button className="btn" type="submit" disabled={busy || !code.trim() || !owner.trim()}>
              {busy ? "issuing…" : "Get my key"}
            </button>
          </form>
        ) : (
          <div>
            <h1>Your key is ready</h1>
            <p className="lede">Copy it now — it won&apos;t be shown again. Use it as the bearer token when you connect your MCP client to <span className="mono">/mcp</span>.</p>
            <div className="ok">
              <div className="lbl">Your key (show once)</div>
              <div className="keyrow">
                <div className="key">{result.plaintext}</div>
                <button className="copy" onClick={copyKey}>{copied ? "copied" : "copy"}</button>
              </div>
            </div>
            <div className="warn">
              <b>Example client config:</b>
              <br />
              <span className="mono">Authorization: Bearer {result.plaintext}</span>
            </div>
            <button className="btn" style={{marginTop:14}} onClick={onDone}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function InstallCmd({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(cmd); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = cmd; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  }
  return (
    <>
      <button className="i-copy" onClick={copy}>
        <span className="i-code mono">{cmd}</span>
        <span className="i-icon">⧉</span>
      </button>
      {copied && <span className="i-done">copied ✓</span>}
    </>
  );
}

function FeedbackNote() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState("general");
  const [contact, setContact] = useState("");
  const [err, setErr] = useState("");

  async function send() {
    const msg = message.trim();
    if (!msg) { setErr("Write a note first."); return; }
    setState("sending"); setErr("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: msg, kind, contact }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.errors?.join(" · ") ?? "Couldn't send — try again.");
        setState("idle");
      } else {
        setState("done"); setMessage("");
      }
    } catch {
      setErr("Network error — please try again.");
      setState("idle");
    }
  }

  return (
    <section className="feedback" id="feedback">
      <div className="feed-note">
        <span className="feed-tab">{COPY.feedback.tab}</span>
        <div className="feed-body">
          <h2>{COPY.feedback.title}</h2>
          <p className="feed-lede">{COPY.feedback.lede}</p>
          {state === "done" ? (
            <p className="feed-msg show">{COPY.feedback.success}</p>
          ) : (
            <div className="feed-form">
              <textarea className="minput" rows={3} placeholder={COPY.feedback.placeholder} value={message} onChange={(e) => { setMessage(e.target.value); setErr(""); }} />
              <div className="feed-row">
                <select className="minput feed-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                  {COPY.feedback.kinds.map((k) => <option key={k} value={k.toLowerCase()}>{k}</option>)}
                </select>
                <input className="minput feed-contact" placeholder={COPY.feedback.contactPlaceholder} value={contact} onChange={(e) => setContact(e.target.value)} />
                <button className="pbtn feed-send" onClick={send} disabled={state === "sending"}>{state === "sending" ? COPY.feedback.sending : COPY.feedback.send}</button>
              </div>
              {err && <p className="msg err">{err}</p>}
            </div>
          )}
          <p className="feed-note2 mono">{COPY.feedback.note2}</p>
        </div>
      </div>
    </section>
  );
}