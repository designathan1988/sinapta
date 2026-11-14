// Rows read from SQLite are parsed here, at the database's boundary, as
// JSON is parsed at the client's.
import * as v from "valibot";

export const countRowSchema = v.object({ count: v.number() });

export const migrationRowSchema = v.object({ id: v.number() });

export const userRowSchema = v.object({
  id: v.string(),
  email: v.string(),
  name: v.string(),
  photo: v.nullable(v.string()),
  password_hash: v.nullable(v.string()),
  created_at: v.number(),
});

export type UserRow = v.InferOutput<typeof userRowSchema>;

export const sessionRowSchema = v.object({
  user_id: v.string(),
  expires_at: v.number(),
});

export const codeRowSchema = v.object({
  code_hash: v.string(),
  expires_at: v.number(),
  tries: v.number(),
});

// One row, or undefined when the query found none.
export function readRow<TSchema extends v.GenericSchema>(
  schema: TSchema,
  row: unknown,
): v.InferOutput<TSchema> | undefined {
  return row === undefined ? undefined : v.parse(schema, row);
}
