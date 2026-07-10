import React from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import ClockChip from "./ClockChip";

/**
 * Home — title-screen style. Full-bleed court backdrop (mounted globally in
 * App), no nav bar. Wordmark up top, boxless menu in the bottom third,
 * footer, and a GitHub star chip in the bottom-right corner.
 * Spec: docs/context/design-handoff-retro.md, screen 1.
 */

const REPO_URL = "https://github.com/wkoverfield/blacktop-blitz";

export default function MainMenu() {
  return (
    <main className="relative flex h-full flex-col items-center overflow-hidden">
      <ClockChip />

      {/* Wordmark + tagline, top ~9vh */}
      <div className="mt-[9vh] flex flex-col items-center gap-5 px-3 text-center">
        <h1 className="font-press leading-none">
          <span className="block text-[clamp(34px,9vw,64px)] text-cream bb-outline-5">
            BLACKTOP
          </span>
          <span className="mt-4 block text-[clamp(24px,6.5vw,44px)] text-action bb-outline-5">
            BLITZ
          </span>
        </h1>
        <p className="font-pixel text-[22px] text-cream bb-outline-2">
          NBA 2K BLACKTOP TEAM RANDOMIZER
        </p>
      </div>

      {/* Boxless menu, bottom third */}
      <nav className="mt-auto flex flex-col items-center gap-[28px] pb-[10vh] text-center">
        <Link
          to="/qplay"
          className="font-press text-[22px] text-highlight bb-outline-3"
        >
          <span aria-hidden="true" className="mr-4">
            ▶
          </span>
          QUICK PLAY
          <span aria-hidden="true" className="ml-4 opacity-0">
            ▶
          </span>
        </Link>
        <Link
          to="/about"
          className="font-press text-[18px] text-cream bb-outline-3 hover:text-highlight"
        >
          ABOUT
        </Link>
        <Link
          to="/feedback"
          className="font-press text-[18px] text-cream bb-outline-3 hover:text-highlight"
        >
          FEEDBACK
        </Link>
      </nav>

      {/* Footer */}
      <footer className="pb-5 text-center font-press text-[10px] text-cream bb-outline-2">
        © 2026 BLACKTOP BLITZ
      </footer>

      {/* GitHub CTA chip */}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Star Blacktop Blitz on GitHub"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-[rgba(23,13,42,0.75)] p-[11px] font-press text-[8px] text-cream shadow-[0_0_0_3px_rgba(253,243,221,0.5)] hover:shadow-[0_0_0_3px_#ffb066] sm:px-[12px] sm:py-[10px]"
      >
        <FaStar aria-hidden="true" className="text-[12px]" />
        <span className="hidden sm:inline">STAR ON GITHUB</span>
      </a>
    </main>
  );
}
