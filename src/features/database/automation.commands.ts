// A database's automations, as Notion's: added (When a page is added, set
// nothing yet), changed (its trigger, its values, on or off), deleted,
// and run on a page, which sets its values there in one step of its own.
import {
  selectDatabase,
  type Automation,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import { selectPage, type PageBlock } from "../../blocks/page/index.ts";
import {
  parseBlockId,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { resolveValues } from "./button-values.ts";
import { newRow } from "./button-press.commands.ts";
import { automationTrigger } from "./automation-runs.selectors.ts";
import { COPY } from "../../ui/copy.ts";

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

// The automation with the patch on it; an empty Add page to or webhook
// takes it off.
function changed(
  automation: Automation,
  patch: Partial<Omit<Automation, "id">>,
): Automation {
  const next = { ...automation, ...patch };
  const { addPageTo, webhookUrl, ...rest } = next;
  return {
    ...rest,
    ...(addPageTo !== undefined && addPageTo !== "" && { addPageTo }),
    ...(webhookUrl !== undefined && webhookUrl !== "" && { webhookUrl }),
  };
}

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
        ? changed(automation, command.patch)
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

// The page Add page to adds, at the end of the database it names.
function addedPage(
  state: AppState,
  automation: Automation,
  meta: { readonly blockIds: readonly BlockId[]; readonly now: string },
): Operation[] {
  const target = selectDatabase(
    state,
    parseBlockId(automation.addPageTo ?? "") ?? null,
  );
  const id = meta.blockIds[0];
  if (target === undefined || id === undefined) return [];
  return newRow({ database: target, id, values: {} }, meta.now);
}

const NOTICES_KEPT = 20;

// Send notification to: a notice on the page for each person it names.
function noticesOf(
  automation: Automation,
  database: DatabaseBlock | undefined,
  now: string,
) {
  if (database === undefined) return [];
  const text = COPY.database.automationNotice(
    automationTrigger(database, automation),
    database.props.title.map((span) => span.text).join("") ||
      COPY.database.untitled,
  );
  return (automation.notifyUserIds ?? []).map((userId) => ({
    id: `${automation.id}:${userId}@${now}`,
    userId,
    text,
    at: now,
  }));
}

// The page with what the automation set and told; nothing if neither.
function rowUpdate(
  row: PageBlock,
  change: {
    readonly values: Readonly<Record<string, unknown>>;
    readonly notices: NonNullable<PageBlock["props"]["automationNotices"]>;
  },
  now: string,
): Operation[] {
  const { values, notices } = change;
  if (Object.keys(values).length === 0 && notices.length === 0) return [];
  const kept = [...(row.props.automationNotices ?? []), ...notices];
  const props = {
    ...row.props,
    values: { ...row.props.values, ...values },
    ...(notices.length > 0 && {
      automationNotices: kept.slice(-NOTICES_KEPT),
    }),
  };
  return [
    {
      type: "record.update",
      kind: "block",
      id: row.id,
      patch: { props, updatedAt: now },
    },
  ];
}

// Runs an automation on a page of its database: Edit property and Send
// notification to, then Add page to.
export const runAutomation = defineCommand<{
  databaseId: BlockId;
  automationId: string;
  rowId: BlockId;
  // How many pages it adds.
  adds?: number;
}>({
  type: "database.runAutomation",
  newIds: (payload) => ({ blocks: payload.adds ?? 0 }),
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
    const notices = noticesOf(automation, database, now);
    const operations: Operation[] = [
      ...rowUpdate(row, { values, notices }, now),
      ...addedPage(state, automation, command.meta),
    ];
    return operations.length === 0 ? {} : { operations };
  },
});

export const automationCommands = [
  addAutomation,
  setAutomation,
  deleteAutomation,
  runAutomation,
];
