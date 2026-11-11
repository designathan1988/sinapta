// Moving a card on a board: into another column, which gives the row the
// column's value, and to a place among the cards, which is the database's
// own order. Both happen in one undo step.
import type { BlockId, PropertyId } from "../../../../model/index.ts";
import { defineCommand } from "../../../../state/index.ts";
import { moveRowOperations } from "../../row-bulk.commands.ts";
import { rowValueUpdate, selectRow } from "../../row.commands.ts";

export interface MoveCardPayload {
  readonly rowId: BlockId;
  // The card it goes before, null for the end; the same place when the
  // view is sorted and keeps no order of its own.
  readonly beforeRowId: BlockId | null;
  // The value of the new column, or null within the same column.
  readonly change: {
    readonly propertyId: PropertyId;
    readonly value: unknown;
  } | null;
}

export const moveCard = defineCommand<MoveCardPayload>({
  type: "board.moveCard",
  handle(state, command) {
    const row = selectRow(state, command.rowId);
    const moves = moveRowOperations(state, command.rowId, command.beforeRowId);
    if (row === undefined || moves === undefined) return {};
    const { change } = command;
    const value =
      change === null ? [] : [rowValueUpdate(row, change, command.meta.now)];
    return { operations: [...value, ...moves] };
  },
});

export const boardCardCommands = [moveCard];
