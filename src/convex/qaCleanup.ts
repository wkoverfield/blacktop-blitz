import { internalMutation } from "./_generated/server";

/**
 * Permanent QA teardown helper (builder-protocol: QA discipline).
 * Deletes feedback rows created during QA — anything whose title or
 * description carries the [QA-TEST] prefix. Internal-only: not callable
 * from clients. Run with:
 *   npx convex run qaCleanup:purgeQaFeedback
 */
export const purgeQaFeedback = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("feedback").collect();
    const qaRows = rows.filter(
      (r) =>
        r.title?.startsWith("[QA-TEST]") ||
        r.description?.startsWith("[QA-TEST]")
    );
    for (const row of qaRows) {
      await ctx.db.delete(row._id);
    }
    return { deleted: qaRows.length };
  },
});
