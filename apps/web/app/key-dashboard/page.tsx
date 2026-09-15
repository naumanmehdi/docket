"use client";

import { useCallback, useEffect, useState } from "react";
import { SITE } from "@/lib/site";

interface KeyObject {
  id: string;
  created_at: string;
  last_used_at: string | null;
  scopes: string[];
  status: "active" | "revoked";
}

export default function KeyDashboardPage() {
  const [keyInput, setKeyInput] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [keys, setKeys] = useState<KeyObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("docket_user_key");
    if (saved) setSavedKey(saved);
  }, []);

  const api = useCallback(
    async (path: string, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);
      headers.set("authorization", `Bearer ${savedKey}`);
      if (init?.body) headers.set("content-type", "application/json");
      return fetch(path, { ...init, headers });
    },
    [savedKey],
  );

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/keys/manage");
      const rl = res.headers.get("X-RateLimit-Remaining");
      if (rl) setRateLimitRemaining(parseInt(rl, 10));

      if (res.status === 401) {
        setError("Invalid key. Please check your key and try again.");
        setSavedKey("");
        localStorage.removeItem("docket_user_key");
        return;
      }
      if (res.status === 429) {
        setError("Rate limited. Please wait a moment and try again.");
        return;
      }
      if (!res.ok) {
        setError(`Server error (${res.status}). Please try again later.`);
        return;
      }
      const data = await res.json();
      setKeys(data.keys ?? data ?? []);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (savedKey) loadKeys();
  }, [savedKey, loadKeys]);

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
    setKeys([]);
    setError("");
    setSuccess("");
    setNewKey(null);
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm("Revoke this key? It will stop working immediately.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await api("/api/keys/revoke", {
        method: "POST",
        body: JSON.stringify({ key_id: keyId }),
      });
      if (res.status === 401) {
        setError("Invalid key.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? "Failed to revoke key.");
        return;
      }
      setSuccess("Key revoked.");
      await loadKeys();
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const regenerateKey = async (keyId: string) => {
    if (!confirm("Regenerate this key? The old key will stop working immediately.")) return;
    setError("");
    setSuccess("");
    setNewKey(null);
    try {
      const res = await api("/api/keys/regenerate", {
        method: "POST",
        body: JSON.stringify({ key_id: keyId }),
      });
      if (res.status === 401) {
        setError("Invalid key.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? "Failed to regenerate key.");
        return;
      }
      const data = await res.json();
      setNewKey(data.plaintext ?? data.key ?? null);
      await loadKeys();
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const copyNewKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="key-dash">
      <style>{`
        .key-dash { min-height:100vh; background:var(--paper); color:var(--ink); }
        .key-dash .topbar { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid var(--hair); background:rgba(251,247,239,0.85); backdrop-filter:blur(8px); position:sticky; top:0; z-index:10; }
        .key-dash .brand { display:flex; align-items:center; gap:10px; font-weight:600; }
        .key-dash .mark { width:26px;height:26px;border-radius:6px;background:var(--ink);color:var(--paper); display:grid;place-items:center;font-size:13px;font-weight:700; position:relative; }
        .key-dash .mark::after{content:"";position:absolute;top:-5px;left:5px;width:12px;height:7px;background:var(--ember);border-radius:3px 3px 0 0;}
        .key-dash .pill { padding:6px 14px; border-radius:999px; background:var(--ink); color:var(--paper); font-size:12px; font-weight:500; border:none; cursor:pointer; text-decoration:none; display:inline-block; }
        .key-dash .pill.ghost { background:transparent; color:var(--ink); border:1px solid var(--hair); }
        .key-dash .wrap { max-width:860px; margin:0 auto; padding:40px 24px 80px; }
        .key-dash h1 { font-size:28px; font-weight:600; margin:0 0 8px; letter-spacing:-0.02em; }
        .key-dash .lede { color:var(--mut); font-size:14px; margin:0 0 28px; line-height:1.6; }
        .key-dash .card { background:var(--card); border:1px solid var(--hair); border-radius:22px; padding:34px 32px; box-shadow:0 24px 50px -28px rgba(66,44,20,.3); position:relative; overflow:hidden; }
        .key-dash .card::before { content:""; position:absolute; left:32px; top:-12px; width:84px; height:20px; background:var(--ember); border-radius:9px 9px 0 0; }
        .key-dash label { display:block; font-size:12px; font-weight:600; color:var(--ink); margin:12px 0 6px; }
        .key-dash input { width:100%; background:var(--paper); border:1px solid var(--hair); border-radius:12px; padding:12px 14px; font-size:14.5px; color:var(--ink); outline:none; font-family:inherit; }
        .key-dash input:focus { border-color:var(--ember); }
        .key-dash .btn { width:100%; margin-top:18px; background:var(--ember); color:#fff6ec; border:none; font-weight:600; font-size:15px; padding:14px; border-radius:12px; cursor:pointer; }
        .key-dash .btn:disabled { opacity:.5; cursor:default; }
        .key-dash .err { margin-top:14px; border-radius:12px; padding:11px 13px; font-size:14px; background:rgba(189,95,47,.12); color:var(--ember-deep); }
        .key-dash .ok { margin-top:14px; border-radius:12px; padding:11px 13px; font-size:14px; background:var(--ember-soft); color:var(--ember-deep); }
        .key-dash .warn { margin-top:14px; border:1px dashed var(--ember); border-radius:14px; padding:16px; background:var(--ember-soft); }
        .key-dash .warn .lbl { font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--mut); font-weight:600; margin-bottom:8px; }
        .key-dash .keyrow { display:flex; align-items:center; gap:10px; }
        .key-dash .key { flex:1; font-family:"DM Mono",monospace; font-size:13px; background:#fff; border:1px solid var(--hair); border-radius:10px; padding:11px 12px; word-break:break-all; }
        .key-dash .copy { background:var(--ink); color:var(--paper); border:none; border-radius:10px; padding:11px 16px; font-weight:600; cursor:pointer; font-size:13px; white-space:nowrap; }
        .key-dash .table-wrap { overflow-x:auto; margin-top:24px; }
        .key-dash table { width:100%; border-collapse:collapse; font-size:13px; }
        .key-dash th, .key-dash td { text-align:left; padding:12px 16px; border-bottom:1px solid var(--hair); }
        .key-dash th { font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--mut); font-weight:600; }
        .key-dash tr:last-child td { border-bottom:none; }
        .key-dash code { font-family:"DM Mono",monospace; font-size:12px; }
        .key-dash .tag { display:inline-block; padding:2px 9px; border-radius:999px; font-size:10.5px; font-weight:600; background:rgba(217,116,63,.1); color:var(--ember); border:1px solid rgba(217,116,63,.22); margin-right:4px; }
        .key-dash .tag.green{background:rgba(34,120,60,.08);color:#1a6b35;border-color:rgba(34,120,60,.22);}
        .key-dash .tag.red{background:rgba(180,40,40,.08);color:#8a2222;border-color:rgba(180,40,40,.22);}
        .key-dash .btn-sm { padding:4px 11px; border-radius:8px; font-size:12px; cursor:pointer; border:1px solid var(--hair); background:#fff; color:var(--ink); }
        .key-dash .btn-sm:hover{ border-color:var(--ember); color:var(--ember);}
        .key-dash .btn-sm.danger { color:#8a2222; } .key-dash .btn-sm.danger:hover{border-color:#8a2222;}
        .key-dash .btn-sm.ember { background:var(--ember); color:#fff6ec; border-color:var(--ember); }
        .key-dash .btn-sm.ember:hover { background:var(--ember-deep); }
        .key-dash .actions-cell { display:flex; gap:6px; flex-wrap:wrap; }
        .key-dash .rate-limit { font-size:12px; color:var(--mut); margin-top:16px; }
        .key-dash .logout { margin-top:24px; }
        .key-dash .logout button { background:transparent; border:1px solid var(--hair); color:var(--mut); padding:8px 16px; border-radius:10px; cursor:pointer; font-size:13px; }
        .key-dash .logout button:hover { border-color:var(--ember); color:var(--ember); }
        @media(max-width:680px){
          .key-dash .wrap { padding:24px 16px 60px; }
          .key-dash .card { padding:24px 20px; }
          .key-dash .actions-cell { flex-direction:column; }
          .key-dash .btn-sm { width:100%; text-align:center; }
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
            <h1>Manage your keys</h1>
            <p className="lede">Paste your MCP key to view, revoke, or regenerate it.</p>
            <label htmlFor="kd-key">Your MCP key</label>
            <input
              id="kd-key"
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
            <h1>Your keys</h1>
            <p className="lede">Manage your MCP keys. Your key is stored locally in this browser.</p>

            {error && <div className="err">{error}</div>}
            {success && <div className="ok">{success}</div>}

            {newKey && (
              <div className="warn">
                <div className="lbl">New key — copy it now, it won&apos;t be shown again</div>
                <div className="keyrow">
                  <div className="key">{newKey}</div>
                  <button className="copy" onClick={copyNewKey}>copy</button>
                </div>
              </div>
            )}

            <div className="table-wrap">
              {loading ? (
                <p style={{ color: "var(--mut)", margin: "24px 0" }}>Loading…</p>
              ) : keys.length === 0 ? (
                <p style={{ color: "var(--mut)", margin: "24px 0" }}>No keys found for this account.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Key ID</th>
                      <th>Created</th>
                      <th>Last Used</th>
                      <th>Scopes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k.id}>
                        <td><code>{k.id.slice(0, 8)}…</code></td>
                        <td>{formatDate(k.created_at)}</td>
                        <td>{formatDate(k.last_used_at)}</td>
                        <td>{k.scopes.map((s) => <span className="tag" key={s}>{s}</span>)}</td>
                        <td><span className={`tag ${k.status === "revoked" ? "red" : "green"}`}>{k.status}</span></td>
                        <td>
                          <div className="actions-cell">
                            {k.status === "active" ? (
                              <>
                                <button className="btn-sm" onClick={() => regenerateKey(k.id)}>Regenerate</button>
                                <button className="btn-sm danger" onClick={() => revokeKey(k.id)}>Revoke</button>
                              </>
                            ) : (
                              <button className="btn-sm ember" onClick={() => regenerateKey(k.id)}>Generate new</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {rateLimitRemaining !== null && (
              <p className="rate-limit">Rate limit remaining: {rateLimitRemaining}</p>
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
