import React from "react";
import { useTimeOfDay } from "../hooks/useTimeOfDay";
import MusicChip from "./MusicChip";

/**
 * Fixed top-right chip row: [♪ MUSIC] [DUSK · AUTO]. Every screen that
 * mounted the clock chip keeps its single <ClockChip /> mount and now gets
 * the music chip beside it for free (both hide on Draft, which mounts
 * neither — music playback itself continues there).
 *
 * Clock: click cycles sunrise -> midday -> dusk -> night -> AUTO.
 * Mobile (<=640px): drops the " · AUTO" suffix, 8px font, tighter padding.
 */
export default function ClockChip() {
  const { slot, isAuto, cycle } = useTimeOfDay();

  return (
    <div className="fixed right-4 top-4 z-40 flex items-stretch gap-4">
      <MusicChip />
      <button
        type="button"
        data-kbnav="9000"
        onClick={cycle}
        aria-label="Change time of day"
        className="select-none font-press text-[8px] sm:text-[10px] text-cream bg-[rgba(23,13,42,0.75)] px-[10px] py-2 sm:px-[14px] sm:py-[10px] shadow-[0_0_0_3px_rgba(253,243,221,0.5)] hover:shadow-[0_0_0_3px_#ffb066]"
      >
        {slot.toUpperCase()}
        {isAuto && <span className="hidden sm:inline"> · AUTO</span>}
      </button>
    </div>
  );
}
