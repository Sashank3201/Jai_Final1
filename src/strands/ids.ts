// Strand identifiers. Kept dependency-free: the boot script and the client engine both import it.

export type StrandId = '00' | '01' | '02' | '03' | '04';
export type PublicStrandId = Exclude<StrandId, '00'>;

export const DEFAULT_STRAND: PublicStrandId = '01';

export const STRANDS: ReadonlyArray<{ id: PublicStrandId; name: string; slug: string }> = [
  { id: '01', name: 'Brooklyn Press', slug: 'brooklyn-press' },
  { id: '02', name: 'Wet Dusk', slug: 'wet-dusk' },
  { id: '03', name: 'Late Edition', slug: 'late-edition' },
  { id: '04', name: 'Screentone', slug: 'screentone' },
];

/**
 * Strands that are built far enough to switch into. Phase 2 ships 01 for real
 * and a token-only proxy of 03 so the tear has somewhere to go.
 */
export const AVAILABLE: ReadonlyArray<PublicStrandId> = ['01', '03'];

export function isPublicStrandId(value: unknown): value is PublicStrandId {
  return value === '01' || value === '02' || value === '03' || value === '04';
}

export function strandName(id: StrandId): string {
  return STRANDS.find((s) => s.id === id)?.name ?? 'Plate Zero';
}
