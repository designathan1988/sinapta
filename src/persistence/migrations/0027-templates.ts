// Version 27 gives each database its row templates. A version 26
// database had none, and no default.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withTemplates(block: unknown): unknown {
  if (!isRecord(block) || block.type !== "database") return block;
  const props = isRecord(block.props) ? block.props : {};
  return {
    ...block,
    props: { ...props, templateIds: [], defaultTemplateId: null },
  };
}

export const addTemplates: Migration = (file) => {
  const { blocks } = file;
  if (!isRecord(blocks)) return file;
  const migrated = Object.fromEntries(
    Object.entries(blocks).map(([id, block]) => [id, withTemplates(block)]),
  );
  return { ...file, blocks: migrated };
};
