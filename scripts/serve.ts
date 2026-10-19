// Static server for the built site, close enough to Vercel for QA and Lighthouse:
// brotli/gzip compression, clean URLs, long-lived caching for hashed assets, 404 page.
//   node scripts/serve.ts [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const root = new URL('../dist/', import.meta.url).pathname;
const port = Number(process.argv[2] ?? 4321);

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};
const compressible = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']);

async function resolve(pathname: string): Promise<string | null> {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  for (const candidate of [clean, join(clean, 'index.html'), `${clean}.html`]) {
    const file = join(root, candidate);
    if (!file.startsWith(root)) return null;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      /* try next */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let file = await resolve(url.pathname);
  let status = 200;
  if (!file) {
    file = join(root, '404.html');
    status = 404;
  }
  let body: Buffer;
  try {
    body = await readFile(file);
  } catch {
    res.writeHead(404).end('Not found');
    return;
  }
  const ext = extname(file);
  const headers: Record<string, string> = {
    'content-type': types[ext] ?? 'application/octet-stream',
  };
  headers['cache-control'] = file.includes('/_astro/')
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=0, must-revalidate';
  const accept = String(req.headers['accept-encoding'] ?? '');
  if (compressible.has(ext)) {
    if (accept.includes('br')) {
      body = brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
      headers['content-encoding'] = 'br';
    } else if (accept.includes('gzip')) {
      body = gzipSync(body, { level: 9 });
      headers['content-encoding'] = 'gzip';
    }
    headers['vary'] = 'accept-encoding';
  }
  headers['content-length'] = String(body.length);
  res.writeHead(status, headers).end(body);
}).listen(port, () => console.log(`serving dist/ on http://localhost:${port}`));
