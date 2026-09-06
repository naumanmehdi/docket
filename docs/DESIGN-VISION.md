# DESIGN VISION — the "mind-blown" end concept (NOT built yet)

> **Status: CONCEPT / ASPIRATION.** This is the user's *end-goal* design vision. The current
> live front-end is the clean warm-dark "D" design (see `ARCHITECTURE.md` + `globals.css`) —
> a solid, launchable base. This doc captures where the design should go NEXT, so it's ready
> to iterate and execute without re-discovering the intent. Do not treat as current scope.

---

## The one-line vision
A high-end, playful, motion-rich experience that is so striking people come back *just to look at
it* — the design itself is a reason to visit, not a skin over the product.

## What the user actually wants (plain language)
- **Front-ends built by "single-shot prompts" feel boring/basic.** The user wants to escape that —
  a design that can't be produced by one generic prompt.
- **Fun, lively, playful, delightful.** Not corporate-minimal, not generic-SaaS.
- **Motion and animation everywhere.** Users should be *mind-blown* — and that "wow" should hook
  people onto the site to explore the design itself.
- **Stand out.** In a crowded directory/discovery space, design is a real differentiator.
- Current D is "fine for first launch" — warm, credible, clean. It is the **foundation**, not the endpoint.

## Design principles (for whoever executes this later)
1. **Design is the product.** The wow-factor is a feature. Every screen should feel crafted, not templated.
2. **Playful but purposeful.** Fun must serve the catalog (exploring ideas/apps/MCPs/skills), never obscure it.
3. **Motion tells the story.** Animate the *journey* — publishing an idea, an idea getting claimed →
   built → shipped should feel alive, not like rows in a table.
4. **Warm, not cold.** Keep the warm-dark soul of D; escalate it, don't replace it with generic neon/dark.
5. **The agent-native angle is the fun.** Agents publishing and finding things is inherently playful —
   the design can visualise the agent "doing the paperwork" as a character/motion motif.
6. **Accessible & responsive still apply.** Wow must survive mobile (iOS/Android) and reduced-motion.

## Directional ideas to explore (sparks, not a spec)
- **Micro-interactions:** magnetic buttons, playful cursor/pointer effects, tactile hovers on board cards,
  subtle tilt/lift. Category cards that feel "pressable."
- **Scroll-driven story:** the hero → categories → board as a choreographed scroll journey with parallax
  and staged reveals.
- **Living board:** published items animate in; an idea "claimed" by a builder shows a handshake/ship
  moment; built items get a celebratory flourish. Make the lifecycle *visible and fun*.
- **Animated agent motif:** a small agent character/loop that "installs," "publishes," "finds" — echoes the
  terminal, but alive.
- **Playful identity:** custom logo mark animation, splash of fire/gold on interactions, an easter-egg vibe.
- **Color/motion language:** define a small set of signature motions (entrance, claim→built, hover)
  reused consistently so it feels designed, not chaotic.

## What "mind-blown" is NOT
- Not generic dark-mode-with-gradients.
- Not decorative animation that slows or confuses the catalog.
- Not sacrificing readability/clarity for flash.
- Not a different visual direction that ignores the warm-dark brand foundation.

## Build notes for the future
- **The current code is ready for this.** The front-end is componentized (`Landing/Catalog/PublishModal`),
  all tokens are in `globals.css :root`, all copy in `lib/copy.ts`, brand in `lib/site.ts`. A redesign =
  replace components + tokens + copy **without touching data, the server page, or the backend.**
- Recommended approach: a **premium design sprint** with references/moodboards first, then a fresh design
  system (tokens + motion library) on top of the same component structure. Use animation/design skills
  (e.g. motion/creative skill sets) rather than hand-rolling everything.
- Consider `framer-motion` or CSS scroll-driven animations; keep reduced-motion support.

## Reference vibes (for the executors to study)
- awwwards-tier playful/bold sites; Stripe/Linear *quality of motion*; award-winning agency sites for the
  "can't-be-a-prompt" craft. Collect concrete references before building.

---
**Owner note:** iterate this doc when inspiration strikes. When you're ready to execute, open this +
`ARCHITECTURE.md`, run a design sprint, and replace the presentation layer behind the same backend.
