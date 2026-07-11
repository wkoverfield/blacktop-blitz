import React, { useEffect, useRef, useState } from "react";
import {
  ATTR_KEYS,
  ATTR_ABBREVS,
  attrsFor,
  bracketColor,
  hasRealAttrs,
  tierFor,
  topSkills,
} from "../lib/attrs";

/**
 * The player card — one design, three densities (design law 8):
 *   draft  (344px tall): header · art · chips · HEIGHT/TEAM rows · tab
 *   reveal (404px tall): draft + TIER row · OVR block bar · TOP SKILLS
 *   roster (row, phone 5v5 versus only): strip · thumb · name/line · badge
 * Interaction contract (design law 9 + amendment 3): card body = select
 * (draft only), bottom tab = flip. Flip happens ONLY via the tab — no
 * hover-triggered flipping on any device.
 *
 * Keyboard nav (packet 003): screens pass navBody/navTab row numbers.
 * navBody makes the card wrapper a focusable data-kbnav item (Enter =
 * select); navTab marks the VISIBLE face's tab (Enter = flip). Focus
 * follows a keyboard flip to the newly visible tab.
 */

const ERA_LABELS = { curr: "CURRENT", class: "CLASSIC", allt: "ALL-TIME" };
const ERA_ABBREVS = { curr: "CUR", class: "CLA", allt: "ALL" };
const FLIP_EASE = "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)";

export default function PlayerCard({
  player,
  density = "reveal",
  selected = false,
  onSelect,
  navBody,
  navTab,
}) {
  if (density === "roster") return <RosterRow player={player} />;
  return (
    <CardBody
      player={player}
      density={density}
      selected={selected}
      onBodyClick={density === "draft" ? onSelect : undefined}
      navBody={navBody}
      navTab={navTab}
    />
  );
}

function CardBody({
  player,
  density,
  selected = false,
  onBodyClick,
  navBody,
  navTab,
}) {
  const [flipped, setFlipped] = useState(false);
  const frontTabRef = useRef(null);
  const backTabRef = useRef(null);

  // Keyboard flip: after a flip the pressed tab is on the hidden face —
  // hand focus to the tab that is now visible so Enter keeps toggling and
  // arrows resume from a live nav item.
  useEffect(() => {
    const hidden = flipped ? frontTabRef.current : backTabRef.current;
    const visible = flipped ? backTabRef.current : frontTabRef.current;
    if (document.activeElement === hidden && visible) visible.focus();
  }, [flipped]);

  const tier = tierFor(player.overall);
  const height = density === "draft" ? "var(--bb-draft-card-height, 344px)" : 404;

  return (
    <div
      className={`${density === "draft" ? "bb-card-draft " : ""}${
        selected ? "bb-notch bb-notch-selected" : "bb-notch bb-ring-ink"
      }`}
      style={{
        width: 196,
        height,
        perspective: 1200,
        cursor: onBodyClick ? "pointer" : "default",
      }}
      // Click select lives on the wrapper (tab stopPropagation-s), so the
      // keyboard hook's Enter → click() lands here too.
      onClick={onBodyClick}
      {...(onBodyClick
        ? {
            role: "button",
            "aria-pressed": selected,
            "aria-label": `Select ${player.name}`,
            tabIndex: -1,
          }
        : {})}
      {...(navBody !== undefined ? { "data-kbnav": navBody } : {})}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transition: FLIP_EASE,
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <CardFace
          side="front"
          player={player}
          density={density}
          tier={tier}
          selected={selected}
          interactive={!!onBodyClick}
          tabRef={frontTabRef}
          navTab={!flipped ? navTab : undefined}
          onFlip={() => setFlipped((f) => !f)}
        />
        <CardFace
          side="back"
          player={player}
          density={density}
          tier={tier}
          selected={selected}
          interactive={!!onBodyClick}
          tabRef={backTabRef}
          navTab={flipped ? navTab : undefined}
          onFlip={() => setFlipped((f) => !f)}
        />
      </div>
    </div>
  );
}

function CardFace({
  side,
  player,
  density,
  tier,
  selected,
  interactive,
  tabRef,
  navTab,
  onFlip,
}) {
  return (
    <div
      className={`absolute inset-0 flex ${tier.key}`}
      style={{
        padding: 6,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: side === "back" ? "rotateY(180deg)" : "rotateY(0deg)",
        cursor: interactive ? "pointer" : "default",
      }}
    >
      <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-ink">
        <CardHeader player={player} tier={tier} selected={selected} />
        {side === "front" ? (
          <FrontContent player={player} density={density} tier={tier} />
        ) : (
          <BackContent player={player} density={density} />
        )}
        <button
          type="button"
          ref={tabRef}
          {...(navTab !== undefined ? { "data-kbnav": navTab } : {})}
          className="w-full bg-deepink text-highlight font-press text-[8px] mt-auto shrink-0"
          style={{ minHeight: 40 }}
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
        >
          {side === "front" ? "▲ STATS" : "▼ ART"}
        </button>
      </div>
    </div>
  );
}

