// A page version as a member sends it, and as SQLite keeps it, parsed at
// the boundary (Notion's page history, kept on this server).
import * as v from "valibot";
import { blockSchema, type Block } from "../src/model/index.ts";

const MAX_BLOCKS = 10_000;

const takenAtSchema = v.pipe(
  v.string(),
  v.maxLength(40),
  v.check((text) => !Number.isNaN(Date.parse(text))),
);

export const versionBodySchema = v.object({
  id: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  takenAt: takenAtSchema,
  blocks: v.pipe(v.array(blockSchema), v.maxLength(MAX_BLOCKS)),
});

const versionRowSchema = v.object({
  id: v.string(),
  taken_at: v.string(),
  blocks: v.string(),
});

const blocksSchema = v.array(blockSchema);

export interface PageVersionReply {
  readonly id: string;
  readonly takenAt: string;
  readonly blocks: readonly Block[];
}

function blocksOf(text: string): Block[] | undefined {
  try {
    const parsed = v.safeParse(blocksSchema, JSON.parse(text));
    return parsed.success ? parsed.output : undefined;
  } catch {
    return undefined;
  }
}

// The rows that parse, each as the client reads it; a row that does not
// is left out, never repaired.
export function readVersionRows(rows: readonly unknown[]): PageVersionReply[] {
  return rows.flatMap((row) => {
    const parsed = v.safeParse(versionRowSchema, row);
    if (!parsed.success) return [];
    const blocks = blocksOf(parsed.output.blocks);
    if (blocks === undefined) return [];
    return [{ id: parsed.output.id, takenAt: parsed.output.taken_at, blocks }];
  });
}
