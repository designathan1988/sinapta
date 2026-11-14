// A page view as a member sends it, and as SQLite keeps it, parsed at the
// boundary (Notion's page analytics, kept on this server).
import * as v from "valibot";

export const viewBodySchema = v.object({
  viewedAt: v.pipe(
    v.string(),
    v.maxLength(40),
    v.check((text) => !Number.isNaN(Date.parse(text))),
  ),
});

export const viewRowSchema = v.object({
  viewed_at: v.string(),
  name: v.string(),
  hidden: v.number(),
});

export const historyBodySchema = v.object({ allowed: v.boolean() });
