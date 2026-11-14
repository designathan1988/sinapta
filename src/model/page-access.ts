// Notion's access levels on a shared page (ADR-0013), and which changes
// each allows: the server and the client judge a guest's changes alike.
import type { Block } from "./block.schema.ts";
import type { Operation } from "./operation.ts";

export type PageAccess = "full" | "edit" | "comment" | "view";

// Fields a comment changes besides the text's marks and the discussions:
// the record's time and its last editor.
const STAMPS = new Set(["props", "updatedAt", "editedBy"]);

function textOf(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((span: unknown) =>
      typeof span === "object" &&
      span !== null &&
      "text" in span &&
      typeof span.text === "string"
        ? span.text
        : "",
    )
    .join("");
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

// A prop a comment may change: the page's discussions, or a text whose
// words stay the same while its comment marks move.
function isCommentProp(key: string, before: unknown, after: unknown): boolean {
  if (same(before, after) || key === "discussions") return true;
  if (key !== "text") return false;
  const words = textOf(after);
  return words !== undefined && words === textOf(before);
}

// True when an update only adds, answers or resolves comments.
export function isCommentChange(
  operation: Operation,
  current: Block | undefined,
): boolean {
  if (operation.type !== "record.update" || operation.kind !== "block") {
    return false;
  }
  if (current === undefined) return false;
  const { patch } = operation;
  const record = new Map(Object.entries(current));
  const fields = Object.entries(patch).filter(([key]) => !STAMPS.has(key));
  const isRecordKept = fields.every(([key, value]) =>
    same(value, record.get(key)),
  );
  const props = Object.entries(patch.props ?? {});
  return (
    isRecordKept &&
    props.every(([key, value]) => isCommentProp(key, current.props[key], value))
  );
}

// Whether a change at this access is allowed.
export function mayChange(
  access: PageAccess | undefined,
  isComment: boolean,
): boolean {
  if (access === "full" || access === "edit") return true;
  return access === "comment" && isComment;
}
