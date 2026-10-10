// Single seam for "is this free or paid" (docs/decisions/2026-10-06-free-launch.md): call
// sites never hardcode free-tier behavior. Until a monetization plan ships, this always
// reports non-premium; a later plan swaps the implementation here, not at call sites.
export interface Entitlements {
  readonly isSupporter: boolean;
}

export function useEntitlements(): Entitlements {
  return { isSupporter: false };
}
