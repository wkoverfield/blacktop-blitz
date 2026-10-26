import React, { useLayoutEffect, useState } from "react";
import TeamQuery from "./TeamQuery";
import PlayerOptions from "./PlayerOptions";
import TeamVersus from "./TeamVersus";
import { scrollAppToTop } from "../lib/scroll";

/**
 * /qplay state machine: query → draft → versus (all internal states of
 * the same route, per spec). The draft replaced the old MUI modal.
 */
export default function TeamSelection() {
  const [phase, setPhase] = useState("query");
  const [pool, setPool] = useState([]);
  const [size, setSize] = useState(1);
  const [teamOne, setTeamOne] = useState([]);
  const [teamTwo, setTeamTwo] = useState([]);

  // Phases swap in place inside the app's scroll container, so each one
  // would otherwise open at the previous phase's scroll offset (the draft
  // landing mid-page after a long query form, versus mid-list).
  useLayoutEffect(() => {
    scrollAppToTop();
  }, [phase]);

  const startDraft = (filteredPlayers, gameSize) => {
    setPool(filteredPlayers);
    setSize(gameSize);
    setPhase("draft");
  };

  const finishDraft = (one, two) => {
    setTeamOne(one);
    setTeamTwo(two);
    setPhase("versus");
  };

  const abandonDraft = () => setPhase("query");

  const resetGame = () => {
    setTeamOne([]);
    setTeamTwo([]);
    setPhase("query");
  };

  if (phase === "draft") {
    return (
      <PlayerOptions
        pool={pool}
        size={size}
        onDone={finishDraft}
        onAbandon={abandonDraft}
      />
    );
  }

  if (phase === "versus") {
    return (
      <TeamVersus teamOne={teamOne} teamTwo={teamTwo} onPlayAgain={resetGame} />
    );
  }

  return <TeamQuery onSubmit={startDraft} />;
}
