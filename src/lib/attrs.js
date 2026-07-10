/**
 * Attribute engine + gem-tier helpers for the retro redesign.
 *
 * Real per-player data ships in players.json since packet 004: `cats`
 * (six categories derived at sync time in scripts/sync-players.mjs),
 * `attributes` (35 raw 2K ratings), `badges` (tier counts), `wingspan`.
 * The deterministic name-hash placeholder survives ONLY as a fallback
 * for players missing category data (0 in the current dataset).
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
 * True when the player carries real sync-derived category ratings
 * (all six keys). Gates the card-back placeholder footnote.
 */
export function hasRealAttrs(player) {
  const c = player.cats;
  return !!c && ATTR_KEYS.every((k) => typeof c[k] === "number");
}

/**
 * Six category ratings for a player. Real `cats` from players.json when
 * present (the normal case); deterministic name-hash placeholder ONLY as
 * fallback for players without data. Placeholder values land in
 * [overall - 20, overall + 5], clamped to [25, 99]. Memoized: the query
 * screen calls this per player per keystroke.
 *
 * @param {{name: string, overall: number, cats?: object}} player
 * @returns {{ins:number,out:number,ply:number,ath:number,def:number,reb:number}}
 */
export function attrsFor(player) {
  if (hasRealAttrs(player)) return player.cats;

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

/* ------------------------------------------------------------------ */
/* Advanced-filter rule vocabulary (packet 004)                        */
/* ------------------------------------------------------------------ */

/**
 * Raw 2K attribute labels, grouped the way 2K groups them. Rebounding
 * attributes live under DEFENSE (2K's own "Defense/Rebounding" group).
 * Keys match players.json `attributes` verbatim.
 */
const RAW_ATTR_GROUPS = [
  {
    label: "FINISHING",
    attrs: {
      closeShot: "CLOSE SHOT",
      layup: "LAYUP",
      drivingDunk: "DRIVING DUNK",
      standingDunk: "STANDING DUNK",
      postControl: "POST CONTROL",
      postHook: "POST HOOK",
      postFade: "POST FADE",
      drawFoul: "DRAW FOUL",
      hands: "HANDS",
    },
  },
  {
    label: "SHOOTING",
    attrs: {
      midRangeShot: "MID-RANGE SHOT",
      threePointShot: "THREE-POINT SHOT",
      freeThrow: "FREE THROW",
      shotIQ: "SHOT IQ",
      offensiveConsistency: "OFF. CONSISTENCY",
    },
  },
  {
    label: "PLAYMAKING",
    attrs: {
      passAccuracy: "PASS ACCURACY",
      ballHandle: "BALL HANDLE",
      speedWithBall: "SPEED WITH BALL",
      passIQ: "PASS IQ",
      passVision: "PASS VISION",
    },
  },
  {
    label: "DEFENSE",
    attrs: {
      interiorDefense: "INTERIOR DEFENSE",
      perimeterDefense: "PERIMETER DEFENSE",
      steal: "STEAL",
      block: "BLOCK",
      helpDefenseIQ: "HELP DEFENSE IQ",
      passPerception: "PASS PERCEPTION",
      defensiveConsistency: "DEF. CONSISTENCY",
      offensiveRebound: "OFFENSIVE REBOUND",
      defensiveRebound: "DEFENSIVE REBOUND",
    },
  },
  {
    label: "ATHLETICISM",
    attrs: {
      speed: "SPEED",
      agility: "AGILITY",
      strength: "STRENGTH",
      vertical: "VERTICAL",
      stamina: "STAMINA",
      hustle: "HUSTLE",
      overallDurability: "OVERALL DURABILITY",
    },
  },
];

/**
 * Everything the attribute-rule <select> offers, as optgroups:
 * the six derived categories, the 35 raw attributes, badge counts,
 * and physicals. Option values are the keys ruleValue() resolves.
 */
export const FILTER_GROUPS = [
  {
    label: "CATEGORIES",
    options: ATTR_KEYS.map((k) => ({ value: k, label: ATTR_NAMES[k] })),
  },
  ...RAW_ATTR_GROUPS.map((g) => ({
    label: g.label,
    options: Object.entries(g.attrs).map(([value, label]) => ({
      value,
      label,
    })),
  })),
  {
    label: "BADGES",
    options: [
      { value: "badgeHof", label: "HALL OF FAME BADGES" },
      { value: "badgeTotal", label: "TOTAL BADGES" },
    ],
  },
  {
    label: "PHYSICALS",
    options: [{ value: "wingspan", label: "WINGSPAN (INCHES)" }],
  },
];

const CAT_KEYS = new Set(ATTR_KEYS);

/**
 * Resolve any rule key (category / raw attribute / badge count /
 * wingspan-in-inches) to a numeric value for a player. Returns null when
 * the player lacks the data — the filter then excludes the player, same
 * contract as the min-height filter.
 */
export function ruleValue(player, key) {
  if (CAT_KEYS.has(key)) return attrsFor(player)[key];
  if (key === "badgeHof") return player.badges?.hallOfFame ?? null;
  if (key === "badgeTotal") return player.badges?.total ?? null;
  if (key === "wingspan") return heightToInches(player.wingspan);
  return player.attributes?.[key] ?? null;
}
