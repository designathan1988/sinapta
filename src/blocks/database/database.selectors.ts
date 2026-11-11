import { isBlockOfType, type BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { DATABASE_TYPE } from "../page/index.ts";
import type { DatabaseBlock } from "./database.schema.ts";

// A database's rows: its child pages that are not templates.
export function rowIdsOf(database: DatabaseBlock): readonly BlockId[] {
  const { templateIds } = database.props;
  if (templateIds.length === 0) return database.childIds;
  return database.childIds.filter((id) => !templateIds.includes(id));
}

export function selectDatabase(
  state: AppState,
  blockId: BlockId | null,
): DatabaseBlock | undefined {
  const block = blockId === null ? undefined : state.workspace.blocks[blockId];
  if (block === undefined) return undefined;
  return isBlockOfType<DatabaseBlock>(block, DATABASE_TYPE) ? block : undefined;
}
