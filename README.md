# Strands

A portfolio that exists in four art-directed realities ("strands") plus a plain civilian view.
Design source of truth: [DESIGN.md](DESIGN.md).

## Your content

Everything human-written lives in **`content/profile.ts`**. Values wrapped in `ph(…)` are
placeholders; replace `ph("…")` with `"…"` as you fill them in.

```sh
pnpm content:audit   # what is still placeholder
```

A Vercel production build refuses to ship placeholders (set `ALLOW_PLACEHOLDERS=1` to override).
Media goes in `content/media/`, blog posts in `content/writing/`.

## Commands

| Command                              | What it does                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `pnpm dev`                           | Dev server (placeholders get a dashed outline)                                           |
| `pnpm build`                         | Static build to `dist/`                                                                  |
| `pnpm preview`                       | Serve `dist/` with brotli, like Vercel                                                   |
| `pnpm check`                         | `astro check`, `tsc`, DESIGN.md ↔ tokens drift check                                     |
| `pnpm lint`                          | ESLint and the named-easing rule                                                         |
| `pnpm test`                          | Unit tests (contrast for every strand, tear geometry, clock, content shape)              |
| `pnpm e2e`                           | Playwright: strand switching, interrupts, keyboard, civilian, print, reduced motion, axe |
| `pnpm lh`                            | Lighthouse mobile + desktop per strand (needs `pnpm preview` running)                    |
| `pnpm slop-lint`                     | Anti-slop and IP checks over the built site                                              |
| `pnpm size`                          | Bytes a first visit downloads                                                            |
| `pnpm qa:shots`                      | Screenshot matrix + contact sheet into `qa/shots`                                        |
| `pnpm qa:tear 01 03 desk`            | Frame-accurate MP4 of a tear into `qa/render` (needs ffmpeg)                             |
| `pnpm tokens` / `fonts` / `textures` | Regenerate token CSS, subset fonts, texture tiles                                        |
