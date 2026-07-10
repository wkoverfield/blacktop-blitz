import React from "react";
import { useTimeOfDay } from "../hooks/useTimeOfDay";

/**
 * Full-bleed pixel-art court background. Mounted exactly ONCE, in App.jsx.
 *
 * All four time-of-day layers stay stacked and cross-fade via opacity
 * (1.6s ease) when the slot changes — per the handoff spec. Screens that
 * need a scrim (Draft/Versus) render their own overlay div on top; the
 * backdrop itself is scrim-free.
 */

const LAYERS = [
  { slot: "sunrise", src: "/img/court-sunrise.png" },
  { slot: "midday", src: "/img/court-day.png" },
  { slot: "dusk", src: "/img/court-dusk.png" },
  { slot: "night", src: "/img/court-night.png" },
];

export default function CourtBackdrop() {
  const { slot } = useTimeOfDay();

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      {LAYERS.map((layer) => (
        <img
          key={layer.slot}
          src={layer.src}
          alt=""
          draggable="false"
          className="absolute inset-0 h-full w-full object-cover select-none"
          style={{
            imageRendering: "pixelated",
            opacity: layer.slot === slot ? 1 : 0,
            transition: "opacity 1.6s ease",
          }}
        />
      ))}
    </div>
  );
}
