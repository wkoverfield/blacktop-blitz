import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import PlayerCard from "./PlayerCard";
import ClockChip from "./ClockChip";
import WordmarkNav from "./WordmarkNav";

/**
 * Versus screen (spec §4): TEAM ONE row · VS divider · TEAM TWO row ·
 * PLAY AGAIN. Reveal-density cards; on phones (≤640px) a 5v5 collapses
 * each team to roster rows (tap a row to expand its full card).
 */
export default function TeamVersus({ teamOne, teamTwo, onPlayAgain }) {
  const trackEvent = useMutation(api.analytics.trackEvent);
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= 640
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const collapse = isMobile && teamOne.length === 5;

  const handlePlayAgain = () => {
    trackEvent({ eventType: "game_reset" });
    onPlayAgain();
  };

  return (
    <main className="relative w-full">
      <div className="bb-scrim-versus z-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center px-4 pt-20 pb-14 gap-8 w-full">
        <WordmarkNav />
        <ClockChip />

        <TeamRow
          label="TEAM ONE"
          colorClass="text-teamblue"
          team={teamOne}
          collapse={collapse}
          fromX={-50}
        />

        <div className="w-full max-w-[1100px] flex items-center gap-5">
          <span className="flex-1 h-[4px] bg-cream/50" />
          <span className="font-press text-[36px] text-cream bb-outline-4">
            VS
          </span>
          <span className="flex-1 h-[4px] bg-cream/50" />
        </div>

        <TeamRow
          label="TEAM TWO"
          colorClass="text-teamcoral"
          team={teamTwo}
          collapse={collapse}
          fromX={50}
        />

        <button
          type="button"
          className="bb-btn text-[18px] mt-4"
          style={{ padding: "20px 56px" }}
          onClick={handlePlayAgain}
        >
          PLAY AGAIN?
        </button>
      </div>
    </main>
  );
}

function TeamRow({ label, colorClass, team, collapse, fromX }) {
  return (
    <section className="w-full max-w-[1100px] flex flex-col items-center gap-5">
      <h2 className={`font-press text-[17px] ${colorClass} bb-outline-2`}>
        {label}
      </h2>
      {collapse ? (
        <div className="w-full max-w-[420px] flex flex-col gap-4">
          {team.map((player, idx) => (
            <PlayerCard key={player.name + idx} player={player} density="roster" />
          ))}
        </div>
      ) : (
        <div className="flex gap-[24px] flex-wrap justify-center">
          {team.map((player, idx) => (
            <motion.div
              key={player.name + idx}
              initial={{ opacity: 0, x: fromX }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
            >
              <PlayerCard player={player} density="reveal" />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
