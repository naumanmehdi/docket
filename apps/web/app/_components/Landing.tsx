"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";
import Catalog from "./Catalog";
import PublishModal from "./PublishModal";
import type { ListingRow } from "@/lib/listing";

export default function Landing({ rows }: { rows: ListingRow[] }) {
  const [publishOpen, setPublishOpen] = useState(false);
  const mcpUrl = process.env.NEXT_PUBLIC_MCP_URL ?? `https://${SITE.domain}/mcp`;
  const openPublish = () => setPublishOpen(true);

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
            <a className="pill" href="#" onClick={(e) => { e.preventDefault(); openPublish(); }}>{COPY.nav.publish}</a>
          </nav>
        </header>
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
            <details className="install-json">
              <summary>JSON</summary>
              <InstallCmd cmd={COPY.hero.installJson(mcpUrl)} />
            </details>
          </div>
        </div>

        <div className="hero-right">
          <div className="term">
            <div className="term-head"><span className="t">{COPY.terminal.title}</span><span className="live">live</span></div>
            <div className="term-body">
              <div className="ln"><span className="prompt">➜</span><span className="out step">step 1 — connect your agent</span></div>
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