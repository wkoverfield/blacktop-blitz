import React, { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useTimeOfDay } from "../hooks/useTimeOfDay";
import ClockChip from "./ClockChip";
import WordmarkNav from "./WordmarkNav";
import useKeyboardNav from "../hooks/useKeyboardNav";
import { getAllPlayers } from "../lib/nba2kapi";
import {
  ATTR_KEYS,
  ATTR_NAMES,
  attrsFor,
  heightToInches,
} from "../lib/attrs";

/**
 * Query screen (spec §2): era + overall + game size, plus advanced filters
 * (position, min height, team substring, attribute rules). Filtering is
 * live against the full in-memory roster so the match count updates as
 * the user types. SUBMIT hands the filtered pool + size up to the draft.
 */

const ERAS = [
  { key: "curr", label: "Current" },
  { key: "class", label: "Classic" },
  { key: "allt", label: "All-Time" },
];
const SIZES = [1, 2, 3, 4, 5];
const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const HEIGHTS = [
  { label: "ANY", inches: 0 },
  { label: `6'6"+`, inches: 78 },
  { label: `6'10"+`, inches: 82 },
  { label: `7'0"+`, inches: 84 },
];

let ruleId = 0;

/**
 * Keyboard nav rows (packet 003, data-kbnav): 0 min · 1 max · 2-4 eras ·
 * 5 size segs · 6 +ADVANCED · 10+i rule rows · 40 +ADD RULE · 41 RESET ·
 * 7/8/9 position/height/team (advanced) · 50 retry · 60 SUBMIT. Left/right
 * walks segments within a row and steps the data-kbstep number wells.
 */
