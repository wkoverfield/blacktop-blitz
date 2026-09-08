/**
 * The remembered NBA 2K edition (Query screen GAME row), persisted per
 * device in localStorage. Values are edition version strings from
 * /games.json (e.g. "2K27"); the loader validates them against the live
 * edition list, so a stale value here simply falls back to the current
 * edition.
 */

const STORAGE_KEY = "bb:game";

export function readStoredGame() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function writeStoredGame(version) {
  try {
    if (version == null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, version);
    }
  } catch {
    /* private-mode etc. — the choice just won't persist */
  }
}
