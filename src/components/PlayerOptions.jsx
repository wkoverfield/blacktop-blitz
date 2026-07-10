import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import PlayerCard from "./PlayerCard";
import useKeyboardNav from "../hooks/useKeyboardNav";
import EscHint from "./EscHint";

/**
 * Draft screen (spec §3) — an internal /qplay state, not a modal.
 * N rounds for NvN; each round both players pick one of 3 draft-density
 * cards. Options re-randomize each round excluding already-picked players;
 * selections and card flips reset between rounds (cards are keyed by round).
 * No clock chip here by design.
 */

/**
 * Sample up to 3 players with DISTINCT NAMES. players.json repeats names
 * within a single era (e.g. multiple Michael Jordan entries), and the
 * app's draft identity is the name: exclusion after a pick is by name,
 * the TeamQuery submit gate counts distinct names, and cards are keyed
 * by name. Sampling raw entries could land the same name twice in one
 * row (duplicate React keys, two identical picks) — so we walk a
 * Fisher-Yates shuffle and skip names we've already taken. The walk is
 * bounded by the pool length, preserving the old anti-hang guarantee
 * (the previous unbounded `while (size < 3)` could spin forever on a
 * thin pool and lock the tab). Returns fewer than `count` only when the
 * pool has that few distinct names.
 */
function sample(pool, count) {
  const copy = pool.slice();
  const out = [];
  const seenNames = new Set();
  for (let i = 0; i < copy.length && out.length < count; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
    if (!seenNames.has(copy[i].name)) {
      seenNames.add(copy[i].name);
      out.push(copy[i]);
    }
  }
  return out;
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
  // Monotonic roll id, bumped on every reroll AND round advance. Keying
  // cards by it (instead of round) remounts them on REROLL too — otherwise
  // a re-rolled card that happens to share a name with the previous roll
  // would keep the old card's flip state.
  const [rollId, setRollId] = useState(0);

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
    setRollId((id) => id + 1);
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

  // Keyboard nav (packet 003): rows 0 X · 10/11 p1 cards/tabs · 20/21 p2
  // cards/tabs · 30 REROLL+NEXT. Enter on a card selects, down from a card
  // reaches its tab (Enter flips), Esc exits like X.
  useKeyboardNav({ onEscape: handleAbandon });

  return (
    <div className="relative w-full">
      <div className="bb-scrim-draft z-0 pointer-events-none" />
      <EscHint label="EXIT" />
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
            data-kbnav="0"
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
          rollId={rollId}
          rowKey="p1"
          navCardRow="10"
          navTabRow="11"
        />
        <DraftRow
          label="PLAYER 2 PICKS"
          colorClass="text-teamcoral"
          options={opts2}
          selected={sel2}
          onSelect={(i) => setSel2(sel2 === i ? null : i)}
          rollId={rollId}
          rowKey="p2"
          navCardRow="20"
          navTabRow="21"
        />

        <div className="flex items-center justify-center gap-[20px] mt-10">
          <button
            type="button"
            data-kbnav="30"
            className="bb-btn-secondary text-[12px] px-6 py-4"
            onClick={handleReroll}
          >
            REROLL
          </button>
          <button
            type="button"
            data-kbnav="30"
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

function DraftRow({
  label,
  colorClass,
  options,
  selected,
  onSelect,
  rollId,
  rowKey,
  navCardRow,
  navTabRow,
}) {
  return (
    <section className="w-full max-w-[1100px] flex items-center justify-center gap-6 flex-wrap mt-10">
      <h2
        className={`font-press text-[12px] ${colorClass} bb-outline-2 w-[110px] shrink-0 leading-[18px]`}
      >
        {label}
      </h2>
      <div className="flex gap-[24px] flex-wrap justify-center">
        {/* Defensive: the query gate (distinct-name count in TeamQuery)
            guarantees enough names for every round, but if the pool ever
            rolls empty, say so instead of silently disabling NEXT. */}
        {options.length === 0 && (
          <p className="font-vt text-[22px] text-cream bb-outline-2">
            NO PLAYERS LEFT TO DRAFT — REROLL OR EXIT (X)
          </p>
        )}
        {options.map((player, i) => (
          <PlayerCard
            // Keyed by rollId so flips + selection styling remount on every
            // new roll (round advance AND reroll). Name is unique within a
            // row — sample() dedupes by name.
            key={`${rowKey}-${rollId}-${player.name}`}
            player={player}
            density="draft"
            selected={selected === i}
            onSelect={() => onSelect(i)}
            navBody={navCardRow}
            navTab={navTabRow}
          />
        ))}
      </div>
    </section>
  );
}
