"use client";
// docket /register — self-serve: redeem an invite code for a per-identity MCP key.
// The plaintext key is shown exactly once; nothing else here touches the DB.

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
    <div className="reg">
      <style>{`
        .reg { min-height:100vh; background:var(--paper); color:var(--ink); display:grid;
          place-items:center; padding:40px 20px; }
        .reg .card { width:min(460px,94vw); background:var(--card); border:1px solid var(--hair);
          border-radius:22px; padding:34px 32px; box-shadow:0 24px 50px -28px rgba(66,44,20,.3);
          position:relative; overflow:hidden; }
        .reg .card::before { content:""; position:absolute; left:32px; top:-12px; width:84px; height:20px;
          background:var(--ember); border-radius:9px 9px 0 0; }
        .reg .top { display:flex; align-items:center; gap:10px; margin-top:6px; }
        .reg .mark { width:30px;height:30px;border-radius:8px;background:var(--ink);color:var(--paper);
          display:grid;place-items:center;font-family:"Fraunces",serif;font-size:16px;position:relative; }
        .reg .mark::after{content:"";position:absolute;top:-5px;left:6px;width:13px;height:8px;
          background:var(--ember);border-radius:3px 3px 0 0;}
        .reg .brand { font-weight:600; }
        .reg h1 { font-family:"Fraunces",serif; font-size:26px; font-weight:500; margin:20px 0 6px; }
        .reg .lede { color:var(--mut); font-size:14px; margin:0 0 6px; }
        .reg .scopes { color:var(--faint); font-size:12.5px; margin:0 0 18px; }
        .reg label { display:block; font-size:12px; font-weight:600; color:var(--ink); margin:12px 0 6px; }
        .reg input { width:100%; background:var(--paper); border:1px solid var(--hair); border-radius:12px;
          padding:12px 14px; font-size:14.5px; color:var(--ink); outline:none; font-family:inherit; }
        .reg input:focus { border-color:var(--ember); }
        .reg .btn { width:100%; margin-top:18px; background:var(--ember); color:#fff6ec; border:none;
          font-weight:600; font-size:15px; padding:14px; border-radius:12px; cursor:pointer; }
        .reg .btn:disabled { opacity:.5; cursor:default; }
        .reg .err { margin-top:14px; border-radius:12px; padding:11px 13px; font-size:14px;
          background:rgba(189,95,47,.12); color:var(--ember-deep); }
        .reg .ok { margin-top:20px; border:1px dashed var(--ember); border-radius:14px; padding:16px 16px 14px;
          background:var(--ember-soft); }
        .reg .ok .lbl { font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--mut);
          font-weight:600; margin-bottom:8px; }
        .reg .keyrow { display:flex; align-items:center; gap:10px; }
        .reg .key { flex:1; font-family:"DM Mono",monospace; font-size:13px; background:#fff; border:1px solid
          var(--hair); border-radius:10px; padding:11px 12px; word-break:break-all; }
        .reg .copy { background:var(--ink); color:var(--paper); border:none; border-radius:10px; padding:11px 16px;
          font-weight:600; cursor:pointer; font-size:13px; white-space:nowrap; }
        .reg .warn { font-size:12.5px; color:var(--mut); margin-top:12px; line-height:1.6; }
        .reg .warn b{color:var(--ink);}
        .reg .back { display:inline-block; margin-top:18px; color:var(--mut); text-decoration:none;
          font-size:13px; }
        .reg .back:hover{color:var(--ember);}
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
            <a className="back" href="/">← back to docket</a>
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
            <a className="back" href="/">← back to docket</a>
          </div>
        )}
      </div>
    </div>
  );
}
