// STRAND-03 runtime. Phase 2 ships a token-only proxy of this strand (palette and type),
// so the tear has a second reality to tear into. Cursor, grain and blinds arrive in Phase 3.

import type { StrandContext } from '../registry.ts';

export function mount(_ctx: StrandContext): () => void {
  return () => {};
}
