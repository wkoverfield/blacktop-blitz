import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { getVisitorId } from "../utils/visitorId";
import WordmarkNav from "../components/WordmarkNav";
import ClockChip from "../components/ClockChip";
import useKeyboardNav from "../hooks/useKeyboardNav";

/**
 * Feedback — title + skin-aware panel (600px) with a single textarea and a
 * SEND button wired to the existing Convex feedback mutation
 * (type "other", title = first 80 chars, description = full text).
 * Spec: docs/context/design-handoff-retro.md, screen 6.
 *
 * Below the form: the community board (packet 002) — every submission with a
 * type chip, title, description, optional author, and a toggleable upvote.
 * Convex query is already sorted upvotes desc, then createdAt desc.
 */

function BoardRow({ item, hasVoted, onToggleVote, navRow }) {
  return (
    <article className="bb-board-row flex items-start gap-5 py-5 first:pt-0 last:pb-0">
      <button
        type="button"
        data-kbnav={navRow}
        aria-pressed={hasVoted}
        aria-label={`${hasVoted ? "Remove upvote from" : "Upvote"} ${item.title}`}
        onClick={onToggleVote}
        className={`bb-seg flex min-h-[44px] min-w-[44px] shrink-0 flex-col items-center justify-center gap-1.5 px-2 py-2 text-[10px] ${
          hasVoted ? "bb-seg-on" : ""
        }`}
      >
        <span aria-hidden="true">▲</span>
        <span>{item.upvotes}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="bb-chip-filled px-2 py-1 text-[8px] uppercase">
            {item.type}
          </span>
          {item.status === "completed" && (
            <span className="bb-chip-filled px-2 py-1 text-[8px] uppercase">
              ✓ FIXED
            </span>
          )}
          {item.authorName && (
            <span className="font-vt text-[18px] uppercase text-muted">
              BY {item.authorName}
            </span>
          )}
        </div>
        <h3 className="break-words font-press text-[10px] leading-relaxed">
          {item.title}
        </h3>
        <p className="mt-1.5 break-words font-vt text-[20px] leading-tight">
          {item.description}
        </p>
      </div>
    </article>
  );
}

function FeedbackBoard() {
  const [visitorId] = useState(() => getVisitorId());
  const feedback = useQuery(api.feedback.getFeedback);
  const upvote = useMutation(api.feedback.upvoteFeedback);
  const removeUpvote = useMutation(api.feedback.removeUpvote);

  const handleToggleVote = async (feedbackId, hasVoted) => {
    try {
      if (hasVoted) {
        await removeUpvote({ feedbackId, visitorId });
      } else {
        await upvote({ feedbackId, visitorId });
      }
    } catch (error) {
      console.error("Failed to toggle vote:", error);
    }
  };

  return (
    <>
      <h2 className="mb-6 mt-12 text-center font-press text-[12px] text-cream bb-outline-2">
        THE BOARD
      </h2>

      <section
        aria-label="Community feedback board"
        className="bb-panel w-full max-w-[600px] p-[30px]"
      >
        {feedback === undefined ? (
          <p className="text-center font-vt text-[20px] text-muted">
            LOADING...
          </p>
        ) : feedback.length === 0 ? (
          <p className="text-center font-vt text-[20px] text-muted">
            NO FEEDBACK YET — BE THE FIRST
          </p>
        ) : (
          feedback.map((item, idx) => {
            const hasVoted = item.upvoterIds.includes(visitorId);
            return (
              <BoardRow
                key={item._id}
                item={item}
                hasVoted={hasVoted}
                onToggleVote={() => handleToggleVote(item._id, hasVoted)}
                navRow={String(10 + idx)}
              />
            );
          })
        )}
      </section>
    </>
  );
}
export default function Feedback() {
  // Keyboard nav (packet 003): row 0 textarea (typing stays fully native —
  // Enter is a newline; Esc blurs back to nav), row 1 SEND, rows 10+ the
  // board's upvote buttons. Esc outside a text control = back to the title
  // screen (game "B button"); inside the textarea the first Esc blurs.
  const navigate = useNavigate();
  useKeyboardNav({ onEscape: () => navigate("/") });
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitFeedback = useMutation(api.feedback.submitFeedback);

  const canSend = text.trim().length > 0 && !submitting;

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        type: "other",
        title: trimmed.slice(0, 80),
        description: trimmed.slice(0, 500),
        visitorId: getVisitorId(),
      });
      setText("");
      setSent(true);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
    setSubmitting(false);
  };

  return (
    <div className="relative flex min-h-full flex-col items-center overflow-y-auto px-4 pb-16 pt-20">
      <WordmarkNav />
      <ClockChip />

      <h1 className="mb-10 text-center font-press text-[clamp(28px,6vw,40px)] text-cream bb-outline-4">
        FEEDBACK
      </h1>

      <section className="bb-panel w-full max-w-[600px] p-[30px]">
        <label
          htmlFor="bb-feedback-text"
          className="mb-4 block font-pixel text-[24px]"
        >
          Your feedback:
        </label>
        <textarea
          id="bb-feedback-text"
          data-kbnav="0"
          value={text}
          maxLength={500}
          placeholder="Bugs, ideas, players we're missing..."
          onChange={(e) => {
            setText(e.target.value);
            if (sent) setSent(false);
          }}
          className="bb-well block h-[150px] w-full resize-none border-0 p-4 font-vt text-[22px] outline-none placeholder:text-muted"
        />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            data-kbnav="1"
            onClick={handleSend}
            disabled={!canSend}
            className="bb-btn px-8 py-4 text-[16px]"
          >
            SEND
          </button>
          {sent && (
            <p
              role="status"
              className="font-press text-[10px] text-[#05c715]"
            >
              THANKS! FEEDBACK SENT.
            </p>
          )}
        </div>
      </section>

      <FeedbackBoard />
    </div>
  );
}
