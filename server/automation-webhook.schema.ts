// An automation's webhook as a member's client asks the server to send
// it, parsed at the boundary: the address, and the page it ran on.
import * as v from "valibot";

export const webhookBodySchema = v.object({
  url: v.pipe(v.string(), v.minLength(1), v.maxLength(2000)),
  payload: v.object({
    source: v.object({
      type: v.literal("automation"),
      automation_id: v.pipe(v.string(), v.maxLength(200)),
    }),
    data: v.object({
      object: v.literal("page"),
      id: v.pipe(v.string(), v.maxLength(200)),
      title: v.pipe(v.string(), v.maxLength(2000)),
      properties: v.record(v.string(), v.unknown()),
    }),
  }),
});
