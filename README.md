# Strands

A portfolio that exists in four art-directed realities ("strands") plus a plain civilian view.
Design source of truth: [DESIGN.md](DESIGN.md).

## Your content

Everything human-written lives in **`content/profile.ts`**. Values wrapped in `ph(…)` are
placeholders; replace `ph("…")` with `"…"` as you fill them in.

```sh
pnpm content:audit   # what is still placeholder
```

While any placeholder remains, every page is marked `noindex`. Once you set `site.url` to your real
domain, a Vercel production build refuses to ship with placeholders still in place (set
`ALLOW_PLACEHOLDERS=1` to override). Media goes in `content/media/`, blog posts in
`content/writing/`.

## Deploy (Vercel)

1. On vercel.com/new choose **Import Git Repository** and pick this repo (grant the Vercel GitHub
   app access if asked).
2. The framework preset auto-detects **Astro**. Keep the default build, output and install
   settings; no environment variables are needed.
3. Deploy. The production branch is the repo's default branch, so every push redeploys.

Until `site.url` in `content/profile.ts` is your real domain, canonical URLs use the Vercel
deployment's own address.

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
