/**
 * Placeholder attribute engine + gem-tier helpers for the retro redesign.
 *
 * Real per-player category ratings arrive with a future nba2kapi sync
 * (see "Data Requirements" in docs/context/design-handoff-retro.md).
 * Until then, card backs / TOP SKILLS / attribute filters run on a
 * deterministic hash of the player's name (the prototype's attrsFor
 * semantics): same player always gets the same six values, clustered
 * just below their overall.
 */

/** Six category ratings, in card-back row order. `out` = outside scoring. */
export const ATTR_KEYS = ["ins", "out", "ply", "ath", "def", "reb"];

/** Chip / card-back abbreviations (spec: INS, 3PT, PLY, ATH, DEF, REB). */
export const ATTR_ABBREVS = {
  ins: "INS",
  out: "3PT",
  ply: "PLY",
  ath: "ATH",
  def: "DEF",
  reb: "REB",
};

/** Readable names for the advanced-filter attribute select. */
export const ATTR_NAMES = {
  ins: "INSIDE",
  out: "OUTSIDE",
  ply: "PLAYMAKING",
  ath: "ATHLETICISM",
  def: "DEFENDING",
  reb: "REBOUNDING",
};

/* FNV-1a — tiny, stable, good enough spread for placeholder ratings. */
function hashName(name) {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const attrsCache = new Map();

/**
 * Deterministic six-category placeholder ratings for a player.
 * Each value lands in [overall - 20, overall + 5], clamped to [25, 99].
 * Memoized: the query screen calls this per player per keystroke.
 *
 * @param {{name: string, overall: number}} player
 * @returns {{ins:number,out:number,ply:number,ath:number,def:number,reb:number}}
 */
export function attrsFor(player) {
  const key = `${player.name}|${player.overall}`;
  const hit = attrsCache.get(key);
  if (hit) return hit;

  const h = hashName(player.name);
  const out = {};
  ATTR_KEYS.forEach((k, i) => {
    const r = (h >>> (i * 5)) & 31; // 5 independent-ish bits per category
    const offset = (r % 26) - 20; // -20 .. +5
    out[k] = Math.max(25, Math.min(99, player.overall + offset));
  });
  attrsCache.set(key, out);
  return out;
}

/**
 * The player's 3 best categories, best first: [key, value] pairs.
 * Ties break in ATTR_KEYS order (deterministic).
 */
export function topSkills(player) {
  const attrs = attrsFor(player);
  return ATTR_KEYS.map((k) => [k, attrs[k]])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

/**
 * Gem-tier ladder — mirrors the existing overall→CSS-class mapping in
 * src/index.css (classes kept unchanged). `accent` is the readable accent
 * hex used for TIER values, OVR bars, and per-value bracket coloring.
 */
export const TIERS = [
  { min: 99, key: "dark-matter", label: "DARK MATTER", accent: "#b297ff" },
  { min: 97, key: "galaxy-opal", label: "GALAXY OPAL", accent: "#f9a205" },
  { min: 95, key: "pink-diamond", label: "PINK DIAMOND", accent: "#ff96df" },
  { min: 92, key: "diamond", label: "DIAMOND", accent: "#00aace" },
  { min: 90, key: "amethyst", label: "AMETHYST", accent: "#a51fff" },
  { min: 87, key: "ruby", label: "RUBY", accent: "#ff4d4d" },
  { min: 84, key: "sapphire", label: "SAPPHIRE", accent: "#5b7bff" },
  { min: 80, key: "emerald", label: "EMERALD", accent: "#05c715" },
  { min: 75, key: "gold", label: "GOLD", accent: "#d6bb5c" },
  { min: 70, key: "silver", label: "SILVER", accent: "#a2a2a2" },
  { min: 0, key: "bronze", label: "BRONZE", accent: "#cc9900" },
];

/** Tier descriptor ({min,key,label,accent}) for an overall rating. */
export function tierFor(overall) {
  return TIERS.find((t) => overall >= t.min) || TIERS[TIERS.length - 1];
}

/** Accent color for a single attribute value's own tier bracket. */
export function bracketColor(value) {
  return tierFor(value).accent;
}

/**
 * Parse a height string like `6'10"` or `7'0"` to total inches.
 * Returns null when unparseable so filters can skip the player gracefully.
 */
export function heightToInches(height) {
  const m = /(\d+)\s*'\s*(\d+)/.exec(height || "");
  if (!m) return null;
  return Number(m[1]) * 12 + Number(m[2]);
}
