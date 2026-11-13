// The calculation a view shows under a column. It lives in the view's
// record, so it is saved and undone with the view.
import type { CalculationKind, PropertyId, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { calculationsFor } from "./calculations.selectors.ts";
import { TITLE_PROPERTY_ID, titleProperty } from "./table-model.selectors.ts";
import { selectDatabase } from "../../blocks/database/index.ts";

export interface SetCalculationPayload {
  readonly viewId: ViewId;
  readonly propertyId: PropertyId;
  // Null shows no calculation.
  readonly kind: CalculationKind | null;
}

export const setCalculation = defineCommand<SetCalculationPayload>({
  type: "view.setCalculation",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const { propertyId, kind } = command;
    const properties =
      selectDatabase(state, view.databaseId)?.props.properties ?? [];
    const property =
      propertyId === TITLE_PROPERTY_ID
        ? titleProperty()
        : properties.find((item) => item.id === propertyId);
    if (property === undefined) return {};
    if (kind !== null && !calculationsFor(property).includes(kind)) return {};
    const others = Object.entries(view.calculations).filter(
      ([id]) => id !== propertyId,
    );
    const own: [string, CalculationKind][] =
      kind === null ? [] : [[propertyId, kind]];
    const calculations = Object.fromEntries([...others, ...own]);
    return {
      operations: [
        {
          type: "record.update",
          kind: "view",
          id: view.id,
          patch: { calculations },
        },
      ],
    };
  },
});

// "Show large counts as 99+": every count of the view above 99 reads
// "99+".
export const setCountCap = defineCommand<{ viewId: ViewId; on: boolean }>({
  type: "view.setCountCap",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined || (view.countCap === true) === command.on)
      return {};
    const patch = { countCap: command.on };
    return {
      operations: [{ type: "record.update", kind: "view", id: view.id, patch }],
    };
  },
});

export const calculationCommands = [setCalculation, setCountCap];
