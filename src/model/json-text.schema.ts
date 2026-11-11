import * as v from "valibot";

// Text from an imported file becomes a value here, at the boundary, so that
// nothing outside the schemas decodes JSON. The value is still unchecked:
// migrations and the workspace schema give it a type.
const jsonTextSchema = v.pipe(v.string(), v.parseJson());

export type ParseJsonResult =
  { readonly ok: true; readonly json: unknown } | { readonly ok: false };

export function parseJsonText(text: string): ParseJsonResult {
  const result = v.safeParse(jsonTextSchema, text);
  return result.success ? { ok: true, json: result.output } : { ok: false };
}
