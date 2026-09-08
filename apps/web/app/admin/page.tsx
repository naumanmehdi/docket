"use client";
// docket /admin — owner back-office for the invite-code + per-identity key system.
// Self-contained client page talking to the /api/admin/* endpoints. The owner's
// admin key is kept in sessionStorage (never a cookie), sent as Bearer per call.

import { useCallback, useEffect, useState } from "react";

interface InviteCode {
  id: string;
  code: string;
  max_uses: number;
  used_count: number;
  remaining: number;
  scopes: string[];
  status: "active" | "maxed" | "expired" | "revoked";
  expires_at: string | null;
  created_at: string;
}

interface McpKey {
  id: string;
  owner: string;
  scopes: string[];
  invite_code: string | null;
  status: "active" | "revoked";
  last_used_at: string | null;
  created_at: string;
}

async function api(path: string, key: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${key}`);
  if (init?.body) headers.set("content-type", "application/json");
  return fetch(path, { ...init, headers });
}

function short(s: string | null): string {
  if (!s) return "—";
  return s.length > 12 ? `${s.slice(0, 12)}…` : s;
}

function tagFor(status: string): string {
  const map: Record<string, string> = {
    active: "green",
    maxed: "gray",
    expired: "gray",
    revoked: "red",
  };
  return map[status] ?? "gray";
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [keys, setKeys] = useState<McpKey[]>([]);
  // create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [mCount, setMCount] = useState(10);
  const [mUses, setMUses] = useState(1);
  const [mExpiry, setMExpiry] = useState("");
  const [generated, setGenerated] = useState<string[] | null>(null);

  const load = useCallback(async (k: string) => {
    const [cr, kr] = await Promise.all([
      api("/api/admin/invite-codes", k),
      api("/api/admin/mcp-keys", k),
    ]);
    if (cr.status === 401 || kr.status === 401) throw new Error("That key was rejected.");
    if (!cr.ok || !kr.ok) throw new Error("Failed to load data.");
    setCodes((await cr.json()) as InviteCode[]);
    setKeys((await kr.json()) as McpKey[]);
  }, []);

  const tryKey = async () => {
    setErr("");
    try {
      await load(key.trim());
      sessionStorage.setItem("docket_admin_key", key.trim());
      setAuthed(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not connect.");
      setAuthed(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("docket_admin_key");
    if (saved) {
      setKey(saved);
      load(saved)
        .then(() => setAuthed(true))
        .catch(() => setAuthed(false));
    }
  }, [load]);

  const refresh = async () => {
    setErr("");
    try {
      await load(key.trim());
    } catch {
      setErr("Session expired — re-enter your key.");
      setAuthed(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("docket_admin_key");
    setAuthed(false);
    setKey("");
  };

  const createCodes = async () => {
    setErr("");
    try {
      const res = await api("/api/admin/invite-codes", key.trim(), {
        method: "POST",
        body: JSON.stringify({
          count: mCount,
          max_uses: mUses,
          expires_at: mExpiry || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.errors?.[0] ?? "Create failed.");
      setGenerated(data.codes.map((c: { code: string }) => c.code));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed.");
    }
  };

  const revokeCode = async (id: string) => {
    const res = await api("/api/admin/invite-codes/revoke", key.trim(), {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    if (res.ok) await refresh();
  };

  const revokeKey = async (id: string) => {
    const res = await api("/api/admin/mcp-keys/revoke", key.trim(), {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    if (res.ok) await refresh();
  };

  if (!authed) {
    return (
      <div className="adm gate">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            tryKey();
          }}
        >
          <div className="gate-card">
            <div className="mark">d</div>
            <h1 className="serif">admin</h1>
            <p>Enter your docket admin key to manage invite codes and issued keys.</p>
            <input
              className="minput"
              type="password"
              autoComplete="off"
              placeholder="admin key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            {err && <div className="msg err">{err}</div>}
            <button className="pbtn" type="submit" disabled={!key.trim()}>
              unlock
            </button>
          </div>
        </form>
      </div>
    );
  }

  const totalCodes = codes.length;
  const activeKeys = keys.filter((k) => k.status === "active").length;
  const revokedKeys = keys.filter((k) => k.status === "revoked").length;

  return (
    <div className="adm">
      <style>{`
        .adm { --paper:#fbf7ef; --ink:#26190f; --ember:#d9743f; --mut:#6f5c42;
          --hair:rgba(38,25,15,0.1); --card:#fff; color:var(--ink);
          background:var(--paper); min-height:100vh; font-size:14px; }
        .adm .head { display:flex; align-items:center; justify-content:space-between;
          padding:16px 26px; border-bottom:1px solid var(--hair); position:sticky; top:0;
          background:rgba(251,247,239,0.9); backdrop-filter:blur(8px); z-index:10; }
        .adm .brand { display:flex; align-items:center; gap:10px; font-weight:600;
          font-size:16px; }
        .adm .mark { width:26px;height:26px;border-radius:7px;background:var(--ink);
          color:var(--paper);display:grid;place-items:center;font-family:"Fraunces",serif;
          font-size:14px; position:relative; }
        .adm .mark::after{content:"";position:absolute;top:-5px;left:5px;width:12px;height:7px;
          background:var(--ember);border-radius:3px 3px 0 0;}
        .adm .muted { color:var(--mut); font-weight:400; }
        .adm main { max-width:1100px; margin:0 auto; padding:26px 22px 70px; }
        .adm .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
        .adm .stat { background:var(--card); border:1px solid var(--hair); border-radius:14px;
          padding:15px 18px; }
        .adm .stat .lab { font-size:10.5px; text-transform:uppercase; letter-spacing:.1em;
          color:var(--mut); margin:0 0 5px; }
        .adm .stat .val { font-family:"DM Mono",monospace; font-size:22px; font-weight:600; margin:0; }
        .adm .panel { background:var(--card); border:1px solid var(--hair); border-radius:14px;
          margin-bottom:18px; overflow:hidden; }
        .adm .phead { display:flex; align-items:center; justify-content:space-between;
          padding:13px 18px; border-bottom:1px solid var(--hair); }
        .adm .phead h2 { font-family:"Fraunces",serif; font-size:15px; font-weight:500; margin:0; }
        .adm .pill { border:none; border-radius:999px; padding:7px 14px; font-size:12px;
          font-weight:600; cursor:pointer; background:var(--ink); color:var(--paper); }
        .adm .pill.ember { background:var(--ember); color:#fff6ec; }
        .adm .pill.ghost { background:transparent; color:var(--ink); border:1px solid var(--hair); }
        .adm .btn-sm { padding:4px 11px; border-radius:8px; font-size:12px; cursor:pointer;
          border:1px solid var(--hair); background:#fff; color:var(--ink); }
        .adm .btn-sm:hover{ border-color:var(--ember); color:var(--ember);}
        .adm .btn-sm.danger { color:#8a2222; } .adm .btn-sm.danger:hover{border-color:#8a2222;}
        .adm table { width:100%; border-collapse:collapse; font-size:13px; }
        .adm th, .adm td { text-align:left; padding:10px 18px; border-bottom:1px solid var(--hair); }
        .adm th { font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--mut);
          font-weight:600; }
        .adm tr:last-child td { border-bottom:none; }
        .adm code { font-family:"DM Mono",monospace; font-size:12px; }
        .adm .tag { display:inline-block; padding:2px 9px; border-radius:999px; font-size:10.5px;
          font-weight:600; background:rgba(217,116,63,.1); color:var(--ember);
          border:1px solid rgba(217,116,63,.22); margin-right:4px; }
        .adm .tag.green{background:rgba(34,120,60,.08);color:#1a6b35;border-color:rgba(34,120,60,.22);}
        .adm .tag.red{background:rgba(180,40,40,.08);color:#8a2222;border-color:rgba(180,40,40,.22);}
        .adm .tag.gray{background:rgba(38,25,15,.05);color:var(--mut);border-color:var(--hair);}
        .adm .empty { padding:18px; color:var(--mut); }
        .adm .msg.err { margin:12px 0 0; border-radius:10px; padding:10px 12px; font-size:13px;
          background:rgba(189,95,47,.12); color:var(--ember-deep); }
        .adm .row { display:flex; align-items:center; gap:10px; }
        .adm .expire { color:var(--mut); }
        /* gate screen */
        .adm.gate { display:grid; place-items:center; min-height:100vh; padding:20px; }
        .adm .gate-card { width:min(380px,92vw); background:var(--card); border:1px solid var(--hair);
          border-radius:20px; padding:28px 26px; box-shadow:0 24px 50px -28px rgba(66,44,20,.28); }
        .adm .gate-card h1 { font-size:24px; font-weight:500; margin:16px 0 6px; }
        .adm .gate-card p { color:var(--mut); font-size:13.5px; margin:0 0 16px; }
        .adm .gate-card .mark { width:30px;height:30px; }
        .adm .pbtn { width:100%; margin-top:14px; background:var(--ember); color:#fff6ec; border:none;
          font-weight:600; font-size:15px; padding:13px; border-radius:12px; cursor:pointer; }
        .adm .pbtn:disabled{opacity:.5;cursor:default;}
        /* modal */
        .adm .overlay { position:fixed; inset:0; background:rgba(38,25,15,.35); display:grid;
          place-items:center; z-index:50; }
        .adm .modal { width:min(440px,92vw); background:var(--paper); border-radius:18px;
          padding:22px 24px; border:1px solid var(--hair); }
        .adm .modal h3 { font-family:"Fraunces",serif; font-size:16px; font-weight:500; margin:0 0 14px; }
        .adm .field { display:flex; flex-direction:column; gap:5px; margin-bottom:12px; }
        .adm .field label { font-size:11px; color:var(--mut); text-transform:uppercase;
          letter-spacing:.08em; }
        .adm .field input,.adm .field select { padding:8px 10px; border:1px solid var(--hair);
          border-radius:8px; background:#fff; font-family:"DM Mono",monospace; font-size:13px;
          color:var(--ink); }
        .adm .modal .actions { display:flex; justify-content:flex-end; gap:8px; margin-top:14px; }
        .adm .genbox { margin-top:14px; }
        .adm .genbox textarea { width:100%; height:130px; margin-top:6px; padding:10px;
          border:1px solid var(--hair); border-radius:8px; background:#fff; font-family:"DM Mono",
          monospace; font-size:12px; resize:vertical; }
        @media(max-width:760px){ .adm .grid{grid-template-columns:1fr 1fr;} }
      `}</style>

      <header className="head">
        <div className="brand">
          <span className="mark">d</span>
          <span>docket <span className="muted">/ admin</span></span>
        </div>
        <div className="row">
          <button className="pill ember" onClick={() => { setGenerated(null); setShowCreate(true); }}>
            + create codes
          </button>
          <button className="pill ghost" onClick={logout}>
            lock
          </button>
        </div>
      </header>

      <main>
        {err && <div className="msg err">{err}</div>}
        <div className="grid">
          <div className="stat"><p className="lab">Total codes</p><p className="val">{totalCodes}</p></div>
          <div className="stat"><p className="lab">Active keys</p><p className="val">{activeKeys}</p></div>
          <div className="stat"><p className="lab">Revoked</p><p className="val">{revokedKeys}</p></div>
          <div className="stat"><p className="lab">Codes left</p>
            <p className="val">{codes.reduce((n, c) => n + (c.status === "active" ? c.remaining : 0), 0)}</p>
          </div>
        </div>

        <div className="panel">
          <div className="phead"><h2>invite codes</h2><button className="pill ghost" onClick={refresh}>refresh</button></div>
          {codes.length === 0 ? (
            <div className="empty">No invite codes yet — create one above.</div>
          ) : (
            <table>
              <thead><tr><th>code</th><th>uses</th><th>scopes</th><th>status</th><th>expires</th><th></th></tr></thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id}>
                    <td><code>{c.code}</code></td>
                    <td>{c.used_count} / {c.max_uses}</td>
                    <td>{c.scopes.map((s) => <span className="tag" key={s}>{s}</span>)}</td>
                    <td><span className={`tag ${tagFor(c.status)}`}>{c.status}</span></td>
                    <td className="expire">{c.expires_at ? c.expires_at.slice(0, 10) : "—"}</td>
                    <td>
                      <button className="btn-sm danger" disabled={c.status === "revoked"} onClick={() => revokeCode(c.id)}>
                        {c.status === "revoked" ? "revoked" : "revoke"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="phead"><h2>issued keys</h2></div>
          {keys.length === 0 ? (
            <div className="empty">No keys issued yet.</div>
          ) : (
            <table>
              <thead><tr><th>owner</th><th>scopes</th><th>invite code</th><th>last used</th><th>status</th><th></th></tr></thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td>{k.owner}</td>
                    <td>{k.scopes.map((s) => <span className="tag" key={s}>{s}</span>)}</td>
                    <td>{k.invite_code ? <code>{short(k.invite_code)}</code> : "—"}</td>
                    <td className="expire">{k.last_used_at ? k.last_used_at.replace("T", " ").slice(0, 16) : "never"}</td>
                    <td><span className={`tag ${k.status === "revoked" ? "red" : "green"}`}>{k.status}</span></td>
                    <td>
                      <button className="btn-sm danger" disabled={k.status === "revoked"} onClick={() => revokeKey(k.id)}>
                        {k.status === "revoked" ? "revoked" : "revoke"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>generate invite codes</h3>
            <div className="field">
              <label>count</label>
              <select value={mCount} onChange={(e) => setMCount(Number(e.target.value))}>
                {[1, 5, 10, 15, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="field">
              <label>max uses per code</label>
              <input type="number" min={1} value={mUses} onChange={(e) => setMUses(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>expires at (optional)</label>
              <input type="date" value={mExpiry} onChange={(e) => setMExpiry(e.target.value)} />
            </div>
            <div className="actions">
              <button className="pill ghost" onClick={() => setShowCreate(false)}>cancel</button>
              <button className="pill ember" onClick={createCodes}>generate</button>
            </div>
            {generated && (
              <div className="genbox">
                <div className="field"><label>generated codes</label>
                  <textarea readOnly value={generated.join("\n")} />
                </div>
                <div className="actions">
                  <button className="pill ember" onClick={() => {
                    navigator.clipboard?.writeText(generated.join("\n"));
                  }}>copy all</button>
                  <button className="pill ghost" onClick={() => { setShowCreate(false); setGenerated(null); refresh(); }}>done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
