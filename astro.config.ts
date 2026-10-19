import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import { profile } from './content/profile.ts';
import { placeholderCount } from './src/lib/ph.ts';

if (
  process.env.VERCEL_ENV === 'production' &&
  process.env.ALLOW_PLACEHOLDERS !== '1' &&
  placeholderCount() > 0
) {
  throw new Error(
    `content/profile.ts still has ${placeholderCount()} placeholder values. Run \`pnpm content:audit\`, or set ALLOW_PLACEHOLDERS=1 to ship them anyway.`,
  );
}

type Variant = { src: [string]; weight: string; style: 'normal' | 'italic'; stretch?: string };
const local = (
  name: string,
  cssVariable: `--${string}`,
  fallbacks: string[],
  variants: [Variant, ...Variant[]],
) => ({
  provider: fontProviders.local(),
  name,
  cssVariable,
  fallbacks,
  options: { variants },
});
const file = (name: string): [string] => [`./src/assets/fonts/${name}.woff2`];

export default defineConfig({
  site: profile.site.url,
  output: 'static',
  adapter: vercel(),
  integrations: [mdx()],
  trailingSlash: 'never',
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto', format: 'directory' },
  devToolbar: { enabled: false },
  fonts: [
    // 01 Brooklyn Press
    local(
      'Anybody',
      '--font-anybody',
      ['Impact', 'Arial Narrow', 'sans-serif'],
      [{ src: file('anybody'), weight: '700 900', style: 'normal', stretch: '50% 75%' }],
    ),
    local(
      'Archivo',
      '--font-archivo',
      ['Arial', 'sans-serif'],
      [{ src: file('archivo'), weight: '400 700', style: 'normal' }],
    ),
    local(
      'Permanent Marker',
      '--font-marker',
      ['Comic Sans MS', 'cursive'],
      [{ src: file('permanent-marker'), weight: '400', style: 'normal' }],
    ),
    // 02 Wet Dusk
    local(
      'Bodoni Moda',
      '--font-bodoni',
      ['Didot', 'Georgia', 'serif'],
      [
        { src: file('bodoni-moda'), weight: '400 600', style: 'normal' },
        { src: file('bodoni-moda-italic'), weight: '400 600', style: 'italic' },
      ],
    ),
    local(
      'Newsreader',
      '--font-newsreader',
      ['Georgia', 'serif'],
      [
        { src: file('newsreader'), weight: '400 600', style: 'normal' },
        { src: file('newsreader-italic'), weight: '400 600', style: 'italic' },
      ],
    ),
    // 03 Late Edition
    local(
      'Grenze Gotisch',
      '--font-grenze',
      ['Georgia', 'serif'],
      [{ src: file('grenze-gotisch'), weight: '600 800', style: 'normal' }],
    ),
    local(
      'Stint Ultra Condensed',
      '--font-stint',
      ['Arial Narrow', 'serif'],
      [{ src: file('stint-ultra-condensed'), weight: '400', style: 'normal' }],
    ),
    local(
      'Noticia Text',
      '--font-noticia',
      ['Georgia', 'serif'],
      [
        { src: file('noticia-text-400'), weight: '400', style: 'normal' },
        { src: file('noticia-text-400-italic'), weight: '400', style: 'italic' },
        { src: file('noticia-text-700'), weight: '700', style: 'normal' },
      ],
    ),
    // 04 Screentone
    local(
      'Jost',
      '--font-jost',
      ['Futura', 'Century Gothic', 'sans-serif'],
      [
        { src: file('jost'), weight: '400 800', style: 'normal' },
        { src: file('jost-italic'), weight: '700 900', style: 'italic' },
      ],
    ),
    local(
      'Martian Mono',
      '--font-martian',
      ['Menlo', 'Consolas', 'monospace'],
      [{ src: file('martian-mono'), weight: '400 600', style: 'normal', stretch: '75% 100%' }],
    ),
  ],
});
