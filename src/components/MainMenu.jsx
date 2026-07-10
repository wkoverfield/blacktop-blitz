import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import ClockChip from "./ClockChip";
import useKeyboardNav from "../hooks/useKeyboardNav";
import useGithubStars, { formatStars } from "../hooks/useGithubStars";

/**
 * Home — title-screen style. Full-bleed court backdrop (mounted globally in
 * App), no nav bar. Wordmark up top, boxless menu in the bottom third,
 * footer, and a GitHub star chip in the bottom-right corner.
 * Spec: docs/context/design-handoff-retro.md, screen 1.
 *
 * Packet 003: the menu is a title-screen cursor on the shared keyboard-nav
 * ring (rows 0-2 menu, 10 star chip, 9000 the top-right chips) — the ▶ +
 * highlight tracks real DOM focus, hover focuses, Enter activates natively.
 * QUICK PLAY is focused on mount so Enter works immediately. The star chip
 * renders the live star count.
 */

const REPO_URL = "https://github.com/wkoverfield/blacktop-blitz";

const MENU_ITEMS = [
  { to: "/qplay", label: "QUICK PLAY", sizeCls: "text-[clamp(17px,2.8vh,22px)]" },
  { to: "/about", label: "ABOUT", sizeCls: "text-[clamp(14px,2.3vh,18px)]" },
  { to: "/feedback", label: "FEEDBACK", sizeCls: "text-[clamp(14px,2.3vh,18px)]" },
];

export default function MainMenu() {
  const [cursor, setCursor] = useState(0);
  const linkRefs = useRef([]);
  const stars = useGithubStars();
  useKeyboardNav();

  useEffect(() => {
    // Title-screen boot: the cursor starts ON QUICK PLAY (real focus), so
    // Enter plays immediately and the first arrow press moves from there.
    linkRefs.current[0]?.focus({ preventScroll: true });
    // The ▶ shows only while a menu item holds focus; walking off to the
    // chips clears it.
    const onFocusIn = (e) => {
      const idx = linkRefs.current.indexOf(e.target);
      setCursor(idx);
    };
    window.addEventListener("focusin", onFocusIn);
    return () => window.removeEventListener("focusin", onFocusIn);
  }, []);

  return (
    <main className="relative flex h-full flex-col items-center overflow-hidden">
      <ClockChip />

      {/* Wordmark + tagline, top ~9vh */}
      {/* Type + spacing clamp on vh as well as vw: on short/zoomed windows
          the title block shrinks instead of swallowing the menu's air. */}
      <div className="mt-[clamp(20px,7vh,9vh)] flex flex-col items-center gap-[clamp(10px,2.2vh,20px)] px-3 text-center">
        <h1 className="font-press leading-none">
          <span className="block text-[clamp(34px,min(9vw,10vh),64px)] text-cream bb-outline-5">
            BLACKTOP
          </span>
          <span className="mt-[clamp(8px,1.8vh,16px)] block text-[clamp(24px,min(6.5vw,7vh),44px)] text-action bb-outline-5">
            BLITZ
          </span>
        </h1>
        <p className="font-pixel text-[clamp(15px,2.6vh,22px)] text-cream bb-outline-2">
          NBA 2K BLACKTOP TEAM RANDOMIZER
        </p>
      </div>

      {/* Boxless menu, bottom third — ▶ cursor walks the items. pt keeps a
          floor of air under the tagline even when mt-auto collapses to 0. */}
      <nav
        aria-label="Main menu"
        className="mt-auto flex flex-col items-center gap-[clamp(14px,3.2vh,28px)] pt-[5vh] pb-[clamp(28px,10vh,10vh)] text-center"
      >
        {MENU_ITEMS.map((item, i) => {
          const active = cursor === i;
          return (
            <Link
              key={item.to}
              ref={(el) => (linkRefs.current[i] = el)}
              to={item.to}
              data-kbnav={i}
              onMouseEnter={() =>
                linkRefs.current[i]?.focus({ preventScroll: true })
              }
              className={`font-press ${item.sizeCls} bb-outline-3 bb-nofocus ${
                active ? "text-highlight" : "text-cream"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mr-4${active ? "" : " opacity-0"}`}
              >
                ▶
              </span>
              {item.label}
              <span aria-hidden="true" className="ml-4 opacity-0">
                ▶
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <footer className="pb-5 text-center font-press text-[10px] text-cream bb-outline-2">
        © 2026 BLACKTOP BLITZ
      </footer>

      {/* GitHub CTA chip (+ live star count when known — packet 003) */}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Star Blacktop Blitz on GitHub"
        data-kbnav="10"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-[rgba(23,13,42,0.75)] p-[11px] font-press text-[8px] text-cream shadow-[0_0_0_3px_rgba(253,243,221,0.5)] hover:shadow-[0_0_0_3px_#ffb066] sm:px-[12px] sm:py-[10px]"
      >
        <FaStar aria-hidden="true" className="text-[12px]" />
        <span className="hidden sm:inline">STAR ON GITHUB</span>
        {stars !== null && (
          <>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="font-vt text-[15px] leading-none">
              {formatStars(stars)}
            </span>
          </>
        )}
      </a>
    </main>
  );
}
