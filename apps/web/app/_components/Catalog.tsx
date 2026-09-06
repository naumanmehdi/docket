"use client";

import { useMemo, useState } from "react";
import { COPY } from "@/lib/copy";
import { KIND_CATS } from "@/lib/taxonomy";
import { cardHeadline, colorFor, listingHref, type ListingRow } from "@/lib/listing";

const KIND_ORDER: Array<"all" | "idea" | "app" | "mcp" | "skill"> = ["all", "idea", "app", "mcp", "skill"];
const PAGE_SIZE = 8;

function kindChipKind(kind: string): string {
  return kind; // matches CSS class hooks .chip.idea/.app/.mcp/.skill
}

export default function Catalog({ rows }: { rows: ListingRow[] }) {
  const [activeCat, setActiveCat] = useState<"all" | "idea" | "app" | "mcp" | "skill">("all");
  const [activeSub, setActiveSub] = useState("");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [subOpen, setSubOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const kind of ["idea", "app", "mcp", "skill"]) c[kind] = rows.filter((r) => r.kind === kind).length;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (activeCat !== "all" && r.kind !== activeCat) return false;
      if (activeSub && r.category !== activeSub) return false;
      if (q) {
        const hay = `${r.name} ${r.tagline} ${r.description ?? ""} ${r.category ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, activeCat, activeSub, query]);

  const page = filtered.slice(0, shown);
  const remaining = filtered.length - shown;
  const subCats = activeCat !== "all" && activeCat !== "idea" ? KIND_CATS[activeCat] : [];

  function pickCat(cat: "all" | "idea" | "app" | "mcp" | "skill") {
    setActiveCat(cat);
    setActiveSub("");
    setQuery("");
    setShown(PAGE_SIZE);
    setSubOpen(false);
  }

  return (
    <>
      {/* search */}
      <div className="searchwrap">
        <div className="searchbox">
          <input
            placeholder={COPY.search.placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShown(PAGE_SIZE); }}
          />
          <button className="go">{COPY.search.go}</button>
        </div>
      </div>

      {/* category chooser */}
      <section className="catsec" id="explore">
        <div className="catlabel">
          {COPY.cats.label} <span>{COPY.cats.labelHint}</span>
        </div>
        <div className="catgrid">
          {KIND_ORDER.map((k) => {
            const label = COPY.catNames[k];
            const isAll = k === "all";
            const cls = `cat ${k}${activeCat === k ? " active" : ""}`;
            const icoColor = isAll ? "var(--gold)" : undefined;
            const icon = isAll ? "✦" : k.charAt(0).toUpperCase();
            return (
              <button key={k} className={cls} onClick={() => pickCat(k)} aria-pressed={activeCat === k}>
                <div className="ico" style={icoColor ? { color: icoColor } : undefined}>{icon}</div>
                <div className="ct">{label}</div>
                <div className="cd">{COPY.catDescs[k]}</div>
                <div className="cnt"><b>{counts[k] ?? 0}</b> {counts[k] === 1 ? "item" : "items"}</div>
              </button>
            );
          })}
        </div>

        {/* sub-category dropdown (built kinds only) */}
        {subCats.length > 0 && (
          <div className="subsec">
            <span className="slabel">{COPY.board.subCatLabel}</span>
            <div className="subdd">
              <button
                className="subtrig"
                onClick={() => setSubOpen((o) => !o)}
                aria-expanded={subOpen}
              >
                <span>{activeSub || COPY.board.allCats}</span>
                <span className="subcaret">▾</span>
              </button>
              <div className={`cmenu${subOpen ? " open" : ""}`}>
                <div
                  className={`mi ${activeSub === "" ? "sel" : ""}`}
                  onClick={() => { setActiveSub(""); setShown(PAGE_SIZE); setSubOpen(false); }}
                >
                  {COPY.board.allCats}
                </div>
                {subCats.map((c) => (
                  <div
                    key={c}
                    className={`mi ${activeSub === c ? "sel" : ""}`}
                    onClick={() => { setActiveSub(c); setShown(PAGE_SIZE); setSubOpen(false); }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* board */}
      <section className="boardsec" id="board">
        <div className="bhead">
          <div>
            <div className="eyebrow">{COPY.board.eyebrow}</div>
            <div className="btitle">{COPY.board.title}</div>
            <div className="bsub">{COPY.board.sub}</div>
          </div>
          <div className="n">{COPY.board.itemCount(filtered.length)}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">{COPY.board.empty}</div>
        ) : (
          <div className="board" id="boardList">
            {page.map((r) => <Card key={r.id} row={r} />)}
          </div>
        )}

        {remaining > 0 && (
          <div className="loadmore-wrap">
            <button className="loadmore" onClick={() => setShown((s) => s + PAGE_SIZE)}>
              {COPY.board.loadMore(remaining)}
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function Card({ row }: { row: ListingRow }) {
  const href = listingHref(row);
  const inner = (
    <>
      <div className="logo" style={{ background: "color-mix(in srgb, " + colorFor(row.name) + " 18%, transparent)", color: colorFor(row.name) }}>
        {row.name.charAt(0).toUpperCase()}
      </div>
      <div className="mid">
        <div className="t1">
          <span className="nm">{row.name}</span>
          <span className={`chip ${kindChipKind(row.kind)}`}>{row.kind}</span>
        </div>
        <div className="one">{cardHeadline(row)}</div>
        {row.description && <div className="full">{row.description}</div>}
      </div>
      <div className="right">
        {row.kind === "idea" ? (
          <IdeaChips row={row} />
        ) : (
          <>
            <span className="chip sub">{row.category ?? row.kind}</span>
            <span className="go-link mono">↗ open</span>
          </>
        )}
      </div>
    </>
  );
  return href ? (
    <a className="brow" href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <div className="brow">{inner}</div>
  );
}

function IdeaChips({ row }: { row: ListingRow }) {
  if (row.claim_state === "built")
    return (
      <>
        <span className="chip sub">idea</span>
        <span className="chip st-built">✓ built{row.claimed_by ? ` by ${row.claimed_by}` : ""}</span>
      </>
    );
  if (row.claim_state === "claimed" || row.claim_state === "in_progress")
    return (
      <>
        <span className="chip sub">idea</span>
        <span className="chip st-clm">claimed{row.claimed_by ? ` by ${row.claimed_by}` : ""}</span>
      </>
    );
  return (
    <>
      <span className="chip sub">idea</span>
      <span className="chip st-open">open to build</span>
    </>
  );
}
