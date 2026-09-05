"use client";

import { useMemo, useState } from "react";

type Row = {
  id: string;
  kind: string;
  name: string;
  tagline: string;
  url: string | null;
  repo_url: string | null;
  category: string | null;
  author: string;
  x_handle: string | null;
  spotlighted: boolean;
  claim_state: string | null;
  claimed_by: string | null;
  build_url: string | null;
  created_at: string;
};

const TABS = [
  { key: "all", label: "All" },
  { key: "idea", label: "Ideas" },
  { key: "app", label: "Apps" },
  { key: "mcp", label: "MCPs" },
  { key: "skill", label: "Skills" },
];

const LOGO_COLORS = ["#177e6b", "#e4572e", "#b8791b", "#3a5bd9", "#8e44ad", "#c0392b"];
function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LOGO_COLORS[h % LOGO_COLORS.length]!;
}

function kindLabel(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export default function Board({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "all" && r.kind !== tab) return false;
      if (!needle) return true;
      return `${r.name} ${r.tagline} ${r.author}`.toLowerCase().includes(needle);
    });
  }, [rows, tab, q]);

  const ideaCount = rows.filter((r) => r.kind === "idea").length;
  const available = rows.filter((r) => r.kind === "idea" && (r.claim_state === null || r.claim_state === "abandoned")).length;

  return (
    <div className="board-wrap">
      <div className="board-toolbar">
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="search"
          placeholder="Search the board…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search"
        />
      </div>
      <div className="board-stats">
        {rows.length} live listing{rows.length === 1 ? "" : "s"} ·{" "}
        <b>{available}</b> unbuilt idea{available === 1 ? "" : "s"} open to build
      </div>

      {filtered.length === 0 ? (
        <div className="board-empty">
          {rows.length === 0
            ? "No listings yet — be the first. This board fills itself from the same database the MCP server writes to."
            : "Nothing matches that filter yet."}
        </div>
      ) : (
        <div className="board-cards">
          {filtered.map((l) => {
            const href = l.build_url ?? l.url ?? l.repo_url;
            const inner = (
              <>
                <div className="logo" style={{ background: colorFor(l.name) }}>
                  {l.name.charAt(0).toUpperCase()}
                </div>
                <div className="info">
                  <b>
                    {l.name}
                    <span className="kindchip">{kindLabel(l.kind)}</span>
                  </b>
                  <span>{l.tagline}</span>
                </div>
                <div className="meta">
                  {stateBadge(l)}
                  <span className="chip author">by {l.author}</span>
                  {l.category ? <span className="chip cat">{l.category}</span> : null}
                </div>
              </>
            );
            return href ? (
              <a className="bcard" href={href} target="_blank" rel="noopener noreferrer" key={l.id}>
                {inner}
              </a>
            ) : (
              <div className="bcard" key={l.id}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function stateBadge(l: Row): React.ReactNode {
  if (l.kind !== "idea") return null;
  const s = l.claim_state;
  if (s === "built")
    return (
      <span className="chip state built" title={l.build_url ?? ""}>
        ✓ built{l.claimed_by ? ` by ${l.claimed_by}` : ""}
      </span>
    );
  if (s === "in_progress")
    return <span className="chip state prog">building… {l.claimed_by ? `(${l.claimed_by})` : ""}</span>;
  if (s === "claimed")
    return <span className="chip state claimed">claimed by {l.claimed_by}</span>;
  return <span className="chip state open">open to build</span>;
}
