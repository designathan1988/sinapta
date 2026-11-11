// Pressing a row's button: its values are set in one step that one undo
// takes back, and the row opens as a page when the button says so.
import { selectDatabase } from "../../../../blocks/database/index.ts";
import { selectPage } from "../../../../blocks/page/index.ts";
import type { BlockId, PropertyId } from "../../../../model/index.ts";
import { defineCommand } from "../../../../state/index.ts";
import { isToday, readButtonPropertyConfig } from "./button-property.schema.ts";

export const pressRowButton = defineCommand<{
  rowId: BlockId;
  propertyId: PropertyId;
}>({
  type: "row.pressButton",
  handle(state, command) {
    const row = selectPage(state, command.rowId);
    const property = selectDatabase(
      state,
      row?.parentId ?? null,
    )?.props.properties.find((item) => item.id === command.propertyId);
    if (row === undefined || property?.type !== "button") return {};
    const { actions } = readButtonPropertyConfig(property.config);
    const today = command.meta.now.slice(0, 10);
    const changes = Object.fromEntries(
      actions.flatMap((action) =>
        action.kind === "set-values"
          ? Object.entries(action.values).map(([id, value]) => [
              id,
              isToday(value) ? { start: today } : value,
            ])
          : [],
      ),
    );
    const opens = actions.some((action) => action.kind === "open-page");
    const ui = opens ? { ...state.ui, activePageId: row.id } : state.ui;
    if (Object.keys(changes).length === 0) return { ui };
    const values = { ...row.props.values, ...changes };
    const patch = {
      props: { ...row.props, values },
      updatedAt: command.meta.now,
    };
    return {
      operations: [{ type: "record.update", kind: "block", id: row.id, patch }],
      ui,
    };
  },
});

export const buttonPropertyCommands = [pressRowButton];
