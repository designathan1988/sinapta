// The server's account answers, parsed at the boundary like stored data.
import * as v from "valibot";
import type { AccountUser } from "../state/index.ts";

const userSchema = v.object({
  id: v.string(),
  email: v.string(),
  name: v.string(),
  photo: v.nullable(v.string()),
});

const userReplySchema = v.object({ user: userSchema });

const lookupReplySchema = v.object({
  exists: v.boolean(),
  hasPassword: v.boolean(),
});

// The body's JSON, or undefined for an empty or broken body.
export function parseReply(text: string): unknown {
  if (text === "") return undefined;
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return undefined;
  }
}

export function readUser(body: unknown): AccountUser | undefined {
  const result = v.safeParse(userReplySchema, body);
  return result.success ? result.output.user : undefined;
}

export function readLookup(
  body: unknown,
): v.InferOutput<typeof lookupReplySchema> | undefined {
  const result = v.safeParse(lookupReplySchema, body);
  return result.success ? result.output : undefined;
}

const aiReplySchema = v.object({ text: v.string() });

// The AI's answer, or undefined when the server sent none.
export function readAiReply(body: unknown): string | undefined {
  const reply = v.safeParse(aiReplySchema, body);
  return reply.success ? reply.output.text : undefined;
}
