import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Public mutation for tracking analytics events from React components.
 * Fire-and-forget: call without awaiting the result.
 */
export const trackEvent = mutation({
  args: {
    eventType: v.string(),
    metadata: v.optional(v.object({
      gameSize: v.optional(v.string()),
      queryParams: v.optional(v.string()),
      roundNumber: v.optional(v.number()),
      totalRounds: v.optional(v.number()),
      // Joins the draft_* events of one draft (draft_started,
      // player_selected, draft_completed, draft_abandoned).
      draftId: v.optional(v.string()),
      // draft_abandoned only: "exit" (X / Esc), "hidden" (tab or app
      // hidden), "pagehide" (page unloaded).
      reason: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { eventType, metadata }) => {
    await ctx.db.insert("analyticsEvents", {
      eventType,
      timestamp: Date.now(),
      metadata,
    });

    // Also maintain a cumulative aggregate per eventType so lifetime totals
    // survive the 90-day cleanup cron (raw events = rolling detail).
    const existing = await ctx.db
      .query("analyticsAggregates")
      .withIndex("by_type", (q) => q.eq("eventType", eventType))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1, lastUpdated: Date.now() });
    } else {
      await ctx.db.insert("analyticsAggregates", { eventType, count: 1, lastUpdated: Date.now() });
    }
  },
});

/**
 * Get total count of completed drafts
 */
export const getTotalDraftsCompleted = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_type", (q) => q.eq("eventType", "draft_completed"))
      .collect();
    return events.length;
  },
});

/**
 * Get drafts per day for the last N days
 */
export const getDraftsPerDay = query({
  args: { days: v.number() },
  handler: async (ctx, { days }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_type_and_timestamp", (q) =>
        q.eq("eventType", "draft_completed").gte("timestamp", cutoff)
      )
      .collect();

    const counts: Record<string, number> = {};
    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().split("T")[0];
      counts[date] = (counts[date] || 0) + 1;
    }
    return counts;
  },
});

/**
 * Get popular game sizes
 */
export const getPopularGameSizes = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_type", (q) => q.eq("eventType", "draft_completed"))
      .collect();

    const counts: Record<string, number> = {};
    for (const event of events) {
      const gameSize = event.metadata?.gameSize || "unknown";
      counts[gameSize] = (counts[gameSize] || 0) + 1;
    }
    return counts;
  },
});

/**
 * Get event counts by type
 */
export const getEventCounts = query({
  args: {},
  handler: async (ctx) => {
    const allEvents = await ctx.db.query("analyticsEvents").collect();
    const counts: Record<string, number> = {};
    for (const event of allEvents) {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    }
    return counts;
  },
});

/**
 * Internal mutation to clean up old analytics events (called by cron)
 */
export const cleanupOldEvents = internalMutation({
  args: { retentionDays: v.number() },
  handler: async (ctx, { retentionDays }) => {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const oldEvents = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .collect();

    let deleted = 0;
    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
      deleted++;
    }

    if (deleted > 0) {
      console.log(`[analytics] Cleaned up ${deleted} events older than ${retentionDays} days`);
    }
  },
});

/**
 * Get all cumulative aggregate counts (lifetime, survives the cleanup cron).
 */
export const getAllAggregates = query({
  args: {},
  handler: async (ctx) => {
    const aggs = await ctx.db.query("analyticsAggregates").collect();
    const result: Record<string, number> = {};
    for (const a of aggs) result[a.eventType] = a.count;
    return result;
  },
});

/**
 * Internal: set an aggregate count directly. Used for the one-time backfill/seed
 * to an honest lifetime floor (max of current 90-day count and the documented
 * baseline) so totals grow accurately from there.
 */
export const setAggregateCount = internalMutation({
  args: { eventType: v.string(), count: v.number() },
  handler: async (ctx, { eventType, count }) => {
    const existing = await ctx.db
      .query("analyticsAggregates")
      .withIndex("by_type", (q) => q.eq("eventType", eventType))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { count, lastUpdated: Date.now() });
    } else {
      await ctx.db.insert("analyticsAggregates", { eventType, count, lastUpdated: Date.now() });
    }
    return { eventType, count };
  },
});
