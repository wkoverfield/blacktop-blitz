import React, { useEffect, useState } from "react";
import {
  MUSIC_CHANGE_EVENT,
  isMusicEnabled,
  toggleMusic,
} from "../lib/chiptune";

/**
 * ♪ MUSIC toggle chip — packet 003. Same notch idiom as the clock chip;
 * rendered by ClockChip's top-right chip row so it appears on every screen
 * the clock does (and hides on Draft with it, while playback continues).
 *
 * State persists in localStorage ("blacktop-blitz-music", default ON).
 * Before the first user gesture the chip shows ON (pending) — playback
 * starts on the first gesture via chiptune.attachAutoplayGesture().
 * OFF state drops to the muted secondary color (#8f83ad, amendment 4).
 *
 * data-music-chip: the autoplay first-gesture listener skips presses on
 * this chip so a "turn it off" press never blips audio first.
 */
export default function MusicChip() {
  const [on, setOn] = useState(isMusicEnabled);

  useEffect(() => {
    const sync = () => setOn(isMusicEnabled());
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
      onClick={toggleMusic}
      aria-pressed={on}
      aria-label={on ? "Turn music off" : "Turn music on"}
      className={`select-none font-press text-[8px] sm:text-[10px] bg-[rgba(23,13,42,0.75)] px-[10px] py-2 sm:px-[14px] sm:py-[10px] shadow-[0_0_0_3px_rgba(253,243,221,0.5)] hover:shadow-[0_0_0_3px_#ffb066] ${
        on ? "text-cream" : "text-muted"
      }`}
    >
      ♪<span className="hidden sm:inline"> MUSIC {on ? "ON" : "OFF"}</span>
    </button>
  );
}
