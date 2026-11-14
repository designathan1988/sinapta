// The bodies the account routes accept.
import * as v from "valibot";

const email = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.maxLength(254),
  v.email(),
);
const password = v.pipe(v.string(), v.minLength(8), v.maxLength(200));

export const lookupSchema = v.object({ email });

export const signUpSchema = v.object({
  email,
  password,
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
});

export const signInSchema = v.object({
  email,
  password: v.pipe(v.string(), v.maxLength(200)),
});

export const profileSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
});

export const codeSchema = v.object({
  email,
  code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/)),
});

export function parseBody<TSchema extends v.GenericSchema>(
  schema: TSchema,
  body: unknown,
): v.InferOutput<TSchema> {
  return v.parse(schema, body);
}