function CardHeader({ player, tier, selected }) {
  return (
    <header className="flex items-start justify-between gap-1 px-2 pt-2 pb-1 shrink-0">
      <p
        className={`font-press text-[8px] leading-[12px] ${
          selected ? "text-highlight" : "text-cream"
        }`}
        style={{
          minHeight: 24,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {selected ? "▶ " : ""}
        {player.name.toUpperCase()}
      </p>
      <div
        className={`${tier.key} font-press text-[11px] text-white w-[30px] h-[30px] flex items-center justify-center shrink-0`}
        style={{ boxShadow: "0 0 0 3px #17102a" }}
      >
        {player.overall}
      </div>
    </header>
  );
}

function FrontContent({ player, density, tier }) {
  return (
    <>
      <ArtWindow player={player} density={density} />
      <div className="flex gap-1.5 px-2 pt-2 shrink-0">
        <span className="bb-chip-filled text-[7px] px-1.5 py-1">
          {ERA_LABELS[player.type] || player.type}
        </span>
        {player.positions?.length > 0 && (
          <span className="bb-chip text-[7px] px-1.5 py-1">
            {player.positions.join("/")}
          </span>
        )}
      </div>
      <div className="px-2 pt-1">
        <StatRow label="HEIGHT" value={player.height || "—"} />
        <div className="bb-draft-phys">
          <StatRow
            label="PHYS"
            value={
              [player.weight, player.wingspan ? `${player.wingspan} WS` : null]
                .filter(Boolean)
                .join(" · ") || "—"
            }
          />
        </div>
        <StatRow label="TEAM" value={player.team} />
        {density === "reveal" && (
          <>
            <StatRow
              label="TIER"
              value={tier.label}
              valueColor={tier.accent}
            />
            <div
              className="flex items-center justify-between gap-2 py-[5px]"
              style={{
                borderBottom: "2px dotted rgba(143, 131, 173, 0.4)",
              }}
            >
              <span className="font-vt text-[15px] text-muted leading-none">
                OVR
              </span>
              <BlockBar
                value={player.overall}
                color={tier.accent}
              />
            </div>
          </>
        )}
      </div>
      <TopSkills player={player} compact={density === "draft"} />
    </>
  );
}

function ArtWindow({ player, density }) {
  return (
    <div
      className={`bb-card-art relative overflow-hidden shrink-0 bg-cardart${
        density === "draft" ? " bb-card-art-draft" : ""
      }`}
    >
      {player.playerImg ? (
        // referrerPolicy="no-referrer" defeats 2kratings.com hot-link 403s
        // (existing pattern — required on every 2kratings <img>).
        <img
          src={player.playerImg}
          alt={player.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover"
          style={{
            filter: "saturate(1.3) contrast(1.12)",
            objectPosition: "center 20%",
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="font-press text-[16px] text-muted">
            {player.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
        </div>
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(240,138,75,0.12), rgba(61,42,99,0.38))",
        }}
      />
      {player.teamImg && (
        <img
          src={player.teamImg}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="absolute bottom-1 right-1 w-[26px]"
          style={{ filter: "drop-shadow(2px 2px 0 rgba(20,10,40,0.6))" }}
        />
      )}
    </div>
  );
}

function StatRow({ label, value, valueColor }) {
  return (
    <div
      className="flex items-baseline justify-between gap-2 py-[3px]"
      style={{ borderBottom: "2px dotted rgba(143, 131, 173, 0.4)" }}
    >
      <span className="font-vt text-[15px] text-muted leading-none shrink-0">
        {label}
      </span>
      <span
        className="font-vt text-[17px] text-cream leading-none truncate"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function TopSkills({ player, compact = false }) {
  if (compact) {
    return (
      <div className="bb-draft-top px-2 pt-[5px] flex items-center gap-[6px]">
        <span className="font-vt text-[14px] text-muted leading-none shrink-0">
          TOP
        </span>
        <SkillChips player={player} compact />
      </div>
    );
  }
  return (
    <div className="px-2 pt-[6px]">
      <p className="font-vt text-[15px] text-muted leading-none">TOP SKILLS</p>
      <SkillChips player={player} />
    </div>
  );
}

function SkillChips({ player, compact = false }) {
  return (
    <div className={`flex ${compact ? "gap-[5px]" : "gap-[7px] pt-[6px]"}`}>
      {topSkills(player).map(([key, value]) => (
        <span
          key={key}
          className={`flex items-baseline gap-1 bg-deepink ${
            compact ? "px-1 py-0.5" : "px-1.5 py-1"
          }`}
          style={{ boxShadow: "0 0 0 2px #3d2a63" }}
        >
          <span className="font-press text-[7px] text-muted">
            {ATTR_ABBREVS[key]}
          </span>
          <span
            className={`font-vt leading-none ${compact ? "text-[15px]" : "text-[17px]"}`}
            style={{ color: bracketColor(value) }}
          >
            {value}
          </span>
        </span>
      ))}
    </div>
  );
}

function BackContent({ player, density }) {
  const attrs = attrsFor(player);
  return (
    <>
      <div className="flex items-center gap-2 px-2 pt-1 shrink-0">
        <span className="flex-1 h-[2px] bg-muted/50" />
        <span className="font-press text-[8px] text-cream">ATTRIBUTES</span>
        <span className="flex-1 h-[2px] bg-muted/50" />
      </div>
      <div className="px-2 pt-1 flex flex-col">
        {ATTR_KEYS.map((key) => (
          <div
            key={key}
            className="bb-attribute-row flex items-center justify-between gap-1 py-[4px]"
          >
            <span className="font-vt text-[15px] text-muted leading-none w-[26px] shrink-0">
              {ATTR_ABBREVS[key]}
            </span>
            <BlockBar value={attrs[key]} color={bracketColor(attrs[key])} />
            <span
              className="font-vt text-[17px] leading-none w-[20px] text-right shrink-0"
              style={{ color: bracketColor(attrs[key]) }}
            >
              {attrs[key]}
            </span>
          </div>
        ))}
      </div>
      {/* Footnote only for the rare player still on hash-fallback values
          (packet 004: real cats ship for the whole current dataset). */}
      {!hasRealAttrs(player) && (
        <p className="font-vt text-[13px] text-muted px-2 pt-1">
          * placeholder values pending attribute data
        </p>
      )}
      <div className={`${density === "draft" ? "bb-card-back-extra " : ""}px-2 pt-1 mt-auto`}>
        <StatRow
          label="BADGES"
          value={
            player.badges
              ? `${player.badges.total ?? 0} · ${
                  player.badges.legendary
                    ? `${player.badges.legendary} LEG`
                    : `${player.badges.hallOfFame ?? 0} HOF`
                }`
              : "—"
          }
        />
        <StatRow label="BEST" value={player.badges?.top?.[0]?.name || "—"} />
        <StatRow label="FROM" value={player.college || "—"} />
      </div>
    </>
  );
}

/** 10-block pixel bar: filled = round(value / 10), empty blocks = card art bg. */
function BlockBar({ value, color }) {
  const filled = Math.round(value / 10);
  return (
    <span className="flex gap-[3px]">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          style={{
            width: 9,
            height: 9,
            background: i < filled ? color : "#3d2a63",
          }}
        />
      ))}
    </span>
  );
}

/** Phone 5v5 versus row. Tap expands to the full reveal-density card. */
function RosterRow({ player }) {
  const [expanded, setExpanded] = useState(false);
  const tier = tierFor(player.overall);

  if (expanded) {
    return (
      <div className="flex justify-center py-3">
        <CardBody
          player={player}
          density="reveal"
          onBodyClick={() => setExpanded(false)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      className="w-full flex items-center gap-2 bb-notch-3 bb-ring-ink bg-ink text-left"
      style={{ padding: "6px 8px" }}
    >
      <span className={`self-stretch w-[3px] shrink-0 ${tier.key}`} />
      <span
        className="relative overflow-hidden shrink-0 bg-cardart"
        style={{ width: 40, height: 40 }}
      >
        {player.playerImg && (
          <img
            src={player.playerImg}
            alt={player.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 20%" }}
          />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-press text-[8px] text-cream truncate">
          {player.name.toUpperCase()}
        </span>
        <span className="block font-vt text-[15px] text-muted truncate pt-1">
          {player.positions?.join("/") || "—"} | {player.height || "—"}{" "}
          {"·"} {ERA_ABBREVS[player.type] || ""}
        </span>
      </span>
      <span
        className={`${tier.key} font-press text-[10px] text-white w-[28px] h-[28px] flex items-center justify-center shrink-0`}
        style={{ boxShadow: "0 0 0 2px #17102a" }}
      >
        {player.overall}
      </span>
      <span
        className="bg-deepink text-highlight font-press text-[12px] flex items-center justify-center shrink-0"
        style={{ width: 34, height: 34 }}
        aria-label={`Expand ${player.name} card`}
      >
        +
      </span>
    </button>
  );
}
