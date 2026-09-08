#!/usr/bin/env node
/**
 * Daily sync of the NBA 2K rosters from nba2kapi → public/.
 *
 * Run by .github/workflows/sync-players.yml on a daily cron. Fetches the
 * edition list from /api/versions, then one authenticated bulk endpoint
 * per edition, and writes trimmed static files the React app loads from
 * blacktop's own CDN:
 *
 *   public/players.json         current edition (unchanged path)
 *   public/players-<v>.json     one per archived edition, e.g. players-2k26.json
 *   public/games.json           edition index the app's GAME row reads
 *
 * Bandwidth optimization: stores each response's ETag under .github/state/
 * (players.etag for the current edition, players-<v>.etag per archived
 * edition) and sends it as If-None-Match on the next run. Archived editions
 * are frozen upstream, so they return 304 on almost every run; the current
 * edition returns 304 ~80% of days since the underlying data is scraped
 * biweekly.
 *
 * Run locally:
 *   NBA2KAPI_KEY="2k_..." node scripts/sync-players.mjs
 *
 * Offline / seeding (reads a local nba2kapi dump instead of the network;
 * accepts {players:[...]}, {data:[...]}, or a bare array). Writes
 * public/players.json, or public/players-<v>.json with --edition:
 *   node scripts/sync-players.mjs --from-dump ~/path/to/nba2k-all-players.json
 *   node scripts/sync-players.mjs --from-dump ~/path/to/2k26.json --edition 2K26
 * Dump mode never touches games.json.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";

const API_BASE = "https://api.nba2kapi.com/api";
const VERSIONS_URL = `${API_BASE}/versions`;
const CURRENT_BULK_URL = `${API_BASE}/players/bulk`;
const GAMES_FILE = "public/games.json";
const STATE_DIR = ".github/state";

/** File paths for an edition. The current edition keeps the legacy names. */
function pathsFor(version, isCurrent) {
  if (isCurrent) {
    return { out: "public/players.json", etag: `${STATE_DIR}/players.etag` };
  }
  const v = String(version).toLowerCase();
  return { out: `public/players-${v}.json`, etag: `${STATE_DIR}/players-${v}.etag` };
}

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

const BADGE_RANK = { Legendary: 0, "Hall of Fame": 1, Gold: 2, Silver: 3, Bronze: 4 };

/**
 * Badge counts + three highest-tier names. Two upstream shapes:
 *  - the live edition carries `badges.list` (full badge records), from
 *    which counts and `top` are derived;
 *  - archived editions carry counts plus `top` only (already projected),
 *    which are passed through as given.
 */
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
  const useDerived = list.length > 0;
  const top = useDerived
    ? list
        .filter((badge) => badge?.name && BADGE_RANK[badge.tier] !== undefined)
        .slice()
        .sort((a, b) => BADGE_RANK[a.tier] - BADGE_RANK[b.tier] || a.name.localeCompare(b.name))
        .slice(0, 3)
        .map(({ name, tier }) => ({ name, tier }))
    : (Array.isArray(badges.top) ? badges.top : [])
        .filter((badge) => badge?.name && BADGE_RANK[badge.tier] !== undefined)
        .slice(0, 3)
        .map(({ name, tier }) => ({ name, tier }));
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
// Sanity guards — refuse before clobbering a live file. They throw; the
// caller decides whether that is fatal (current edition, dump mode) or a
// skip (archived editions, whose previous file stays in place).
// ---------------------------------------------------------------------------

function guard(raw, outFile) {
  // Floor — if the upstream ever returns a much smaller roster than expected
  // (data outage, partial scrape, schema regression), refuse. Every edition
  // so far is ~1,860-1,890 players across all teamTypes; 500 is well below
  // that floor but well above any single teamType.
  const MIN_EXPECTED = 500;
  if (raw.length < MIN_EXPECTED) {
    throw new Error(
      `Suspiciously small roster (${raw.length} < ${MIN_EXPECTED} expected). ` +
        `Refusing to overwrite ${outFile}. Investigate the upstream API before forcing a sync.`
    );
  }

  // Attribute coverage — if the upstream schema regresses and most players
  // arrive without their flat attribute record, refuse rather than shipping
  // a roster full of placeholder card backs. Current coverage: ~100%.
  const withAttrs = raw.filter(
    (p) => p.attributes && Object.keys(p.attributes).length > 0
  ).length;
  const coverage = withAttrs / raw.length;
  if (coverage < 0.9) {
    throw new Error(
      `Attribute coverage too low (${withAttrs}/${raw.length} = ` +
        `${(coverage * 100).toFixed(1)}% < 90%). Upstream schema regression? ` +
        `Refusing to overwrite ${outFile}.`
    );
  }
  console.log(`✓ Attribute coverage ${withAttrs}/${raw.length} (${(coverage * 100).toFixed(1)}%)`);
}

