#!/usr/bin/env node
/**
 * Daily sync of the NBA 2K roster from nba2kapi → public/players.json.
 *
 * Run by .github/workflows/sync-players.yml on a daily cron. Hits the
 * authenticated /api/players/bulk endpoint once and writes a trimmed
 * static file the React app loads from blacktop's own CDN.
 *
 * Bandwidth optimization: stores the last response's ETag in
 * .github/state/players.etag and sends it as If-None-Match on the next
 * run. ~80% of days return 304 with an empty body since the underlying
 * data is scraped biweekly.
 *
 * Run locally:
 *   NBA2KAPI_KEY="2k_..." node scripts/sync-players.mjs
 *
 * Offline / seeding (reads a local nba2kapi dump instead of the network;
 * accepts {players:[...]}, {data:[...]}, or a bare array):
 *   node scripts/sync-players.mjs --from-dump ~/path/to/nba2k-all-players.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const API_URL = "https://api.nba2kapi.com/api/players/bulk";
const OUT_FILE = "public/players.json";
const ETAG_FILE = ".github/state/players.etag";

/**
 * Six card-back categories, derived at sync time as the rounded mean of
 * each group (only from keys actually present on the player). Groups are
 * the packet-004 contract — keep in sync with docs/work-packets/004.
 */
const CAT_GROUPS = {
  ins: [
    "closeShot",
    "layup",
    "drivingDunk",
    "standingDunk",
    "postControl",
    "postHook",
    "postFade",
    "drawFoul",
    "hands",
  ],
  out: [
    "midRangeShot",
    "threePointShot",
    "freeThrow",
    "shotIQ",
    "offensiveConsistency",
  ],
  ply: ["passAccuracy", "ballHandle", "speedWithBall", "passIQ", "passVision"],
  def: [
    "interiorDefense",
    "perimeterDefense",
    "steal",
    "block",
    "helpDefenseIQ",
    "passPerception",
    "defensiveConsistency",
  ],
  ath: [
    "speed",
    "agility",
    "strength",
    "vertical",
    "stamina",
    "hustle",
    "overallDurability",
  ],
  reb: ["offensiveRebound", "defensiveRebound"],
};

/**
 * Derive the six categories from a raw attribute record. Returns null when
 * any group has zero usable keys (the app then falls back to its
 * deterministic hash placeholder for that player).
 */
function deriveCats(attributes) {
  if (!attributes || typeof attributes !== "object") return null;
  const cats = {};
  for (const [cat, keys] of Object.entries(CAT_GROUPS)) {
    const values = keys
      .map((k) => attributes[k])
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    if (values.length === 0) return null;
    cats[cat] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }
  return cats;
}

