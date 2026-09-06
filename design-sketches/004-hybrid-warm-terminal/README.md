# Variant D — Hybrid (v2): warm-dark · discoverable · agent-native

The working direction (updated 2026-09-06). A single warm-dark, discoverable, agent-native
landing that pulls the best of A, B and C — re-tuned after user feedback on v1.

## v2 changes (per feedback)
- **Search bar now centered** in the hero, with suggestion chips beneath.
- **Big category chooser** (outbid.lol style) right under the hero: Everything / Ideas / Apps /
  MCPs / Skills — each a large clickable tile showing a live item count.
- **Sub-filters** appear when a built category (Apps / MCPs / Skills) is selected, e.g.
  Apps → Productivity/Research/Design; MCPs → Database/Coding/Browser; Skills → Writing/Coding/Marketing.
  (Ideas filter by lifecycle status instead — open/claimed/built.)
- **Every card shows a one-line headline** (the "one" field) in bold under the name.
- **Clicking a built card re-directs to the maker's site** (the real `url`). Idea cards are
  non-linking (they're unbuilt) and show their claim status.
- Hero + terminal + warmth carried over from v1; everything data-driven in JS so category /
  sub-filter / search combine live.

## What it keeps from A / B / C
- **A's warmth** as a warm-dark espresso/cream/fire palette (not light cream = no "AI slop" look)
- **B's live terminal** as the agent-native proof point (now a slim centered strip)
- **C's search** — elevated to a centered, first-class action

## How the pieces work in the mockup
- **Category tiles** (clickable) filter the board and switch the sub-filter row.
- **Sub-filter chips** narrow within a category; click again to clear.
- **Search box** filters live across name/headline/description/sub.
- Built cards carry a `↗ open` affordance and link out; hover nudges the row.

## Notes / next
- This mockup is **interactive** (click a category, a sub-filter, type in search) — open it and try.
- `DATA` array is sample content; in the real build this is served from the board (kind, url,
  headline/tagline, description, subcategory, claim state).
- The design direction is approved to build from; we may still refine the front-end later.

Files: `index.html` (this variant). Earlier one-off stances in `../001`, `../002`, `../003`.