// ---------------------------------------------------------------------------
// Projection — trim each player to the fields blacktop uses.
// ---------------------------------------------------------------------------

function project(raw) {
  return (
    raw
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
      .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name))
  );
}

function writeRoster(raw, outFile) {
  guard(raw, outFile);
  const trimmed = project(raw);
  // Minified on purpose: with 35 raw attributes per player the pretty-printed
  // file balloons; the CDN gzips the wire size down regardless.
  const json = JSON.stringify(trimmed) + "\n";
  writeFileSync(outFile, json);
  console.log(
    `✓ Wrote ${trimmed.length} players to ${outFile} ` +
      `(${json.length} bytes ≈ ${Math.round(json.length / 1024)} KB raw, minified)`
  );
}

function writeEtag(etagFile, etag) {
  mkdirSync(dirname(etagFile), { recursive: true });
  writeFileSync(etagFile, etag + "\n");
  console.log(`✓ Saved ETag to ${etagFile}`);
}

// ---------------------------------------------------------------------------
// Acquire raw player arrays: local dump (--from-dump <path>) or live API.
// ---------------------------------------------------------------------------

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) {
    console.error(`ERROR: ${flag} requires an argument.`);
    process.exit(1);
  }
  return value;
}

const dumpPath = argValue("--from-dump");
const dumpEdition = argValue("--edition");

