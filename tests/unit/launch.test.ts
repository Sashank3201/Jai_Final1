import { describe, expect, it } from 'vitest';
import { launchBlocked, siteOrigin } from '../../src/lib/ph.ts';

describe('launchBlocked', () => {
  const base = { env: 'production', allow: false, siteIsPlaceholder: true, count: 30 };

  it('lets a production build through while site.url is still a placeholder (preview)', () => {
    expect(launchBlocked(base)).toBe(false);
  });
  it('blocks a real launch: real site.url with placeholders left', () => {
    expect(launchBlocked({ ...base, siteIsPlaceholder: false, count: 3 })).toBe(true);
  });
  it('ships a real launch once every placeholder is gone', () => {
    expect(launchBlocked({ ...base, siteIsPlaceholder: false, count: 0 })).toBe(false);
  });
  it('ALLOW_PLACEHOLDERS overrides', () => {
    expect(launchBlocked({ ...base, siteIsPlaceholder: false, allow: true })).toBe(false);
  });
  it('never blocks preview or local builds', () => {
    for (const env of ['preview', 'development', undefined]) {
      expect(launchBlocked({ ...base, env, siteIsPlaceholder: false })).toBe(false);
    }
  });
});

describe('siteOrigin', () => {
  it('uses the real site.url once it is real', () => {
    expect(siteOrigin('https://me.dev', false, { VERCEL_URL: 'x.vercel.app' })).toBe(
      'https://me.dev',
    );
  });
  it('falls back to the Vercel production URL, then the deployment URL', () => {
    const env = {
      VERCEL_PROJECT_PRODUCTION_URL: 'strands.vercel.app',
      VERCEL_URL: 'abc.vercel.app',
    };
    expect(siteOrigin('https://example.com', true, env)).toBe('https://strands.vercel.app');
    expect(siteOrigin('https://example.com', true, { VERCEL_URL: 'abc.vercel.app' })).toBe(
      'https://abc.vercel.app',
    );
  });
  it('keeps the placeholder when not on Vercel', () => {
    expect(siteOrigin('https://example.com', true, {})).toBe('https://example.com');
  });
});
