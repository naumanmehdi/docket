# Front-end design variants — 3 stances (2026-09-05)

Three throwaway HTML mockups of the AppRank landing/hero. Each takes a DIFFERENT stance on
both the **visual direction** and the **hero story** — not different accent colors.

The product story they share (from the locked plan):
someone has an idea but can't build → publishes it; a builder with no idea → finds it;
**agents do both the listing and the searching.** Plus: one open index across ideas/apps/MCPs/skills,
an MCP server as the front door, llms.txt open index.

---

## A · 001-idea-marketplace — "The idea marketplace" (human, warm, editorial)

**Stance:** this is a *marketplace of ideas that get built*, and the humans (and their agents) are the heart.

**Hero:** *"Have an idea? Someone's ready to build it."* — emotional, centered on the idea→built payoff.
Faces the two personas head-on (I-can't-build / I-have-no-idea), each with a real example utterance.

**Choices:** warm cream + serif display (Fraunces) + coral/teal; split two-card "the flip" showing both
sides of the marketplace; board preview framed as "ideas waiting to be built" with lifecycle chips.

**Strong at:** the emotional hook, the two-sided story, feels like a community product.
**Weak at:** doesn't foreground the *agent/MCP* angle as much — a viewer might not grasp it's agent-native first.

**Best for:** if the "wholesome ideas get built" human story is the primary draw you want to lead with.

---

## B · 002-agent-terminal — "The agent-native terminal" (dark, technical, tool-first)

**Stance:** AppRank is an **MCP server / agent tool**, and the whole page proves it by showing the terminal doing the work.

**Hero:** *"Your agent can publish and find anything it builds with."* — the terminal mockup literally runs
`install docket-mcp` → `publish my idea…` → `find me something to build` and shows each succeed.

**Choices:** dark dev-tool aesthetic (Space Grotesk + JetBrains Mono), registry/terminal chrome, the board
rendered as a mono index with kind tags (IDEA/APP/MCP/SKILL). Reads instantly as "for developers and agents."

**Strong at:** positioning, credibility with the technical/Show-HN audience, the agent-native demo is the hero.
**Weak at:** colder, less "wholesome/community" — scares off non-technical idea-owners.

**Best for:** if the *agent-native MCP* differentiator (the Show HN story) is what you want to scream first.

---

## C · 003-open-index — "The open index" (clean, modern SaaS, discovery-first)

**Stance:** a **searchable index across everything your agents build & use** — one surface, four kinds, easy to scan.

**Hero:** *"Everything your agents build & use, findable in one place."* — leads with a big live **search bar**
("try 'offline habit tracker idea' or 'Supabase MCP'") + suggested query chips.

**Choices:** clean light SaaS (Inter + Newsreader serif accents, indigo accent), four-kind cards with counts,
a two-column "marketplace of ideas" / "index agents read" split, filter-tab board.

**Strong at:** broad discoverability + polish, most "product-like" and scalable-looking, middle ground for both audiences.
**Weak at:** the emotional idea→built payoff is secondary to utility; least distinctive of the three.

**Best for:** if you want a credible, professional product surface that serves discovery and doesn't over-index
on either the human story or the terminal.

---

## Comparison

| Dimension | A · Idea marketplace | B · Agent terminal | C · Open index |
|---|---|---|---|
| Feel | warm · human · editorial | dark · technical · tool | clean · modern · SaaS |
| Primary hook | idea → gets built | agent does it (terminal) | find anything, one index |
| Reads agent-native | medium | **high** | medium-high |
| Reads wholesome/community | **high** | low | medium |
| Board emphasis | ideas being built | the index (mono) | four kinds + search |
| Show-HN / dev credibility | medium | **high** | medium |
| General-audience appeal | **high** | low | high |

**My take (your call):**
- **B** is the sharpest *differentiator* and best Show-HN story — it makes the agent-native MCP undeniable. Risk: alienates non-technical idea-owners (half your marketplace).
- **A** is the most emotionally on-mission for "ideas get built" and the most wholesome — but hides the agent-native edge.
- **C** is the safest, most professional all-rounder but the least memorable.

A strong play: **hybrid — B's agent-native proof point up top (or an animated terminal strip) sitting inside A or C's warmer light layout**, so you lead with *"have an idea? your agent publishes it / finds you one"* (A) OR *"find anything"* (C) while a live terminal/micro-demo establishes the MCP is real. Worth deciding whether the **human story (idea→built) or the dev story (agent-native)** should be the headline — that picks the base, then we graft the other on.

---

Files: `001-idea-marketplace/index.html`, `002-agent-terminal/index.html`, `003-open-index/index.html` — open each in a browser, or they're loaded in the Hermes preview pane.
