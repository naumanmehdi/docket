"use client";

import { useState } from "react";

export default function InstallSnippet({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const config = {
    mcpServers: {
      apprank: {
        url,
        headers: { Authorization: "Bearer YOUR_API_KEY" },
      },
    },
  };
  const text = JSON.stringify(config, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="codebox">
      <button className="copybtn" onClick={copy}>
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <pre>{text}</pre>
    </div>
  );
}
