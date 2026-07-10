import React from "react";
import { FaStar, FaHeart } from "react-icons/fa";
import WordmarkNav from "../components/WordmarkNav";
import ClockChip from "../components/ClockChip";

/**
 * About — title + skin-aware panel (640px) with the site copy verbatim and
 * the two CTA buttons. Spec: docs/context/design-handoff-retro.md, screen 5.
 */
export default function About() {
  return (
    <div className="relative flex min-h-full flex-col items-center overflow-y-auto px-4 pb-16 pt-20">
      <WordmarkNav />
      <ClockChip />

      <h1 className="mb-10 text-center font-press text-[clamp(28px,6vw,40px)] text-cream bb-outline-4">
        ABOUT
      </h1>

      <section className="bb-panel w-full max-w-[640px] p-[30px]">
        <p className="font-pixel text-[22px] leading-relaxed">
          This is the best free NBA 2K team randomizer for Blacktop mode! I put
          this together because of my love for NBA 2K and especially the
          blacktop gamemode. My brother and I always liked to randomize our
          teams and make things more interesting. This 2K blacktop randomizer
          is inspired by the old 2kblacktoprandomizer.com site that&apos;s no
          longer active. If you enjoy randomizing your NBA 2K teams, have fun
          using this site!
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <a
            href="https://github.com/wkoverfield/blacktop-blitz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="bb-btn flex items-center gap-3 px-5 py-4 text-[12px]">
              <FaStar aria-hidden="true" className="text-[16px]" />
              STAR ON GITHUB
            </span>
          </a>
          <a
            href="https://buymeacoffee.com/wkoverfield"
            target="_blank"
            rel="noopener noreferrer"
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
