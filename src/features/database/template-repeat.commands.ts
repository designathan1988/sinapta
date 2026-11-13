// Repeating templates, as Notion's "Repeat": a template makes a row from
// itself on the days of its cadence (repeat-rule.ts). The app checks
// which are due and adds their rows; each then moves on to its next day
// after today, and stops after its last.
import { selectDatabase } from "../../blocks/database/index.ts";
import {
  selectPage,
  type PageBlock,
  type Repeat,
} from "../../blocks/page/index.ts";
import type { BlockId, Operation } from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { firstAfter, firstOnOrAfter } from "./repeat-rule.ts";
import type { RowTemplate } from "./row.commands.ts";
import {
  selectRowTemplate,
  selectTemplateDatabase,
} from "./template.commands.ts";

function repeatUpdate(page: PageBlock, repeat: Repeat | undefined): Operation {
  const { repeat: _old, ...rest } = page.props;
  const props = repeat === undefined ? rest : { ...rest, repeat };
  return {
    type: "record.update",
    kind: "block",
    id: page.id,
    patch: { props },
  };
}

// What the cadence editor saves: all of a repeat but its next day and
// the rows made so far.
export type Cadence = Omit<Repeat, "next" | "made">;

// The first day of a cadence after today, from its start.
export function firstNext(cadence: Cadence, today: string): string {
  const start = cadence.start ?? today;
  const first = firstOnOrAfter(start, cadence);
  return first > today ? first : firstAfter(first, cadence, today);
}

// Sets a template's cadence, from its first day after today, or stops it.
export const setTemplateRepeat = defineCommand<{
  templateId: BlockId;
  cadence: Cadence | null;
  today: string;
}>({
  type: "template.setRepeat",
  handle(state, { templateId, cadence, today }) {
    const page = selectPage(state, templateId);
    if (page === undefined || !selectTemplateDatabase(state, templateId))
      return {};
    const repeat =
      cadence === null
        ? undefined
        : { ...cadence, next: firstNext(cadence, today) };
    return { operations: [repeatUpdate(page, repeat)] };
  },
});

// The repeat after one more row: its next day past today, or none after
// its last row or its last day.
function afterRow(repeat: Repeat, today: string): Repeat | undefined {
  const made = (repeat.made ?? 0) + 1;
  if (repeat.endsAfter !== undefined && made >= repeat.endsAfter) {
    return undefined;
  }
  const next = firstAfter(repeat.next, repeat, today);
  if (repeat.endsOn !== undefined && next > repeat.endsOn) return undefined;
  return { ...repeat, next, made };
}

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
    return { operations: [repeatUpdate(page, afterRow(repeat, today))] };
  },
});

// Whether its day has come: a day gone by, or today at its time.
function isDue(repeat: Repeat, today: string, time: string): boolean {
  if (repeat.next < today) return true;
  return repeat.next === today && (repeat.time ?? "00:00") <= time;
}

export interface DueRepeat {
  readonly templateId: BlockId;
  readonly databaseId: BlockId;
  readonly template: RowTemplate | undefined;
}

// The templates whose next day, and time on it, has come.
export function selectDueRepeats(
  state: AppState,
  today: string,
  time = "23:59",
): DueRepeat[] {
  return Object.values(state.workspace.blocks).flatMap((block) => {
    const database = selectDatabase(state, block.id);
    if (database === undefined) return [];
    return database.props.templateIds.flatMap((templateId) => {
      const repeat = selectPage(state, templateId)?.props.repeat;
      if (repeat === undefined || !isDue(repeat, today, time)) return [];
      const template = selectRowTemplate(state, templateId);
      return [{ templateId, databaseId: database.id, template }];
    });
  });
}

export const templateRepeatCommands = [setTemplateRepeat, advanceRepeat];
