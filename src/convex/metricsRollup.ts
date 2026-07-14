import { internalMutation, query } from "./_generated/server";

const dstr = (ms: number) => new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

/**
 * Bank a permanent daily snapshot of every cumulative usage counter.
 *
 * analyticsAggregates and pageviewCounters never prune, but each holds only a
 * single running total: the day-by-day history is not recoverable from them,
 * and raw analyticsEvents are pruned at 90 days. Recording the running totals
 * once per UTC day makes any window (7d / 30d / yearly) derivable forever from
 * consecutive snapshots. The delta between two days' snapshots is that day's
 * real activity, which also cancels the backfilled floor baked into the
 * lifetime aggregates, so going-forward per-day numbers stay correct.
 *
 * Idempotent: exactly one row per UTC date. A second run on the same day
 * patches the existing row instead of inserting a duplicate.
 */
export const snapshotDailyMetrics = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const date = dstr(now);

    const metrics: Record<string, number> = {};

    // Cumulative lifetime action counts (survive the 90-day event prune).
    const aggs = await ctx.db.query("analyticsAggregates").collect();
    for (const a of aggs) metrics[`action:${a.eventType}`] = a.count;

    // Pageview counters: cumulative total plus this UTC day's running tallies.
    const counters = await ctx.db.query("pageviewCounters").collect();
    const byKey: Record<string, number> = {};
    for (const c of counters) byKey[c.key] = c.count;
    metrics["pageviews_total"] = byKey["total"] ?? 0;
    metrics["pageviews_today"] = byKey[`day:${date}`] ?? 0;
    metrics["uniques_today"] = byKey[`uvday:${date}`] ?? 0;

    const existing = await ctx.db
      .query("metricSnapshots")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { capturedAt: now, metrics });
    } else {
      await ctx.db.insert("metricSnapshots", { date, capturedAt: now, metrics });
    }

    return { date, metricKeys: Object.keys(metrics).length };
  },
});

/**
 * Return the full snapshot series ordered by date (oldest first).
 */
export const getMetricSnapshots = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("metricSnapshots").withIndex("by_date").collect();
    return rows.map((r) => ({ date: r.date, capturedAt: r.capturedAt, metrics: r.metrics }));
  },
});
