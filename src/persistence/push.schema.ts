// The server's Web Push key, as it answers /api/push/key.
import * as v from "valibot";

const keyReplySchema = v.object({
  publicKey: v.pipe(v.string(), v.minLength(1)),
});

export function readPushKey(body: unknown): string | undefined {
  const reply = v.safeParse(keyReplySchema, body);
  return reply.success ? reply.output.publicKey : undefined;
}
