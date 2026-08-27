import { BRAND, type Listing } from "@apprank/core";
import { getStore } from "@/lib/store";
import ListingForm from "./_components/ListingForm";
import EmailCapture from "./_components/EmailCapture";
import InstallSnippet from "./_components/InstallSnippet";

export const dynamic = "force-dynamic";

const LOGO_COLORS = ["#177e6b", "#e4572e", "#b8791b", "#3a5bd9", "#8e44ad", "#c0392b"];
function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LOGO_COLORS[h % LOGO_COLORS.length]!;
}

async function getListings(): Promise<Listing[]> {
  try {
    return await getStore().listLatest(10);
  } catch (err) {
    console.error("board unavailable", err);
    return [];
  }
}

export default async function HomePage() {
  const listings = await getListings();
  const mcpUrl = `https://${BRAND.domain}/mcp`;

  return (
    <div className="wrap">
      <header>
        <div className="mark">
          <span className="dots">
            <span />
            <span />
            <span />
          </span>
          {BRAND.name}
        </div>
        <span className="phase">MVP · free forever</span>
      </header>

      {/* HERO */}
      <section className="hero">
        <span className="kick">● Your agent can list you — for free</span>
        <h1>
          Your agent can list your AI tool in <em>2 minutes</em>.
        </h1>
        <p className="lede">
          {BRAND.name} is the directory <b>your agent can use</b>. List your tool for free — on
          the web or straight from your terminal — and appear on the live board instantly.
        </p>
        <div className="cta">
          <a className="btn primary" href="#list">
            List your tool
          </a>
          <a className="btn ghost" href="#board">
            See the live board
          </a>
        </div>
      </section>

      {/* HOW */}
      <section className="how">
        <div className="sec-head">
          <div className="smallcap">How it works</div>
          <h2>From “I made an app” to “the world can find it.”</h2>
          <p>Four plain steps. The clever part: even an AI assistant can do step one for you.</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="num">1</div>
            <h3>They list their tool</h3>
            <p>A maker adds their AI tool — completely free, in under two minutes.</p>
          </div>
          <div className="step">
            <div className="num">2</div>
            <h3>Or their agent does</h3>
            <p>If they build with AI, their assistant can call the {BRAND.name} MCP server instead of filling a form.</p>
          </div>
          <div className="step">
            <div className="num">3</div>
            <h3>It appears instantly</h3>
            <p>The tool shows up on the public live board, right away.</p>
          </div>
          <div className="step">
            <div className="num">4</div>
            <h3>It can get found</h3>
            <p>Every listing feeds the directory people (and AI) search to find the best AI tools.</p>
          </div>
        </div>
      </section>

      {/* LIVE BOARD */}
      <section className="board" id="board">
        <div className="board-head">
          <div className="sec-head">
            <div className="smallcap">Live board</div>
            <h2>Latest listings.</h2>
          </div>
          <span className="live-pill">
            <i /> LIVE
          </span>
        </div>
        {listings.length === 0 ? (
          <div className="board-empty">
            No listings yet — be the first. This board fills itself from the same database the MCP
            server writes to, so every listing is real.
          </div>
        ) : (
          <div className="board-cards">
            {listings.map((l) => (
              <a className="bcard" href={l.url} target="_blank" rel="noopener noreferrer" key={l.id}>
                <div className="logo" style={{ background: colorFor(l.name) }}>
                  {l.name.charAt(0).toUpperCase()}
                </div>
                <div className="info">
                  <b>{l.name}</b>
                  <span>{l.tagline}</span>
                </div>
                <div className="meta">
                  <span className="chip cat">{l.category}</span>
                  {l.x_handle ? (
                    <span className="chip x">@{l.x_handle}</span>
                  ) : null}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* INSTALL SNIPPET */}
      <section className="install">
        <div className="sec-head">
          <div className="smallcap">For your agent</div>
          <h2>“Your agent can list you.”</h2>
          <p>
            Drop the {BRAND.name} MCP server into Claude Code, Cursor, Codex, or any MCP client and
            your agent can submit your tool directly.
          </p>
        </div>
        <InstallSnippet url={mcpUrl} />
        <p className="hint">
          Add this to your <code>.mcp.json</code> (Claude Code / Cursor) and replace{" "}
          <code>YOUR_API_KEY</code> with a key for the server. Then just ask:{" "}
          <em>“list my tool on {BRAND.name}.”</em>
        </p>
      </section>

      {/* WEB FORM */}
      <section className="formsec" id="list">
        <div className="formside">
          <div className="smallcap">No agent? No problem</div>
          <h2>List it from the web.</h2>
          <p>
            Same database, same board — just five fields. Free forever, no account, no waiting.
          </p>
        </div>
        <ListingForm />
      </section>

      {/* EMAIL */}
      <section className="email">
        <h2>Don’t miss the first Top-3.</h2>
        <p>
          Each day we pick the 3 most interesting AI tools, actually try them, and tell you — with
          an honest verdict, even when the answer is “skip it.”
        </p>
        <EmailCapture />
      </section>

      {/* PROMISE */}
      <section className="promise">
        <div className="serif">{BRAND.tagline}</div>
        <p>
          {BRAND.promise} — money never touches rankings. Placement is earned by quality, not price.
        </p>
      </section>

      <footer>
        <div className="tagline">{BRAND.name} — built for builders, and their agents.</div>
        <div style={{ marginTop: 8 }}>© {new Date().getFullYear()} {BRAND.name} · the directory your agent can use</div>
      </footer>
    </div>
  );
}
