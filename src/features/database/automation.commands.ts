// A database's automations, as Notion's: added (When a page is added, set
// nothing yet), changed (its trigger, its values, on or off), deleted,
// and run on a page, which sets its values there in one step of its own.
import {
  selectDatabase,
  type Automation,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import { selectPage } from "../../blocks/page/index.ts";
import type { BlockId, Operation } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { resolveValues } from "./button-values.ts";

export const AUTOMATION_PANEL = "automation:";

function withAutomations(
  database: DatabaseBlock,
  automations: readonly Automation[],
  now: string,
): Operation {
  const props = { ...database.props, automations: [...automations] };
  return {
    type: "record.update",
    kind: "block",
    id: database.id,
    patch: { props, updatedAt: now },
  };
}

// Adds an automation, on, and shows it in the view settings.
export const addAutomation = defineCommand<{ databaseId: BlockId }>({
  type: "database.addAutomation",
  newIds: { blocks: 1 },
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const id = command.meta.blockIds[0];
    if (database === undefined || id === undefined) return {};
    const automation: Automation = {
      id,
      isActive: true,
      trigger: { kind: "page-added" },
      values: {},
    };
    const list = [...(database.props.automations ?? []), automation];
    const { overlay } = state.ui;
    const panel = `${AUTOMATION_PANEL}${id}`;
    return {
      operations: [withAutomations(database, list, command.meta.now)],
      ...(overlay !== null && {
        ui: { ...state.ui, overlay: { ...overlay, panel } },
      }),
    };
  },
});

export const setAutomation = defineCommand<{
  databaseId: BlockId;
  automationId: string;
  patch: Partial<Omit<Automation, "id">>;
}>({
  type: "database.setAutomation",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined) return {};
    const list = (database.props.automations ?? []).map((automation) =>
      automation.id === command.automationId
        ? { ...automation, ...command.patch }
        : automation,
    );
    return { operations: [withAutomations(database, list, command.meta.now)] };
  },
});

export const deleteAutomation = defineCommand<{
  databaseId: BlockId;
  automationId: string;
}>({
  type: "database.deleteAutomation",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined) return {};
    const list = (database.props.automations ?? []).filter(
      (automation) => automation.id !== command.automationId,
    );
    return { operations: [withAutomations(database, list, command.meta.now)] };
  },
});

// Runs an automation on a page of its database: Edit property.
export const runAutomation = defineCommand<{
  databaseId: BlockId;
  automationId: string;
  rowId: BlockId;
}>({
  type: "database.runAutomation",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const row = selectPage(state, command.rowId);
    const automation = database?.props.automations?.find(
      (item) => item.id === command.automationId,
    );
    if (row?.parentId !== command.databaseId || automation === undefined)
      return {};
    const { now } = command.meta;
    const values = resolveValues(
      automation.values,
      now.slice(0, 10),
      new Map(),
    );
    if (Object.keys(values).length === 0) return {};
    const props = { ...row.props, values: { ...row.props.values, ...values } };
    const patch = { props, updatedAt: now };
    return {
      operations: [{ type: "record.update", kind: "block", id: row.id, patch }],
    };
  },
});

export const automationCommands = [
  addAutomation,
  setAutomation,
  deleteAutomation,
  runAutomation,
];
