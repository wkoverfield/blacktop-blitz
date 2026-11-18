/**
 * State for the feedback prompt shown to people who leave several 1v1
 * drafts in a row without finishing one.
 *
 * The exit count lives in sessionStorage (per tab, survives reloads). Once
 * the prompt has been followed it is retired for good via localStorage.
 * Every accessor tolerates storage being unavailable (private windows,
 * blocked site data): the prompt then simply never shows.
 */
const EXITS_KEY = "bb.oneVOneExits";
const SHOWN_KEY = "bb.rollPromptShown";
const DONE_KEY = "bb.rollPromptDone";

/** 1v1 drafts that must be exited in one session before the prompt shows. */
export const ROLL_PROMPT_THRESHOLD = 3;

function read(storage, key) {
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
}

function write(storage, key, value) {
  try {
    window[storage].setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

/** Record one exited 1v1 draft; returns the session's running count. */
export function recordOneVOneExit() {
  const next = (Number(read("sessionStorage", EXITS_KEY)) || 0) + 1;
  write("sessionStorage", EXITS_KEY, String(next));
  return next;
}

export function shouldShowRollPrompt() {
  if (read("localStorage", DONE_KEY)) return false;
  return (
    (Number(read("sessionStorage", EXITS_KEY)) || 0) >= ROLL_PROMPT_THRESHOLD
  );
}

/** True the first time it is called in a session, false afterwards. */
export function claimRollPromptShown() {
  if (read("sessionStorage", SHOWN_KEY)) return false;
  write("sessionStorage", SHOWN_KEY, "1");
  return true;
}

export function retireRollPrompt() {
  write("localStorage", DONE_KEY, "1");
}
