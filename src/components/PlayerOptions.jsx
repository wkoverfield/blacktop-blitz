import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import PlayerCard from "./PlayerCard";

/**
 * Draft screen (spec §3) — an internal /qplay state, not a modal.
 * N rounds for NvN; each round both players pick one of 3 draft-density
 * cards. Options re-randomize each round excluding already-picked players;
 * selections and card flips reset between rounds (cards are keyed by round).
 * No clock chip here by design.
 */

/**
 * Sample up to 3 distinct players. Partial Fisher-Yates over a copy is
 * bounded by construction — this preserves the old anti-hang guarantee
 * (the previous unbounded `while (size < 3)` could spin forever on a
 * thin pool and lock the tab). Returns fewer than 3 only when the
 * remaining pool is that thin.
 */
function sample(pool, count) {
  const copy = pool.slice();
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function rollOptions(pool, picked1, picked2) {
  const excluded = new Set([...picked1, ...picked2].map((p) => p.name));
  const available = pool.filter((p) => !excluded.has(p.name));
  return [sample(available, 3), sample(available, 3)];
}

export default function PlayerOptions({ pool, size, onDone, onAbandon }) {
  const trackEvent = useMutation(api.analytics.trackEvent);

  const [round, setRound] = useState(1);
  const [picked1, setPicked1] = useState([]);
  const [picked2, setPicked2] = useState([]);
  const [[opts1, opts2], setOptions] = useState(() => rollOptions(pool, [], []));
  const [sel1, setSel1] = useState(null);
  const [sel2, setSel2] = useState(null);

  // draft_started fires once per draft entry. Effect + ref (not render-phase):
  // StrictMode's initial double-render re-initializes render-phase refs and
  // would double-fire, while the committed ref survives the effect re-run.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent({
      eventType: "draft_started",
      metadata: { gameSize: `${size}v${size}` },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bothSelected = sel1 !== null && sel2 !== null;
  const isFinal = round === size;

  const resetRound = (nextPicked1, nextPicked2) => {
    setSel1(null);
    setSel2(null);
    setOptions(rollOptions(pool, nextPicked1, nextPicked2));
  };

  const handleReroll = () => resetRound(picked1, picked2);

  const handleAdvance = () => {
    if (!bothSelected) return;
    const nextPicked1 = [...picked1, opts1[sel1]];
    const nextPicked2 = [...picked2, opts2[sel2]];

    trackEvent({
      eventType: "player_selected",
      metadata: { roundNumber: round, totalRounds: size },
    });

    if (isFinal) {
      trackEvent({
        eventType: "draft_completed",
        metadata: { gameSize: `${size}v${size}`, totalRounds: size },
      });
      onDone(nextPicked1, nextPicked2);
      return;
    }

    setPicked1(nextPicked1);
    setPicked2(nextPicked2);
    setRound(round + 1);
    resetRound(nextPicked1, nextPicked2);
  };

  const handleAbandon = () => {
    trackEvent({
      eventType: "draft_abandoned",
      metadata: { roundNumber: round, totalRounds: size },
    });
    onAbandon();
  };

  return (
    <div className="relative w-full">
      <div className="bb-scrim-draft z-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center px-4 pt-6 pb-14">
        {/* Header: spacer · ROUND n · X */}
        <header className="w-full max-w-[1100px] flex items-start justify-between gap-4">
          <div className="w-[43px] shrink-0" />
          <div className="text-center">
            <h1 className="font-press text-[28px] text-cream bb-outline-3">
              ROUND {round}
              {isFinal ? " (FINAL)" : ""}
            </h1>
            <p
              className="font-vt text-[22px] mt-2"
              style={{ color: "#d9c9f0" }}
            >
              Each person drafts one player
            </p>
          </div>
          <button
            type="button"
            aria-label="Exit draft"
            className="bb-notch-3 bb-ring-cream-55 w-[43px] h-[43px] shrink-0 font-press text-[14px] text-cream hover:text-highlight"
            onClick={handleAbandon}
          >
            X
          </button>
        </header>

        <DraftRow
          label="PLAYER 1 PICKS"
          colorClass="text-teamblue"
          options={opts1}
          selected={sel1}
          onSelect={(i) => setSel1(sel1 === i ? null : i)}
          round={round}
          rowKey="p1"
        />
        <DraftRow
          label="PLAYER 2 PICKS"
          colorClass="text-teamcoral"
          options={opts2}
          selected={sel2}
          onSelect={(i) => setSel2(sel2 === i ? null : i)}
          round={round}
          rowKey="p2"
        />

        <div className="flex items-center justify-center gap-[20px] mt-10">
          <button
            type="button"
            className="bb-btn-secondary text-[12px] px-6 py-4"
            onClick={handleReroll}
          >
            REROLL
          </button>
          <button
            type="button"
            className="bb-btn text-[16px] px-10 py-4"
            disabled={!bothSelected}
            onClick={handleAdvance}
          >
            {isFinal ? "DONE" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftRow({ label, colorClass, options, selected, onSelect, round, rowKey }) {
  return (
    <section className="w-full max-w-[1100px] flex items-center justify-center gap-6 flex-wrap mt-10">
      <h2
        className={`font-press text-[12px] ${colorClass} bb-outline-2 w-[110px] shrink-0 leading-[18px]`}
      >
        {label}
      </h2>
      <div className="flex gap-[24px] flex-wrap justify-center">
        {options.map((player, i) => (
          <PlayerCard
            // Keyed by round so flips + selection styling remount each round.
            key={`${rowKey}-${round}-${player.name}`}
            player={player}
            density="draft"
            selected={selected === i}
            onSelect={() => onSelect(i)}
          />
        ))}
      </div>
    </section>
  );
}