/** Badge counts + three highest-tier names, derived from the real list. */
function badgeCounts(badges) {
  if (!badges || typeof badges !== "object") return null;
  const list = Array.isArray(badges.list) ? badges.list : [];
  const tiers = {
    "Legendary": "legendary",
    "Hall of Fame": "hallOfFame",
    "Gold": "gold",
    "Silver": "silver",
    "Bronze": "bronze",
  };
  const derived = { legendary: 0, hallOfFame: 0, gold: 0, silver: 0, bronze: 0 };
  for (const badge of list) {
    const key = tiers[badge.tier];
    if (key) derived[key] += 1;
  }
  const rank = { Legendary: 0, "Hall of Fame": 1, Gold: 2, Silver: 3, Bronze: 4 };
  const top = list
    .filter((badge) => badge?.name && rank[badge.tier] !== undefined)
    .slice()
    .sort((a, b) => rank[a.tier] - rank[b.tier] || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map(({ name, tier }) => ({ name, tier }));
  const useDerived = list.length > 0;
  return {
    legendary: useDerived ? derived.legendary : badges.legendary ?? 0,
    hallOfFame: useDerived ? derived.hallOfFame : badges.hallOfFame ?? 0,
    gold: useDerived ? derived.gold : badges.gold ?? 0,
    silver: useDerived ? derived.silver : badges.silver ?? 0,
    bronze: useDerived ? derived.bronze : badges.bronze ?? 0,
    total: useDerived ? list.length : badges.total ?? 0,
    ...(top.length > 0 ? { top } : {}),
  };
}

// ---------------------------------------------------------------------------
// Acquire the raw player array: local dump (--from-dump <path>) or live API.
// ---------------------------------------------------------------------------

const dumpFlag = process.argv.indexOf("--from-dump");
const dumpPath = dumpFlag !== -1 ? process.argv[dumpFlag + 1] : null;
if (dumpFlag !== -1 && !dumpPath) {
  console.error("ERROR: --from-dump requires a path argument.");
  process.exit(1);
}

let raw; // array of full player docs
let etag = null;

if (dumpPath) {
  console.log(`Reading local dump ${dumpPath}...`);
  const body = JSON.parse(readFileSync(dumpPath, "utf8"));
  raw = Array.isArray(body) ? body : body.players || body.data;
  if (!Array.isArray(raw)) {
    console.error("Unexpected dump shape: expected an array, {players:[...]}, or {data:[...]}.");
    process.exit(1);
  }
  console.log(`✓ Read ${raw.length} players from dump`);
} else {
  const KEY = process.env.NBA2KAPI_KEY;
  if (!KEY) {
    console.error("ERROR: NBA2KAPI_KEY env var not set.");
    console.error('Locally: NBA2KAPI_KEY="2k_..." node scripts/sync-players.mjs');
    console.error("CI: configured as a repository secret of the same name.");
    console.error("Offline: node scripts/sync-players.mjs --from-dump <path>");
    process.exit(1);
  }

  let previousEtag = null;
  if (existsSync(ETAG_FILE)) {
    previousEtag = readFileSync(ETAG_FILE, "utf8").trim();
    console.log(`Previous ETag: ${previousEtag}`);
  }

  const headers = { "X-API-Key": KEY };
  if (previousEtag) headers["If-None-Match"] = previousEtag;

  console.log(`Fetching ${API_URL}...`);
  const res = await fetch(API_URL, { headers });

  if (res.status === 304) {
    console.log("✓ 304 Not Modified — roster unchanged since last sync. Done.");
    process.exit(0);
  }

  if (!res.ok) {
    console.error(`API request failed: HTTP ${res.status}`);
    // Don't log the raw response body — if the upstream ever echoes the API key
    // (rare but seen in poorly-designed services), GitHub's secret masking only
    // catches exact string matches and would miss URL-encoded or partial echoes.
    console.error("Response body suppressed to avoid leaking secrets in CI logs.");
    process.exit(1);
  }

  const body = await res.json();
  if (!body.success || !Array.isArray(body.data)) {
    console.error("Unexpected API response shape:", body);
    process.exit(1);
  }
  raw = body.data;
  etag = res.headers.get("etag");
  console.log(`✓ Fetched ${raw.length} players`);
}

// ---------------------------------------------------------------------------
// Sanity guards — bail before clobbering the live file.
// ---------------------------------------------------------------------------

// Floor — if the upstream ever returns a much smaller roster than expected
// (data outage, partial scrape, schema regression), refuse. Current roster
// is ~1,872 players across all teamTypes; 500 is well below that floor but
// well above any single teamType.
const MIN_EXPECTED = 500;
if (raw.length < MIN_EXPECTED) {
  console.error(
    `Suspiciously small roster (${raw.length} < ${MIN_EXPECTED} expected). ` +
      `Refusing to overwrite ${OUT_FILE}. Investigate the upstream API before forcing a sync.`
  );
  process.exit(1);
}

// Attribute coverage — if the upstream schema regresses and most players
// arrive without their flat attribute record, refuse rather than shipping
// a roster full of placeholder card backs. Current coverage: ~100%.
const withAttrs = raw.filter(
  (p) => p.attributes && Object.keys(p.attributes).length > 0
).length;
const coverage = withAttrs / raw.length;
if (coverage < 0.9) {
  console.error(
    `Attribute coverage too low (${withAttrs}/${raw.length} = ` +
      `${(coverage * 100).toFixed(1)}% < 90%). Upstream schema regression? ` +
      `Refusing to overwrite ${OUT_FILE}.`
  );
  process.exit(1);
}
console.log(`✓ Attribute coverage ${withAttrs}/${raw.length} (${(coverage * 100).toFixed(1)}%)`);

// ---------------------------------------------------------------------------
// Projection — trim each player to the fields blacktop uses.
// ---------------------------------------------------------------------------

const trimmed = raw
  .map((p) => {
    const out = {
      name: p.name,
      slug: p.slug,
      team: p.team,
      teamType: p.teamType,
      overall: p.overall,
      teamImg: p.teamImg,
      playerImage: p.playerImage,
      positions: p.positions || [],
      height: p.height || null,
    };
    if (p.weight) out.weight = p.weight;
    if (p.wingspan) out.wingspan = p.wingspan;
    if (p.college) out.college = p.college;
    if (p.attributes && Object.keys(p.attributes).length > 0) {
      out.attributes = p.attributes;
      const cats = deriveCats(p.attributes);
      if (cats) out.cats = cats;
    }
    const badges = badgeCounts(p.badges);
    if (badges) out.badges = badges;
    return out;
  })
  // Stable sort for deterministic file output → no spurious diffs.
  .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));

// Minified on purpose: with 35 raw attributes per player the pretty-printed
// file balloons; the CDN gzips the wire size down regardless.
const json = JSON.stringify(trimmed) + "\n";
writeFileSync(OUT_FILE, json);
console.log(
  `✓ Wrote ${trimmed.length} players to ${OUT_FILE} ` +
    `(${json.length} bytes ≈ ${Math.round(json.length / 1024)} KB raw, minified)`
);

if (etag) {
  mkdirSync(dirname(ETAG_FILE), { recursive: true });
  writeFileSync(ETAG_FILE, etag + "\n");
  console.log(`✓ Saved ETag to ${ETAG_FILE}`);
}
