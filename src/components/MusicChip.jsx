import React, { useEffect, useState } from "react";
import {
  MUSIC_CHANGE_EVENT,
  getMusicState,
  cycleMusic,
} from "../lib/chiptune";

/**
 * ♪ music chip — packet 003 (+ multi-track revision). Same notch idiom as
 * the clock chip; rendered by ClockChip's top-right chip row so it appears
 * on every screen the clock does (hides on Draft with it, while playback
 * continues).
 *
 * Click/Enter CYCLES like the clock chip: COURTSIDE → FAST BREAK →
 * MOONLIGHT → OFF → COURTSIDE. State persists in localStorage
 * ("blacktop-blitz-music"; legacy "on" maps to track 0). Before the first
 * user gesture the chip shows the pending track — playback starts on the
 * first gesture via chiptune.attachAutoplayGesture(). OFF drops to the
 * muted secondary color (#8f83ad, amendment 4).
 *
 * data-kbnav 9000: the chips row sits after every screen's content rows in
 * the arrow-key ring (rows wrap, so Up from the top row lands here).
 *
 * data-music-chip: the autoplay first-gesture listener skips presses on
 * this chip so a "turn it off" press never blips audio first.
 */
export default function MusicChip() {
  const [state, setState] = useState(getMusicState);

  useEffect(() => {
    const sync = () => setState(getMusicState());
    window.addEventListener(MUSIC_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MUSIC_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <button
      type="button"
      data-music-chip
      data-kbnav="9000"
      onClick={cycleMusic}
      aria-pressed={!state.off}
      aria-label={
        state.off ? "Turn music on" : `Music: ${state.name}. Change track`
      }
      className={`select-none font-press text-[8px] sm:text-[10px] bg-[rgba(23,13,42,0.75)] px-[10px] py-2 sm:px-[14px] sm:py-[10px] shadow-[0_0_0_3px_rgba(253,243,221,0.5)] hover:shadow-[0_0_0_3px_#ffb066] ${
        state.off ? "text-muted" : "text-cream"
      }`}
    >
      ♪<span className="hidden sm:inline"> {state.name}</span>
    </button>
  );
}
