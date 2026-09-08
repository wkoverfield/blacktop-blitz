/**
 * Load the daily-synced NBA 2K rosters from blacktop's own CDN.
 *
 * Data lives under /public and is refreshed once a day by
 * .github/workflows/sync-players.yml, which hits nba2kapi's authenticated
 * bulk endpoints:
 *
 *   /games.json           edition index: [{ version, label, file, current?, capturedAt? }]
 *   /players.json         the current edition
 *   /players-<v>.json     one frozen file per archived edition (e.g. players-2k26.json)
 *
 * From the browser's perspective these are same-origin static file
 * fetches — no CORS, no API key, no per-user cost against any rate limit.
 *
 * Filtering happens entirely client-side after the one-time JSON load.
 * Each edition's array is cached for the page session, so back-to-back
 * drafts (and switching back to an edition already visited) are instant.
 */

const CURRENT_FILE = "/players.json";

let gamesCache = null;
let gamesInflight = null;

function fetchJson(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
    return res.json();
  });
}

/**
 * The edition list from /games.json, current edition first. Rejects when
 * the file is missing or malformed; callers fall back to the current
 * edition (single-file behaviour) in that case.
 */
export function getGames() {
  if (gamesCache) return Promise.resolve(gamesCache);
  if (gamesInflight) return gamesInflight;
  gamesInflight = fetchJson("/games.json")
    .then((games) => {
      if (!Array.isArray(games) || games.length === 0) {
        throw new Error("games.json is empty");
      }
      const valid = games.filter((g) => g && g.version && g.file);
      if (valid.length === 0) throw new Error("games.json has no usable editions");
      gamesCache = valid;
      gamesInflight = null;
      return valid;
    })
    .catch((err) => {
      gamesInflight = null;
      throw err;
    });
  return gamesInflight;
}

/** The edition entry to load for `version`: the match, else the current one. */
async function resolveGame(version) {
  let games;
  try {
    games = await getGames();
  } catch {
    return { version: null, file: CURRENT_FILE, current: true };
  }
  const current = games.find((g) => g.current) || games[0];
  const match = version ? games.find((g) => g.version === version) : null;
  return match || current;
}

// One raw cache per roster file; the normalized cache is keyed by file AND
// edition version, so a games.json failure (version null) cannot pin
// `game: null` onto the current file for the rest of the session.
const rawCache = new Map();
const rawInflight = new Map();
const normalizedCache = new Map();

function loadRoster(file) {
  if (rawCache.has(file)) return Promise.resolve(rawCache.get(file));
  if (rawInflight.has(file)) return rawInflight.get(file);
  const p = fetchJson(file)
    .then((players) => {
      rawCache.set(file, players);
      rawInflight.delete(file);
      return players;
    })
    .catch((err) => {
      rawInflight.delete(file);
      throw err;
    });
  rawInflight.set(file, p);
  return p;
}

/**
 * Kick off the roster fetch for `version` (default: current) without
 * awaiting it. Call from a top-level mount so the JSON is in flight while
 * the user fills out the draft form, landing in cache by the time they
 * submit.
 */
export function preloadPlayers(version) {
  getAllPlayers(version).catch(() => {
    // Best-effort prefetch — getAllPlayers() will surface any real error.
  });
}

/**
 * Map a raw record from a roster file to the shape blacktop's player cards
 * and query filters expect. `positions` (array) and `height` (raw string,
 * e.g. `6'10"`) are exposed directly for the advanced filters and card
 * stat rows; `playerMisc` keeps the joined legacy shape. `game` is the
 * edition version the record came from (null when the edition index is
 * unavailable) and `gameArchived` marks frozen editions so cards can drop
 * the live dossier link and label the edition.
 */
function normalize(p, game) {
  return {
    name: p.name,
    slug: p.slug,
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
    game: game.version,
    gameArchived: !game.current,
  };
}

/**
 * The full normalized roster for one edition. An unknown or missing
 * `version` resolves to the current edition. Filtering (era, overall,
 * positions, height, team, attribute rules) happens in the Query screen so
 * the live match count is computed against one in-memory array.
 *
 * @param {string} [version] edition version from /games.json, e.g. "2K26"
 * @returns {Promise<Array>} every player in blacktop's expected shape
 */
export async function getAllPlayers(version) {
  const game = await resolveGame(version);
  const all = await loadRoster(game.file);
  const key = `${game.file}|${game.version}`;
  const cached = normalizedCache.get(key);
  if (cached && cached.length === all.length) return cached;
  const normalized = all.map((p) => normalize(p, game));
  normalizedCache.set(key, normalized);
  return normalized;
}
