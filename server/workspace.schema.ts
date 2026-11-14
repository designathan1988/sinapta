// The bodies the workspace routes accept.
import * as v from "valibot";
import { parseWireOperations } from "../src/model/index.ts";

export const createWorkspaceSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
  // The workspace file the first client uploads, kept as it came.
  snapshot: v.record(v.string(), v.unknown()),
});

const postOperationsSchema = v.object({
  clientId: v.pipe(v.string(), v.minLength(8), v.maxLength(64)),
  operations: v.pipe(v.array(v.unknown()), v.minLength(1), v.maxLength(5000)),
});

export function parseBody<TSchema extends v.GenericSchema>(
  schema: TSchema,
  body: unknown,
): v.InferOutput<TSchema> {
  return v.parse(schema, body);
}

// A client's transaction: its id and operations in the model's shape, or
// undefined when one operation is malformed.
export function parseOperations(body: unknown) {
  const { clientId, operations } = v.parse(postOperationsSchema, body);
  const parsed = parseWireOperations(operations);
  return parsed === undefined ? undefined : { clientId, operations: parsed };
}
