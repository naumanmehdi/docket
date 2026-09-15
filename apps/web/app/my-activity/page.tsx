"use client";

import { useCallback, useEffect, useState } from "react";
import { SITE } from "@/lib/site";

interface Listing {
  id: string;
  name: string;
  tagline: string;
  status: string;
  kind: string;
  created_at: string;
}

interface Feedback {
  id: string;
  message: string;
  kind: string;
  status: string;
  created_at: string;
}

export default function MyActivityPage() {
  const [keyInput, setKeyInput] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("docket_user_key");
    if (saved) setSavedKey(saved);
  }, []);

  const api = useCallback(
    async (path: string): Promise<Response> => {
      return fetch(path, {
        headers: { authorization: `Bearer ${savedKey}` },
      });
    },
    [savedKey],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [lr, fr] = await Promise.all([
        api("/api/my-listings"),
        api("/api/my-feedback"),
      ]);

      if (lr.status === 401 || fr.status === 401) {
        setError("Invalid key. Please check your key and try again.");
        setSavedKey("");
        localStorage.removeItem("docket_user_key");
        return;
      }
      if (lr.status === 429 || fr.status === 429) {
        setError("Rate limited. Please wait a moment and try again.");
        return;
      }
      if (!lr.ok || !fr.ok) {
        setError("Server error. Please try again later.");
        return;
      }

      const ld = await lr.json();
      const fd = await fr.json();
      setListings(ld.listings ?? ld ?? []);
      setFeedback(fd.feedback ?? fd ?? []);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (savedKey) loadData();
  }, [savedKey, loadData]);

  const saveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    localStorage.setItem("docket_user_key", trimmed);
    setSavedKey(trimmed);
    setKeyInput("");
  };

  const logout = () => {
    localStorage.removeItem("docket_user_key");
    setSavedKey("");
    setListings([]);
    setFeedback([]);
    setError("");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="my-activity">
      <style>{`
        .my-activity { min-height:100vh; background:var(--paper); color:var(--ink); }
        .my-activity .topbar { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid var(--hair); background:rgba(251,247,239,0.85); backdrop-filter:blur(8px); position:sticky; top:0; z-index:10; }
        .my-activity .brand { display:flex; align-items:center; gap:10px; font-weight:600; }
        .my-activity .mark { width:26px;height:26px;border-radius:6px;background:var(--ink);color:var(--paper); display:grid;place-items:center;font-size:13px;font-weight:700; position:relative; }
        .my-activity .mark::after{content:"";position:absolute;top:-5px;left:5px;width:12px;height:7px;background:var(--ember);border-radius:3px 3px 0 0;}
        .my-activity .pill { padding:6px 14px; border-radius:999px; background:var(--ink); color:var(--paper); font-size:12px; font-weight:500; border:none; cursor:pointer; text-decoration:none; display:inline-block; }
        .my-activity .pill.ghost { background:transparent; color:var(--ink); border:1px solid var(--hair); }
        .my-activity .wrap { max-width:860px; margin:0 auto; padding:40px 24px 80px; }
        .my-activity h1 { font-size:28px; font-weight:600; margin:0 0 8px; letter-spacing:-0.02em; }
        .my-activity .lede { color:var(--mut); font-size:14px; margin:0 0 28px; line-height:1.6; }
        .my-activity .card { background:var(--card); border:1px solid var(--hair); border-radius:22px; padding:34px 32px; box-shadow:0 24px 50px -28px rgba(66,44,20,.3); position:relative; overflow:hidden; }
        .my-activity .card::before { content:""; position:absolute; left:32px; top:-12px; width:84px; height:20px; background:var(--ember); border-radius:9px 9px 0 0; }
        .my-activity label { display:block; font-size:12px; font-weight:600; color:var(--ink); margin:12px 0 6px; }
        .my-activity input { width:100%; background:var(--paper); border:1px solid var(--hair); border-radius:12px; padding:12px 14px; font-size:14.5px; color:var(--ink); outline:none; font-family:inherit; }
        .my-activity input:focus { border-color:var(--ember); }
        .my-activity .btn { width:100%; margin-top:18px; background:var(--ember); color:#fff6ec; border:none; font-weight:600; font-size:15px; padding:14px; border-radius:12px; cursor:pointer; }
        .my-activity .btn:disabled { opacity:.5; cursor:default; }
        .my-activity .err { margin-top:14px; border-radius:12px; padding:11px 13px; font-size:14px; background:rgba(189,95,47,.12); color:var(--ember-deep); }
        .my-activity .section { margin-top:48px; }
        .my-activity .section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .my-activity .section-head h2 { font-size:20px; font-weight:500; margin:0; }
        .my-activity .section-head .count { font-size:12px; color:var(--mut); font-family:"DM Mono",monospace; }
        .my-activity .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
        .my-activity .listing-card { background:var(--card); border:1px solid var(--hair); border-radius:14px; padding:18px; transition:border-color .15s var(--ease),transform .15s var(--ease); }
        .my-activity .listing-card:hover { border-color:var(--ember); transform:translateY(-2px); }
        .my-activity .listing-card .name { font-weight:600; font-size:15px; margin:0 0 4px; }
        .my-activity .listing-card .tagline { color:var(--mut); font-size:13px; margin:0 0 12px; line-height:1.5; }
        .my-activity .listing-card .meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .my-activity .listing-card .date { font-size:11px; color:var(--faint); font-family:"DM Mono",monospace; }
        .my-activity .chip { font-size:10px; font-weight:600; padding:4px 10px; border-radius:999px; letter-spacing:0.05em; white-space:nowrap; text-transform:uppercase; border:1px solid var(--hair); color:var(--mut); background:rgba(255,255,255,0.6); }
        .my-activity .chip.idea, .my-activity .chip.app, .my-activity .chip.mcp, .my-activity .chip.skill { color:var(--ember-deep); border-color:var(--ember-soft); background:var(--ember-soft); }
        .my-activity .chip.st-open { color:var(--ember-deep); border-color:var(--ember-soft); background:var(--ember-soft); }
        .my-activity .feedback-item { background:var(--card); border:1px solid var(--hair); border-radius:14px; padding:16px 18px; margin-bottom:10px; }
        .my-activity .feedback-item .snippet { font-size:13.5px; color:var(--ink); margin:0 0 10px; line-height:1.55; }
        .my-activity .feedback-item .meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .my-activity .feedback-item .date { font-size:11px; color:var(--faint); font-family:"DM Mono",monospace; }
        .my-activity .empty { text-align:center; color:var(--faint); padding:32px 0; font-size:14px; }
        .my-activity .logout { margin-top:32px; }
        .my-activity .logout button { background:transparent; border:1px solid var(--hair); color:var(--mut); padding:8px 16px; border-radius:10px; cursor:pointer; font-size:13px; }
        .my-activity .logout button:hover { border-color:var(--ember); color:var(--ember); }
        @media(max-width:680px){
          .my-activity .wrap { padding:24px 16px 60px; }
          .my-activity .card { padding:24px 20px; }
          .my-activity .grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="topbar">
        <div className="brand">
          <div className="mark">d</div>
          <div>{SITE.name}</div>
        </div>
        <a className="pill ghost" href="/">← board</a>
      </div>

      <div className="wrap">
        {!savedKey ? (
          <div className="card">
            <h1>My activity</h1>
            <p className="lede">Paste your MCP key to view your listings and feedback.</p>
            <label htmlFor="ma-key">Your MCP key</label>
            <input
              id="ma-key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="dk_..."
              autoComplete="off"
            />
            {error && <div className="err">{error}</div>}
            <button className="btn" onClick={saveKey} disabled={!keyInput.trim()}>
              Continue
            </button>
          </div>
        ) : (
          <>
            <h1>My activity</h1>
            <p className="lede">Your listings and feedback on docket.</p>

            {error && <div className="err" style={{ marginBottom: 24 }}>{error}</div>}

            {loading ? (
              <p style={{ color: "var(--mut)" }}>Loading…</p>
            ) : (
              <>
                <div className="section">
                  <div className="section-head">
                    <h2>My Listings</h2>
                    <span className="count">{listings.length} item{listings.length !== 1 ? "s" : ""}</span>
                  </div>
                  {listings.length === 0 ? (
                    <div className="empty">No listings yet.</div>
                  ) : (
                    <div className="grid">
                      {listings.map((l) => (
                        <div className="listing-card" key={l.id}>
                          <p className="name">{l.name}</p>
                          <p className="tagline">{l.tagline}</p>
                          <div className="meta">
                            <span className={`chip ${l.kind}`}>{l.kind}</span>
                            <span className="chip">{l.status}</span>
                            <span className="date">{formatDate(l.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="section">
                  <div className="section-head">
                    <h2>My Feedback</h2>
                    <span className="count">{feedback.length} item{feedback.length !== 1 ? "s" : ""}</span>
                  </div>
                  {feedback.length === 0 ? (
                    <div className="empty">No feedback yet.</div>
                  ) : (
                    feedback.map((f) => (
                      <div className="feedback-item" key={f.id}>
                        <p className="snippet">
                          {f.message.length > 200 ? `${f.message.slice(0, 200)}…` : f.message}
                        </p>
                        <div className="meta">
                          <span className="chip">{f.kind}</span>
                          <span className="chip">{f.status}</span>
                          <span className="date">{formatDate(f.created_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <div className="logout">
              <button onClick={logout}>Clear key &amp; log out</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
