/**
 * Phase B / D10 — UI helpers for badge rarity rendering.
 *
 * The server (`convex/badges.ts`) normalizes legacy free-form rarity strings
 * into the strict enum below via `normalizeRarity()` before sending data to
 * the client. The UI then maps each tier to the corresponding glow / label.
 */

export const RARITY_TIERS = ["common", "rare", "epic", "legendary"] as const;
export type RarityTier = (typeof RARITY_TIERS)[number];

export function getRarityLabel(tier: RarityTier): string {
  switch (tier) {
    case "common":
      return "Commun";
    case "rare":
      return "Rare";
    case "epic":
      return "Épique";
    case "legendary":
      return "Légendaire";
  }
}

/**
 * Tailwind classes applied to an *earned* badge card to convey rarity.
 * - common  → no glow (plain card)
 * - rare    → soft blue ring + glow
 * - epic    → purple ring + stronger glow
 * - legendary → amber ring + pulse
 *
 * Returns class strings designed to compose with the base card. Common tier
 * returns an empty string so the layout doesn't shift between tiers.
 */
export function getRarityRingClass(tier: RarityTier): string {
  switch (tier) {
    case "common":
      return "";
    case "rare":
      return "ring-2 ring-blue-300/70 shadow-blue-200/50";
    case "epic":
      return "ring-2 ring-purple-400/70 shadow-purple-300/50";
    case "legendary":
      return "ring-2 ring-amber-400/80 shadow-amber-300/60 animate-pulse";
  }
}

/** Small chip color matching the rarity, e.g. for a "Rare" pill on the card. */
export function getRarityChipClass(tier: RarityTier): string {
  switch (tier) {
    case "common":
      return "bg-gray-100 text-gray-600";
    case "rare":
      return "bg-blue-100 text-blue-700";
    case "epic":
      return "bg-purple-100 text-purple-700";
    case "legendary":
      return "bg-amber-100 text-amber-700";
  }
}