export default function TeamQuery({ onSubmit }) {
  useKeyboardNav();
  const trackEvent = useMutation(api.analytics.trackEvent);
  const { skin } = useTimeOfDay();
  // Input-well value accent per skin (spec: #ffb066 dark / #c05a28 light).
  const accent = skin === "light" ? "#c05a28" : "#ffb066";

  const [players, setPlayers] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const [minOv, setMinOv] = useState("60");
  const [maxOv, setMaxOv] = useState("99");
  const [eras, setEras] = useState({ curr: true, class: false, allt: false });
  const [size, setSize] = useState(1);

  const [advOpen, setAdvOpen] = useState(false);
  const [pos, setPos] = useState({});
  const [minHt, setMinHt] = useState(0);
  const [teamQ, setTeamQ] = useState("");
  const [rules, setRules] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    getAllPlayers()
      .then((all) => !cancelled && setPlayers(all))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [retryNonce]);

  const eraCount = ERAS.filter((e) => eras[e.key]).length;
  const posKeys = POSITIONS.filter((p) => pos[p]);
  const minN = minOv === "" ? 0 : Number(minOv);
  const maxN = maxOv === "" ? 99 : Number(maxOv);

  const filtered = useMemo(() => {
    if (!players) return [];
    const team = teamQ.trim().toLowerCase();
    const activeRules = rules.filter((r) => r.min !== "");
    return players.filter((p) => {
      if (!eras[p.type]) return false;
      if (p.overall < minN || p.overall > maxN) return false;
      if (posKeys.length > 0 && !p.positions.some((x) => pos[x])) return false;
      if (minHt > 0) {
        const inches = heightToInches(p.height);
        if (inches == null || inches < minHt) return false;
      }
      if (team && !p.team.toLowerCase().includes(team)) return false;
      if (activeRules.length > 0) {
        const attrs = attrsFor(p);
        for (const r of activeRules) {
          if (attrs[r.attr] < Number(r.min)) return false;
        }
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, eras, minN, maxN, pos, minHt, teamQ, rules]);

  // Gate on DISTINCT NAMES, not entries: the draft excludes picks by name
  // (rollOptions in PlayerOptions), and the roster duplicates names across
  // (and even within) eras. Counting entries lets a pool with e.g. 4 entries
  // but 2 distinct names pass 2v2 and soft-lock the draft mid-way. The match
  // count display stays entry-based on purpose.
  const distinctNames = useMemo(
    () => new Set(filtered.map((p) => p.name)).size,
    [filtered]
  );
  const canSubmit = eraCount > 0 && distinctNames >= 2 * size;

  const resetFilters = () => {
    setPos({});
    setMinHt(0);
    setTeamQ("");
    setRules([]);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const queryParams = {
      min: String(minN),
      max: String(maxN),
      curr: eras.curr ? "on" : "off",
      class: eras.class ? "on" : "off",
      allt: eras.allt ? "on" : "off",
    };
    if (posKeys.length > 0) queryParams.positions = posKeys.join(",");
    if (minHt > 0) queryParams.minHeight = String(minHt);
    if (teamQ.trim()) queryParams.team = teamQ.trim();
    const activeRules = rules.filter((r) => r.min !== "");
    if (activeRules.length > 0) {
      queryParams.attrRules = activeRules
        .map((r) => `${r.attr}>=${r.min}`)
        .join(",");
    }
    trackEvent({
      eventType: "query_executed",
      metadata: {
        gameSize: `${size}v${size}`,
        queryParams: JSON.stringify(queryParams),
      },
    });
    onSubmit(filtered, size);
  };

  // Clamp overall inputs to digits, 0-99; allow empty while typing.
  const handleOverall = (setter) => (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setter(raw);
  };

  const labelCls = "font-pixel font-semibold text-[24px] leading-tight";
  const advLabelCls = "font-pixel font-semibold text-[22px] leading-tight";

  return (
    <main className="relative z-10 w-full flex flex-col items-center px-4 pb-20">
      <WordmarkNav />
      <ClockChip />
      <h1 className="font-press text-[40px] text-cream bb-outline-4 mt-24 mb-10 text-center">
        QUERY
      </h1>

      <div className="bb-panel w-full max-w-[600px] p-[30px] flex flex-col gap-[24px]">
        {/* Overall wells */}
        <div className="flex items-center justify-between gap-4">
          <label className={labelCls} htmlFor="min-overall">
            Min Overall:
          </label>
          <input
            id="min-overall"
            data-kbnav="0"
            data-kbstep=""
            className="bb-well w-[96px] font-vt text-[28px] text-center py-1"
            style={{ color: accent }}
            inputMode="numeric"
            value={minOv}
            onChange={handleOverall(setMinOv)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <label className={labelCls} htmlFor="max-overall">
            Max Overall:
          </label>
          <input
            id="max-overall"
            data-kbnav="1"
            data-kbstep=""
            className="bb-well w-[96px] font-vt text-[28px] text-center py-1"
            style={{ color: accent }}
            inputMode="numeric"
            value={maxOv}
            onChange={handleOverall(setMaxOv)}
          />
        </div>

        {/* Era checkboxes */}
        {ERAS.map((era, eraIdx) => (
          <div key={era.key} className="flex items-center justify-between gap-4">
            <label className={labelCls} htmlFor={`era-${era.key}`}>
              {era.label}
            </label>
            <button
              id={`era-${era.key}`}
              data-kbnav={String(2 + eraIdx)}
              type="button"
              role="checkbox"
              aria-checked={eras[era.key]}
              aria-label={era.label}
              className={`bb-checkbox${eras[era.key] ? " bb-checkbox-on" : ""}`}
              onClick={() =>
                setEras((prev) => ({ ...prev, [era.key]: !prev[era.key] }))
              }
            />
          </div>
        ))}

        {/* Game size segments */}
        <div className="flex items-center justify-center gap-[14px] flex-wrap pt-1">
          {SIZES.map((n) => (
            <button
              key={n}
              type="button"
              data-kbnav="5"
              className={`bb-seg text-[11px] px-3 py-2${
                size === n ? " bb-seg-on" : ""
              }`}
              aria-pressed={size === n}
              onClick={() => setSize(n)}
            >
              {n}V{n}
            </button>
          ))}
        </div>

        {/* Advanced filters */}
        <button
          type="button"
          data-kbnav="6"
          className="font-press text-[10px] self-start"
          style={{ color: accent }}
          onClick={() => setAdvOpen((o) => !o)}
        >
          {advOpen ? "− ADVANCED FILTERS" : "+ ADVANCED FILTERS"}
        </button>

        {advOpen && (
          <div
            className="flex flex-col gap-[20px] pt-[20px]"
            style={{ borderTop: "2px dotted rgba(143, 131, 173, 0.5)" }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className={advLabelCls}>Position:</span>
              <span className="flex gap-[12px] flex-wrap">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-kbnav="7"
                    className={`bb-seg text-[9px] px-2.5 py-2${
                      pos[p] ? " bb-seg-on" : ""
                    }`}
                    aria-pressed={!!pos[p]}
                    onClick={() =>
                      setPos((prev) => ({ ...prev, [p]: !prev[p] }))
                    }
                  >
                    {p}
                  </button>
                ))}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className={advLabelCls}>Min height:</span>
              <span className="flex gap-[12px] flex-wrap">
                {HEIGHTS.map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    data-kbnav="8"
                    className={`bb-seg text-[9px] px-2.5 py-2${
                      minHt === h.inches ? " bb-seg-on" : ""
                    }`}
                    aria-pressed={minHt === h.inches}
                    onClick={() => setMinHt(h.inches)}
                  >
                    {h.label}
                  </button>
                ))}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className={advLabelCls} htmlFor="team-filter">
                Team:
              </label>
              <input
                id="team-filter"
                data-kbnav="9"
                className="bb-well flex-1 max-w-[260px] font-vt text-[20px] px-3 py-1"
                style={{ color: accent }}
                value={teamQ}
                onChange={(e) => setTeamQ(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-[12px]">
              <span className={advLabelCls}>Attribute rules:</span>
              {rules.map((rule, ruleIdx) => (
                <div key={rule.id} className="flex items-center gap-[10px]">
                  <select
                    data-kbnav={String(10 + ruleIdx)}
                    className="bb-well font-vt text-[20px] px-2 py-1 flex-1"
                    style={{ color: accent }}
                    value={rule.attr}
                    onChange={(e) =>
                      setRules((prev) =>
                        prev.map((r) =>
                          r.id === rule.id ? { ...r, attr: e.target.value } : r
                        )
                      )
                    }
                  >
                    {ATTR_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {ATTR_NAMES[k]}
                      </option>
                    ))}
                  </select>
                  <span className="font-vt text-[22px]">≥</span>
                  <input
                    data-kbnav={String(10 + ruleIdx)}
                    data-kbstep=""
                    className="bb-well w-[64px] font-vt text-[20px] text-center py-1"
                    style={{ color: accent }}
                    inputMode="numeric"
                    value={rule.min}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setRules((prev) =>
                        prev.map((r) =>
                          r.id === rule.id ? { ...r, min: raw } : r
                        )
                      );
                    }}
                  />
                  <button
                    type="button"
                    data-kbnav={String(10 + ruleIdx)}
                    className="font-press text-[10px] text-muted hover:text-action px-1"
                    aria-label="Remove rule"
                    onClick={() =>
                      setRules((prev) => prev.filter((r) => r.id !== rule.id))
                    }
                  >
                    X
                  </button>
                </div>
              ))}
              {/* bb-seg (not bb-chip): the outlined chip's cream ring is
                  invisible on the light panel skin; segs are skin-aware. */}
              <button
                type="button"
                data-kbnav="40"
                className="bb-seg text-[9px] px-3 py-2 self-start"
                onClick={() =>
                  setRules((prev) => [
                    ...prev,
                    { id: ++ruleId, attr: "ins", min: "80" },
                  ])
                }
              >
                + ADD RULE
              </button>
            </div>

            <button
              type="button"
              data-kbnav="41"
              className="font-vt text-[20px] self-start hover:text-action"
              style={{ textDecorationLine: "underline", textDecorationStyle: "dotted" }}
              onClick={resetFilters}
            >
              RESET FILTERS
            </button>
          </div>
        )}

        {/* Live match count */}
        {loadError ? (
          <button
            type="button"
            data-kbnav="50"
            className="font-vt text-[20px] text-action text-center"
            onClick={() => setRetryNonce((n) => n + 1)}
          >
            COULDN'T LOAD PLAYERS — CLICK TO RETRY
          </button>
        ) : (
          <p className="font-vt text-[20px] text-muted text-center">
            {players === null
              ? "LOADING PLAYERS..."
              : eraCount === 0
              ? "CHECK AT LEAST ONE ERA"
              : `${filtered.length} PLAYERS MATCH`}
          </p>
        )}
      </div>

      <button
        type="button"
        data-kbnav="60"
        className="bb-btn text-[18px] mt-10"
        style={{ padding: "20px 56px" }}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        SUBMIT
      </button>
    </main>
  );
}
