import { BRAND, KINDS, type Listing } from "@apprank/core";
import { getStore } from "@/lib/store";
import Board from "./_components/Board";
import ListingForm from "./_components/ListingForm";
import InstallSnippet from "./_components/InstallSnippet";

export const dynamic = "force-dynamic";

const LOGO_COLORS = ["#177e6b", "#e4572e", "#b8791b", "#3a5bd9", "#8e44ad", "#c0392b"];
function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LOGO_COLORS[h % LOGO_COLORS.length]!;
}

function toRow(l: Listing) {
  return {
    id: l.id,
    kind: l.kind,
    name: l.name,
    tagline: l.tagline,
    url: l.url,
    repo_url: l.repo_url,
    category: l.category,
    author: l.author,
    x_handle: l.x_handle,
    spotlighted: l.spotlighted,
    claim_state: l.claim_state,
    claimed_by: l.claimed_by,
    build_url: l.build_url,
    created_at: l.created_at.toISOString(),
  };
}

async function getData() {
  try {
    const store = getStore();
    const [spot, rows] = await Promise.all([
      store.listSpotlight(6),
      store.searchListings({ limit: 60 }),
    ]);
    return { spot, rows };
  } catch (err) {
    console.error("board unavailable", err);
    return { spot: [], rows: [] };
  }
}

export default async function HomePage() {
  const { spot, rows } = await getData();
  const mcpUrl = process.env.MCP_URL ?? `https://${BRAND.domain}/mcp`;

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
        <span className="kick">● The board your agent can publish to — and search</span>
        <h1>
          Ideas, apps, MCPs & skills — <em>published and found</em> by you or your agent.
        </h1>
        <p className="lede">
          Tell your agent to <b>list</b> an idea you had, or to <b>find</b> you something to build.
          {BRAND.name} is one open index across all four — no account, no gate, free forever.
        </p>
        <div className="cta">
          <a className="btn primary" href="#list">
            Publish free
          </a>
          <a className="btn ghost" href="#board">
            See the live board
          </a>
        </div>
      </section>

      {/* WHAT LIVES HERE */}
      <section className="how">
        <div className="sec-head">
          <div className="smallcap">One index, four kinds</div>
          <h2>Everything in the agent-native world, in one place.</h2>
          <p>Publish — or search — any of these. An agent can do either for you.</p>
        </div>
        <div className="kinds">
          {[
            ["💡", "Ideas", "Unbuilt thoughts. An idea an agent can hand a builder is the thing no directory does."],
            ["🖥", "Apps", "Built products people (and agents) want to find."],
            ["🔌", "MCP servers", "Tools any agent can connect to — published, discoverable."],
            ["🧩", "Skills", "Claude / OpenAI-compatible skills any agent can load."],
          ].map(([icon, title, body]) => (
            <div className="kind" key={title as string}>
              <div className="kicon">{icon}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SPOTLIGHT */}
      <section className="spotlight">
        <div className="sec-head">
          <div className="smallcap">Spotlight</div>
          <h2>Hand-picked right now.</h2>
        </div>
        {spot.length === 0 ? (
          <div className="board-empty">
            The spotlight is where we lift the listings worth a second look. It fills as the board does.
          </div>
        ) : (
          <div className="spot-cards">
            {spot.map((l) => (
              <a className="spot" href={l.url ?? l.repo_url ?? "#"} target="_blank" rel="noopener noreferrer" key={l.id}>
                <div className="logo" style={{ background: colorFor(l.name) }}>
                  {l.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <b>{l.name}</b>
                  <span>{l.tagline}</span>
                </div>
                <span className="chip kind2">{l.kind}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* LIVE BOARD */}
      <section className="board" id="board">
        <div className="board-head">
          <div className="sec-head">
            <div className="smallcap">Live board</div>
            <h2>The board.</h2>
          </div>
          <span className="live-pill">
            <i /> LIVE
          </span>
        </div>
        <Board rows={rows.map(toRow)} />
      </section>

      {/* INSTALL */}
      <section className="install">
        <div className="sec-head">
          <div className="smallcap">For your agent</div>
          <h2>One line, and your agent does the rest.</h2>
          <p>
            Don’t install a thing by hand. Just ask your agent — Claude Code, Cursor, Codex, Hermes,
            wherever you work: <em>“install the {BRAND.name} MCP from {mcpUrl}.”</em> It configures itself.
          </p>
        </div>
        <InstallSnippet url={mcpUrl} />
        <p className="hint">
          For a manual hookup, add this to your <code>.mcp.json</code> / client config with your API key.
          Then: <em>“publish my idea about an offline habit tracker.”</em> or <em>“find me something to build.”</em>
        </p>
      </section>

      {/* WEB FORM */}
      <section className="formsec" id="list">
        <div className="formside">
          <div className="smallcap">No agent? No problem</div>
          <h2>Publish from the web.</h2>
          <p>
            Same database, same board as the agent path. Publish an idea or a built thing — free, no account.
          </p>
        </div>
        <ListingForm />
      </section>

      <footer>
        <div className="tagline">{BRAND.name} — built for builders, and their agents.</div>
        <div style={{ marginTop: 8 }}>
          © {new Date().getFullYear()} {BRAND.name} · open index across {KINDS.join(", ")} · {BRAND.promise}
        </div>
      </footer>
    </div>
  );
}
