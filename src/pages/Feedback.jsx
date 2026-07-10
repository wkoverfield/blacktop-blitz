import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { getVisitorId } from "../utils/visitorId";
import WordmarkNav from "../components/WordmarkNav";
import ClockChip from "../components/ClockChip";

/**
 * Feedback — title + skin-aware panel (600px) with a single textarea and a
 * SEND button wired to the existing Convex feedback mutation
 * (type "other", title = first 80 chars, description = full text).
 * Spec: docs/context/design-handoff-retro.md, screen 6.
 */
export default function Feedback() {
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
    </div>
  );
}