if (dumpPath) {
  console.log(`Reading local dump ${dumpPath}...`);
  const body = JSON.parse(readFileSync(dumpPath, "utf8"));
  const raw = Array.isArray(body) ? body : body.players || body.data;
  if (!Array.isArray(raw)) {
    console.error("Unexpected dump shape: expected an array, {players:[...]}, or {data:[...]}.");
    process.exit(1);
  }
  console.log(`✓ Read ${raw.length} players from dump`);
  try {
    writeRoster(raw, pathsFor(dumpEdition, !dumpEdition).out);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  process.exit(0);
}

const KEY = process.env.NBA2KAPI_KEY;
if (!KEY) {
  console.error("ERROR: NBA2KAPI_KEY env var not set.");
  console.error('Locally: NBA2KAPI_KEY="2k_..." node scripts/sync-players.mjs');
  console.error("CI: configured as a repository secret of the same name.");
  console.error("Offline: node scripts/sync-players.mjs --from-dump <path>");
  process.exit(1);
}

/**
 * Fetch one edition's bulk roster with If-None-Match. Resolves to null on
 * 304 (file on disk is already current), otherwise { raw, etag }. Throws on
 * an HTTP error or an unexpected body; the caller decides whether that is
 * fatal.
 */
async function fetchBulk(url, etagFile) {
  let previousEtag = null;
  if (existsSync(etagFile)) {
    previousEtag = readFileSync(etagFile, "utf8").trim();
    console.log(`Previous ETag: ${previousEtag}`);
  }

  const headers = { "X-API-Key": KEY };
  if (previousEtag) headers["If-None-Match"] = previousEtag;

  console.log(`Fetching ${url}...`);
  const res = await fetch(url, { headers });

  if (res.status === 304) {
    console.log("✓ 304 Not Modified — roster unchanged since last sync.");
    return null;
  }

  if (!res.ok) {
    // Don't log the raw response body — if the upstream ever echoes the API key
    // (rare but seen in poorly-designed services), GitHub's secret masking only
    // catches exact string matches and would miss URL-encoded or partial echoes.
    throw new Error(
      `API request failed: HTTP ${res.status} (response body suppressed to avoid leaking secrets in CI logs)`
    );
  }

  const body = await res.json();
  if (!body.success || !Array.isArray(body.data)) {
    throw new Error(
      `Unexpected API response shape (success=${body?.success}, data=${Array.isArray(body?.data) ? "array" : typeof body?.data})`
    );
  }
  console.log(`✓ Fetched ${body.data.length} players`);
  return { raw: body.data, etag: res.headers.get("etag") };
}

/**
 * Edition list from /api/versions (public, no key). A failure here is not
 * fatal: the current edition still syncs through the legacy endpoint and
 * games.json is left as it was.
 */
async function fetchVersions() {
  console.log(`Fetching ${VERSIONS_URL}...`);
  try {
    const res = await fetch(VERSIONS_URL);
    if (!res.ok) {
      console.warn(`⚠ /api/versions returned HTTP ${res.status}; syncing the current edition only.`);
      return null;
    }
    const body = await res.json();
    if (!body.success || !Array.isArray(body.data) || body.data.length === 0) {
      console.warn("⚠ /api/versions returned an unexpected shape; syncing the current edition only.");
      return null;
    }
    console.log(`✓ ${body.data.length} editions listed (current: ${body.meta?.current ?? "?"})`);
    return body.data;
  } catch (err) {
    console.warn(`⚠ /api/versions unreachable (${err.message}); syncing the current edition only.`);
    return null;
  }
}

const versions = await fetchVersions();

// Current edition: legacy endpoint, legacy file names, unchanged behaviour.
// Any failure here is fatal: the current roster is the one every visitor
// loads.
{
  const { out, etag } = pathsFor(null, true);
  try {
    const result = await fetchBulk(CURRENT_BULK_URL, etag);
    if (result) {
      writeRoster(result.raw, out);
      if (result.etag) writeEtag(etag, result.etag);
    }
  } catch (err) {
    console.error(`✗ Current edition sync failed: ${err.message}`);
    process.exit(1);
  }
}

if (versions) {
  // Newest archived edition first, e.g. 2K26 before 2K25.
  const archived = versions
    .filter((v) => v.status === "archived" && v.gameVersion)
    .sort((a, b) => String(b.gameVersion).localeCompare(String(a.gameVersion), "en", { numeric: true }));

  // Archived editions are best-effort: a failed or undersized fetch skips
  // that edition (its previous file, if any, stays in place) and never
  // blocks the current edition's commit.
  const skipped = [];
  for (const edition of archived) {
    const v = edition.gameVersion;
    const { out, etag } = pathsFor(v, false);
    const url = `${API_BASE}/versions/${encodeURIComponent(v)}/players/bulk`;
    try {
      const result = await fetchBulk(url, etag);
      if (result) {
        writeRoster(result.raw, out);
        if (result.etag) writeEtag(etag, result.etag);
      } else if (!existsSync(out)) {
        // A 304 with no file on disk means the etag state outlived the file.
        // Drop the etag so the next run refetches instead of skipping forever.
        if (existsSync(etag)) unlinkSync(etag);
        throw new Error(`ETag says ${out} is current but the file is missing; etag removed, next run refetches`);
      }
    } catch (err) {
      console.warn(`⚠ Skipping archived edition ${v}: ${err.message}`);
      skipped.push(v);
    }
  }
  if (skipped.length > 0) {
    console.warn(`⚠ Archived editions skipped this run: ${skipped.join(", ")}`);
    // GitHub Actions annotation so a green run still surfaces the skip.
    console.log(`::warning::Archived editions skipped: ${skipped.join(", ")}`);
  }

  // games.json only lists an archived edition whose file exists on disk after
  // the loop (a 304 with the file present counts), so the app never offers
  // an edition it cannot load.
  const listed = archived.filter((v) => existsSync(pathsFor(v.gameVersion, false).out));
  const unlisted = archived.filter((v) => !listed.includes(v)).map((v) => v.gameVersion);
  if (unlisted.length > 0) {
    console.warn(`⚠ Left out of ${GAMES_FILE} (no roster file on disk): ${unlisted.join(", ")}`);
    console.log(`::warning::Editions left out of ${GAMES_FILE}: ${unlisted.join(", ")}`);
  }

  const current = versions.find((v) => v.status === "current") || versions[0];
  const games = [
    {
      version: current.gameVersion,
      label: current.label || `NBA ${current.gameVersion}`,
      file: "/" + pathsFor(null, true).out.replace(/^public\//, ""),
      current: true,
    },
    ...listed.map((v) => ({
      version: v.gameVersion,
      label: v.label || `NBA ${v.gameVersion}`,
      file: "/" + pathsFor(v.gameVersion, false).out.replace(/^public\//, ""),
      ...(v.capturedAt ? { capturedAt: v.capturedAt } : {}),
    })),
  ];
  writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2) + "\n");
  console.log(`✓ Wrote ${games.length} editions to ${GAMES_FILE}`);
}

console.log("Done.");
