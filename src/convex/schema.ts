import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  feedback: defineTable({
    type: v.string(), // "feature" | "bug" | "improvement" | "other"
    title: v.string(),
    description: v.string(),
    status: v.string(), // "pending" | "planned" | "completed" | "declined"
    upvotes: v.number(),
    upvoterIds: v.array(v.string()), // Track who voted (prevent double voting)
    authorName: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_upvotes", ["upvotes"])
    .index("by_status", ["status"]),

  analyticsEvents: defineTable({
    eventType: v.string(),
    timestamp: v.number(),
    // Loosely typed: tolerate legacy/ad-hoc fields on old events so the schema
    // deploys cleanly against existing data. Current code writes structured
    // metadata (gameSize / queryParams / roundNumber / totalRounds).
    metadata: v.optional(v.any()),
  })
    .index("by_type", ["eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_type_and_timestamp", ["eventType", "timestamp"]),

  // Cumulative per-eventType counts so lifetime totals survive the 90-day
  // cleanup cron (raw analyticsEvents are pruned; these are not).
  analyticsAggregates: defineTable({
    eventType: v.string(),
    count: v.number(),
    lastUpdated: v.number(),
  }).index("by_type", ["eventType"]),

  // --- Site stats (pageview analytics) ---
  // Cumulative counters keyed by "total" | "path:<p>" | "day:<YYYY-MM-DD>" | "uvday:<YYYY-MM-DD>".
  pageviewCounters: defineTable({
    key: v.string(),
    count: v.number(),
  }).index("by_key", ["key"]),

  // Per-day unique-visitor dedup rows (pruned > 120 days by cron).
  pageviewVisits: defineTable({
    date: v.string(),
    visitorId: v.string(),
  }).index("by_date_and_visitor", ["date", "visitorId"]),

  // Permanent daily snapshot of every cumulative usage counter. The source
  // aggregates never hold day-by-day history, and raw analyticsEvents prune at
  // 90 days; banking the running totals once per UTC day makes any window
  // (7d / 30d / yearly) derivable forever from consecutive snapshots.
  metricSnapshots: defineTable({
    date: v.string(), // UTC "YYYY-MM-DD"
    capturedAt: v.number(),
    metrics: v.record(v.string(), v.number()),
  }).index("by_date", ["date"]),
});
