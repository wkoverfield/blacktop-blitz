/**
 * The remembered NBA 2K edition (Query screen GAME row), persisted per
 * device in localStorage. Values are edition version strings from
 * /games.json (e.g. "2K27"); the loader validates them against the live
 * edition list, so a stale value here simply falls back to the current
 * edition.
 *
 * `bb:gameFile` mirrors the pick as its roster file path (e.g.
 * "/players-2k26.json") for the inline preload script in index.html,
 * which runs before any module loads and cannot read games.json. It is
 * only set for archived editions; the current edition (or a cleared pick)
 * removes it so the preload falls back to /players.json.
 */

const STORAGE_KEY = "bb:game";
const FILE_KEY = "bb:gameFile";

export function readStoredGame() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function writeStoredGame(version, file) {
  try {
    if (version == null) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FILE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, version);
      if (file) {
        localStorage.setItem(FILE_KEY, file);
      } else {
        localStorage.removeItem(FILE_KEY);
      }
    }
  } catch {
    /* private-mode etc. — the choice just won't persist */
  }
}
