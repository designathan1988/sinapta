// The "Tasks" database a first visit starts with: three rows with a status
// and a due date, shown as a table, a board and a calendar.
import { DATABASE_TYPE, PAGE_TYPE } from "../../blocks/page/index.ts";
import type {
  Block,
  BlockId,
  PropertyId,
  View,
  ViewId,
  ViewType,
} from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";

const TEXT = COPY.onboarding;
const DAY_MS = 86_400_000;

export interface TaskIds {
  readonly databaseId: BlockId;
  readonly rowIds: readonly BlockId[];
  readonly viewIds: readonly ViewId[];
  // Status and due date, then the three status options.
  readonly propertyIds: readonly PropertyId[];
}

export const TASK_ROWS = 3;
export const TASK_VIEWS = 3;
export const TASK_PROPERTIES = 5;

function dayAfter(now: string, days: number): string {
  return new Date(Date.parse(now) + days * DAY_MS).toISOString().slice(0, 10);
}

function view(ids: TaskIds, index: number, type: ViewType): View[] {
  const id = ids.viewIds[index];
  const [status, due] = ids.propertyIds;
  if (id === undefined || status === undefined || due === undefined) return [];
  const record: View = {
    id,
    databaseId: ids.databaseId,
    name: COPY.database.layouts[type],
    type,
    sorts: [],
    filter: { conjunction: "and", items: [] },
    propertyOrder: [],
    propertyWidths: {},
    hiddenPropertyIds: [],
  };
  if (type === "board") return [{ ...record, groupPropertyId: status }];
  if (type === "calendar") return [{ ...record, datePropertyId: due }];
  return [record];
}

export function taskViews(ids: TaskIds): View[] {
  const types: readonly ViewType[] = ["table", "board", "calendar"];
  return types.flatMap((type, index) => view(ids, index, type));
}

function properties(ids: TaskIds) {
  const [status = "", due = "", todo = "", doing = "", done = ""] =
    ids.propertyIds;
  return [
    {
      id: status,
      name: TEXT.status,
      type: "select",
      options: [
        { id: todo, name: TEXT.notStarted, color: "gray" },
        { id: doing, name: TEXT.inProgress, color: "blue" },
        { id: done, name: TEXT.done, color: "green" },
      ],
    },
    { id: due, name: TEXT.due, type: "date" },
  ];
}

function rows(ids: TaskIds, now: string): Block[] {
  const [status = "", due = "", todo = "", doing = "", done = ""] =
    ids.propertyIds;
  const specs = [
    { title: TEXT.taskBoard, option: doing, day: 1 },
    { title: TEXT.taskPage, option: todo, day: 3 },
    { title: TEXT.taskShortcuts, option: done, day: 0 },
  ];
  return specs.flatMap((spec, index): Block[] => {
    const id = ids.rowIds[index];
    if (id === undefined) return [];
    const start = dayAfter(now, spec.day);
    const values = { [status]: spec.option, [due]: { start } };
    const props = {
      title: [{ text: spec.title }],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      values,
    };
    const parentId = ids.databaseId;
    const record = { id, type: PAGE_TYPE, parentId, childIds: [], props };
    return [{ ...record, createdAt: now, updatedAt: now }];
  });
}

export function taskBlocks(ids: TaskIds, now: string): Block[] {
  const rowBlocks = rows(ids, now);
  const database: Block = {
    id: ids.databaseId,
    type: DATABASE_TYPE,
    parentId: null,
    childIds: rowBlocks.map((row) => row.id),
    props: {
      title: [{ text: TEXT.tasks }],
      icon: "\u{2705}",
      isFavorite: false,
      isTrashed: false,
      properties: properties(ids),
      viewIds: [...ids.viewIds],
    },
    createdAt: now,
    updatedAt: now,
  };
  return [database, ...rowBlocks];
}
