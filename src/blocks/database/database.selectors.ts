import { isBlockOfType, type BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { DATABASE_TYPE } from "../page/index.ts";
import type { DatabaseBlock } from "./database.schema.ts";

export function selectDatabase(
  state: AppState,
  blockId: BlockId | null,
): DatabaseBlock | undefined {
  const block = blockId === null ? undefined : state.workspace.blocks[blockId];
  if (block === undefined) return undefined;
  return isBlockOfType<DatabaseBlock>(block, DATABASE_TYPE) ? block : undefined;
}
