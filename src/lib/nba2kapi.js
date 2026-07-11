/**
 * Load the daily-synced NBA 2K roster from blacktop's own CDN.
 *
 * Data lives at /public/players.json and is refreshed once a day by
 * .github/workflows/sync-players.yml, which hits nba2kapi's authenticated
 * /api/players/bulk endpoint. From the browser's perspective this is just
 * a same-origin static file fetch — no CORS, no API key, no per-user cost
 * against any rate limit.
 *
 * Filtering happens entirely client-side after the one-time JSON load.
 * The loaded array is cached for the page session, so back-to-back drafts
 * are instant.
 */

let cache = null;
let inflight = null;

async function loadAllPlayers() {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = fetch("/players.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load /players.json (HTTP ${res.status})`);
      }
      return res.json();
    })
    .then((players) => {
      cache = players;
      inflight = null;
      return players;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}

/**
 * Kick off the players.json fetch without awaiting it. Call from a top-level
 * mount so the JSON is in flight while the user fills out the draft form,
 * landing in cache by the time they submit.
 */
export function preloadPlayers() {
  loadAllPlayers().catch(() => {
    // Best-effort prefetch — fetchPlayers() will surface any real error.
  });
}

/**
 * Map a raw record from players.json to the shape blacktop's player cards
 * and query filters expect. `positions` (array) and `height` (raw string,
 * e.g. `6'10"`) are exposed directly for the advanced filters and card
 * stat rows; `playerMisc` keeps the joined legacy shape.
 */
function normalize(p) {
  return {
    name: p.name,
    team: p.team,
    overall: p.overall,
    type: p.teamType,
    teamImg: p.teamImg,
    playerImg: p.playerImage,
    positions: p.positions || [],
    height: p.height || "",
    playerMisc: [...(p.positions || []), p.height].filter(Boolean),
    // Real attribute data (packet 004): `cats` = six sync-derived
    // categories, `attributes` = 35 raw 2K ratings, `badges` = tier
    // counts only. All optional — attrs.js hash-falls-back when absent.
    cats: p.cats,
    attributes: p.attributes,
    badges: p.badges,
    weight: p.weight,
    wingspan: p.wingspan,
    college: p.college || "",
  };
}

let normalizedCache = null;

/**
 * The full normalized roster. Filtering (era, overall, positions, height,
 * team, attribute rules) happens in the Query screen so the live match
 * count is computed against one in-memory array.
 *
 * @returns {Promise<Array>} every player in blacktop's expected shape
 */
export async function getAllPlayers() {
  const all = await loadAllPlayers();
  if (!normalizedCache || normalizedCache.length !== all.length) {
    normalizedCache = all.map(normalize);
  }
  return normalizedCache;
}
