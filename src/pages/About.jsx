import React from "react";
import { useNavigate } from "react-router-dom";
import { FaStar, FaHeart } from "react-icons/fa";
import WordmarkNav from "../components/WordmarkNav";
import ClockChip from "../components/ClockChip";
import useKeyboardNav from "../hooks/useKeyboardNav";
import useGithubStars, { formatStars } from "../hooks/useGithubStars";

/**
 * About — title + skin-aware panel (640px) with the site copy verbatim and
 * the two CTA buttons. Spec: docs/context/design-handoff-retro.md, screen 5.
 * Packet 003: arrows walk the CTAs (single row — up/down and left/right both
 * work), and the GitHub button shows the live star count.
 */
export default function About() {
  const navigate = useNavigate();
  // Esc = back to the title screen (game "B button").
  useKeyboardNav({ onEscape: () => navigate("/") });
  const stars = useGithubStars();

  return (
    <div className="relative flex min-h-full flex-col items-center overflow-y-auto px-4 pb-16 pt-20">
      <WordmarkNav />
      <ClockChip />

      <h1 className="mb-10 text-center font-press text-[clamp(28px,6vw,40px)] text-cream bb-outline-4">
        ABOUT
      </h1>

      <section className="bb-panel w-full max-w-[640px] p-[30px]">
        <p className="font-pixel text-[22px] leading-relaxed">
          This is a little project I put together that started with my love
          for NBA 2k and especially the blacktop gamemode as I have fond
          memories playing with my brother. We always liked to randomize our
          teams and make things more interesting so if you enjoy that have fun
          using this site! This is inspired from another site that used to
          exist called 2kblacktoprandomizer.com but is no longer active. The
          project is on my GitHub if you want to check it out more!
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <a
            href="https://github.com/wkoverfield/blacktop-blitz"
            target="_blank"
            rel="noopener noreferrer"
            data-kbnav="0"
          >
            <span className="bb-btn flex items-center gap-3 px-5 py-4 text-[12px]">
              <FaStar aria-hidden="true" className="text-[16px]" />
              STAR ON GITHUB
              {stars !== null && (
                <span className="font-vt text-[18px] leading-none">
                  · {formatStars(stars)}
                </span>
              )}
            </span>
          </a>
          <a
            href="https://buymeacoffee.com/wkoverfield"
            target="_blank"
            rel="noopener noreferrer"
            data-kbnav="0"
          >
            <span className="bb-btn flex items-center gap-3 px-5 py-4 text-[12px]">
              <FaHeart aria-hidden="true" className="text-[16px]" />
              BUY ME A COFFEE
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}
