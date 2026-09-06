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
      <header>
        <div className="brand">
          <span className="mark">A</span>
          {SITE.name}
        </div>
        <nav>
          <a href="#explore">{COPY.nav.explore}</a>
          <a href="#board">{COPY.nav.board}</a>
          <a className="pill" href="#" onClick={(e) => { e.preventDefault(); openPublish(); }}>{COPY.nav.publish}</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <span className="kicker"><i />{COPY.hero.kicker}</span>
        <h1>
          {COPY.hero.titleLead} <em>{COPY.hero.titleEm}</em> {COPY.hero.titleRest}
        </h1>
        <p className="lede">{COPY.hero.lede}</p>

        {/* install command */}
        <div className="installrow">
          <span className="i-label">{COPY.hero.connectLabel}:</span>
          <InstallCmd cmd={COPY.hero.installCmd(mcpUrl)} />
        </div>

        <div className="cta">
          <a className="btn fire" href="#" onClick={(e) => { e.preventDefault(); openPublish(); }}>{COPY.hero.ctaPrimary}</a>
          <a className="btn outline" href="#board">{COPY.hero.ctaSecondary}</a>
        </div>

        {/* terminal */}
        <div className="term">
          <div className="term-head">
            <span className="d" style={{ background: "#e8622d" }} />
            <span className="d" style={{ background: "#d9a441" }} />
            <span className="d" style={{ background: "#4fae8e" }} />
            <span className="t">{COPY.terminal.title}</span>
          </div>
          <div className="term-body">
            {COPY.terminal.lines.map((l, i) => (
              <div className="ln" key={i}>
                <span className="prompt">➜</span>
                <span className="cmd">{l.cmd}</span>
                <span className="out"><span className="ok">✓</span> {l.out}</span>
              </div>
            ))}
            <div className="ln"><span className="prompt">➜</span><span className="caret" /></div>
          </div>
        </div>
      </section>

      {/* catalog: search + categories + board */}
      <Catalog rows={rows} />

      <footer>{COPY.footer}</footer>

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
