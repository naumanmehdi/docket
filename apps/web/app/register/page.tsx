"use client";
// docket /register — self-serve: redeem an invite code for a per-identity MCP key.
// Style matches /mcp-docs topbar exactly.

import { useState } from "react";

interface Result {
  plaintext: string;
  scopes: string[];
  owner: string;
}

export default function RegisterPage() {
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
    <div className="mcp-docs">
      <style>{`
        .mcp-docs { min-height:100vh; background:var(--paper); color:var(--ink); }
        .mcp-docs .topbar { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid var(--hair); background:rgba(251,247,239,0.85); backdrop-filter:blur(8px); position:sticky; top:0; z-index:10; }
        .mcp-docs .brand { display:flex; align-items:center; gap:10px; font-weight:600; }
        .mcp-docs .mark { width:26px;height:26px;border-radius:6px;background:var(--ink);color:var(--paper); display:grid;place-items:center;font-size:13px;font-weight:700; }
        .mcp-docs .pill { padding:6px 14px; border-radius:999px; background:var(--ink); color:var(--paper); font-size:12px; font-weight:500; border:none; cursor:pointer; text-decoration:none; display:inline-block; }
        .mcp-docs .pill.ghost { background:transparent; color:var(--ink); border:1px solid var(--hair); }
        .mcp-docs .wrap { max-width: 860px; margin:0 auto; padding:40px 24px 80px; }
        .mcp-docs .card { background:var(--card); border:1px solid var(--hair); border-radius:22px; padding:34px 32px; box-shadow:0 24px 50px -28px rgba(66,44,20,.3); position:relative; overflow:hidden; }
        .mcp-docs .card::before { content:""; position:absolute; left:32px; top:-12px; width:84px; height:20px; background:var(--ember); border-radius:9px 9px 0 0; }
        .mcp-docs h1 { font-size:28px; font-weight:600; margin:0 0 8px; letter-spacing:-0.02em; }
        .mcp-docs .lede { color:var(--mut); font-size:14px; margin:0 0 24px; line-height:1.6; }
        .mcp-docs label { display:block; font-size:12px; font-weight:600; color:var(--ink); margin:12px 0 6px; }
        .mcp-docs input { width:100%; background:var(--paper); border:1px solid var(--hair); border-radius:12px; padding:12px 14px; font-size:14.5px; color:var(--ink); outline:none; font-family:inherit; }
        .mcp-docs input:focus { border-color:var(--ember); }
        .mcp-docs .btn { width:100%; margin-top:18px; background:var(--ember); color:#fff6ec; border:none; font-weight:600; font-size:15px; padding:14px; border-radius:12px; cursor:pointer; }
        .mcp-docs .btn:disabled { opacity:.5; cursor:default; }
        .mcp-docs .err { margin-top:14px; border-radius:12px; padding:11px 13px; font-size:14px; background:rgba(189,95,47,.12); color:var(--ember-deep); }
        .mcp-docs .ok { margin-top:20px; border:1px dashed var(--ember); border-radius:14px; padding:16px 16px 14px; background:var(--ember-soft); }
        .mcp-docs .ok .lbl { font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--mut); font-weight:600; margin-bottom:8px; }
        .mcp-docs .keyrow { display:flex; align-items:center; gap:10px; }
        .mcp-docs .key { flex:1; font-family:"DM Mono",monospace; font-size:13px; background:#fff; border:1px solid var(--hair); border-radius:10px; padding:11px 12px; word-break:break-all; }
        .mcp-docs .copy { background:var(--ink); color:var(--paper); border:none; border-radius:10px; padding:11px 16px; font-weight:600; cursor:pointer; font-size:13px; white-space:nowrap; }
        .mcp-docs .warn { font-size:12.5px; color:var(--mut); margin-top:12px; line-height:1.6; }
        .mcp-docs .warn b{color:var(--ink);}
      `}</style>

      <div className="topbar">
        <div className="brand">
          <div className="mark">d</div>
          <div>docket</div>
        </div>
        <a className="pill ghost" href="/">← board</a>
      </div>

      <div className="wrap">
        <div className="card">
          {!result ? (
            <form onSubmit={submit}>
              <h1>Get an agent key</h1>
              <p className="lede">Redeem your invite code for a per-identity key to talk to docket over MCP.</p>
              <p className="scopes" style={{color:"var(--faint)", fontSize:"12.5px", margin:"0 0 18px"}}>Issued keys get read + write scopes. The key is shown once.</p>
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
              <a className="btn" style={{marginTop:14, display:'inline-flex', justifyContent:'center', textDecoration:'none'}} href="/">Close</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
