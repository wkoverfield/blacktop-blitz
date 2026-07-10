import React from "react";

/**
 * Subtle "ESC · BACK" affordance, fixed bottom-left — the retro-menu hint
 * that the keyboard has a back button. Mounted by WordmarkNav (so every
 * screen with the small wordmark gets it) and by Draft with label="EXIT".
 * Hidden below 640px: touch has no Esc key. Dimmed cream + 2px outline
 * keeps it legible on artwork (law 5) without competing with content.
 */
export default function EscHint({ label = "BACK" }) {
  return (
    <span
      aria-hidden="true"
      className="fixed bottom-4 left-4 z-40 hidden select-none font-press text-[8px] text-cream bb-outline-2 opacity-60 sm:block"
    >
      ESC · {label}
    </span>
  );
}
