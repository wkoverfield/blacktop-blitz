import React from "react";
import { Link } from "react-router-dom";

/**
 * Two-line BLACKTOP / BLITZ wordmark, fixed top-left, linking home.
 * Used on every screen except Home (which carries the big wordmark)
 * and Draft (headerless per spec).
 */
export default function WordmarkNav() {
  return (
    <Link
      to="/"
      aria-label="Blacktop Blitz — home"
      className="fixed left-4 top-4 z-40 select-none font-press text-[12px] leading-[1.6]"
    >
      <span className="block text-cream bb-outline-2">BLACKTOP</span>
      <span className="block text-action bb-outline-2">BLITZ</span>
    </Link>
  );
}
