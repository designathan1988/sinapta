// Repeating templates, as Notion's "Repeat": a template makes a row from
// itself every day, week, month or year. The app checks which are due and
// adds their rows; each then moves on to its next day after today.
import { selectDatabase } from "../../blocks/database/index.ts";
import {
  selectPage,
  type PageBlock,
  type RepeatPeriod,
} from "../../blocks/page/index.ts";
import type { BlockId, Operation } from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import type { RowTemplate } from "./row.commands.ts";
import {
  selectRowTemplate,
  selectTemplateDatabase,
} from "./template.commands.ts";

function at(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function daysIn(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// The same day a month or a year on, or the month's last day when it has
// fewer.
function shiftMonths(day: string, months: number): string {
  const date = at(day);
  const total = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const dayOfMonth = Math.min(date.getUTCDate(), daysIn(year, month));
  return new Date(Date.UTC(year, month, dayOfMonth)).toISOString().slice(0, 10);
}

export function nextOccurrence(day: string, every: RepeatPeriod): string {
  if (every === "month") return shiftMonths(day, 1);
  if (every === "year") return shiftMonths(day, 12);
  const date = at(day);
  date.setUTCDate(date.getUTCDate() + (every === "week" ? 7 : 1));
  return date.toISOString().slice(0, 10);
}

// The first of its days after today.
function firstAfter(day: string, every: RepeatPeriod, today: string): string {
  let next = day;
  while (next <= today) next = nextOccurrence(next, every);
  return next;
}

function repeatUpdate(
  page: PageBlock,
  repeat: { every: RepeatPeriod; next: string } | undefined,
): Operation {
  const { repeat: _old, ...rest } = page.props;
  const props = repeat === undefined ? rest : { ...rest, repeat };
  return {
    type: "record.update",
    kind: "block",
    id: page.id,
    patch: { props },
  };
}

// Sets how often a template repeats, from its next day after today, or
// stops it.
export const setTemplateRepeat = defineCommand<{
  templateId: BlockId;
  every: RepeatPeriod | null;
  today: string;
}>({
  type: "template.setRepeat",
  handle(state, { templateId, every, today }) {
    const page = selectPage(state, templateId);
    if (page === undefined || !selectTemplateDatabase(state, templateId))
      return {};
    const repeat =
      every === null
        ? undefined
        : { every, next: nextOccurrence(today, every) };
    return { operations: [repeatUpdate(page, repeat)] };
  },
});

// After its row is made, a template's next day moves on past today.
export const advanceRepeat = defineCommand<{
  templateId: BlockId;
  today: string;
}>({
  type: "template.advanceRepeat",
  handle(state, { templateId, today }) {
    const page = selectPage(state, templateId);
    const repeat = page?.props.repeat;
    if (page === undefined || repeat === undefined) return {};
    const next = firstAfter(repeat.next, repeat.every, today);
    return { operations: [repeatUpdate(page, { ...repeat, next })] };
  },
});

export interface DueRepeat {
  readonly templateId: BlockId;
  readonly databaseId: BlockId;
  readonly template: RowTemplate | undefined;
}

// The templates whose next day has come.
export function selectDueRepeats(state: AppState, today: string): DueRepeat[] {
  return Object.values(state.workspace.blocks).flatMap((block) => {
    const database = selectDatabase(state, block.id);
    if (database === undefined) return [];
    return database.props.templateIds.flatMap((templateId) => {
      const next = selectPage(state, templateId)?.props.repeat?.next;
      if (next === undefined || next > today) return [];
      const template = selectRowTemplate(state, templateId);
      return [{ templateId, databaseId: database.id, template }];
    });
  });
}

export const templateRepeatCommands = [setTemplateRepeat, advanceRepeat];
