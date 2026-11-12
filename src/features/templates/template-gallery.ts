// The gallery's built-in templates, as Notion's: pages a person would
// write, ready to be filled in.
import { BULLETED_LIST_TYPE } from "../../blocks/bulleted-list/index.ts";
import { CALLOUT_TYPE } from "../../blocks/callout/index.ts";
import { HEADING_TYPE } from "../../blocks/heading/index.ts";
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import { TO_DO_TYPE } from "../../blocks/to-do/index.ts";
import { COPY } from "../../ui/copy.ts";
import { rich, seedText, type SeedBlock } from "../onboarding/index.ts";

export interface PageTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly seed: SeedBlock;
}

const TEXT = COPY.templates;

const heading = (text: string): SeedBlock =>
  seedText(HEADING_TYPE, text, { level: 2 });
const toDo = (text = "", isChecked = false): SeedBlock =>
  seedText(TO_DO_TYPE, text, { isChecked });
const bullet = (text = ""): SeedBlock => seedText(BULLETED_LIST_TYPE, text);
const paragraph = (text = ""): SeedBlock => seedText(PARAGRAPH_TYPE, text);

function page(
  name: string,
  icon: string,
  children: readonly SeedBlock[],
): SeedBlock {
  return {
    type: PAGE_TYPE,
    props: { title: rich(name), icon, isFavorite: false, isTrashed: false },
    children,
  };
}

interface TemplateLook {
  readonly text: { readonly name: string; readonly description: string };
  readonly icon: string;
}

function template(
  id: string,
  look: TemplateLook,
  children: readonly SeedBlock[],
): PageTemplate {
  const { icon } = look;
  const { name, description } = look.text;
  return { id, name, description, icon, seed: page(name, icon, children) };
}

const { meetingNotes, toDoList, journal, doc, weeklyPlan, readingList } = TEXT;

export const PAGE_TEMPLATES: readonly PageTemplate[] = [
  template("meeting-notes", { text: meetingNotes, icon: "\u{1F4DD}" }, [
    heading(meetingNotes.attendees),
    bullet(),
    heading(meetingNotes.agenda),
    bullet(),
    heading(meetingNotes.notes),
    paragraph(),
    heading(meetingNotes.actions),
    toDo(),
  ]),
  template("to-do-list", { text: toDoList, icon: "\u{2705}" }, [
    heading(toDoList.today),
    toDo(),
    toDo(),
    heading(toDoList.later),
    toDo(),
  ]),
  template("journal", { text: journal, icon: "\u{1F4D4}" }, [
    seedText(CALLOUT_TYPE, journal.prompt, { icon: "\u{1F4AD}" }),
    heading(journal.grateful),
    bullet(),
    heading(journal.highlights),
    paragraph(),
  ]),
  template("doc", { text: doc, icon: "\u{1F4C4}" }, [
    heading(doc.overview),
    paragraph(),
    heading(doc.details),
    paragraph(),
    heading(doc.next),
    toDo(),
  ]),
  template(
    "weekly-plan",
    { text: weeklyPlan, icon: "\u{1F5D3}\u{FE0F}" },
    weeklyPlan.days.flatMap((day) => [heading(day), toDo()]),
  ),
  template("reading-list", { text: readingList, icon: "\u{1F4DA}" }, [
    seedText(CALLOUT_TYPE, readingList.tip, { icon: "\u{1F4A1}" }),
    heading(readingList.now),
    toDo(),
    heading(readingList.next),
    bullet(),
    heading(readingList.done),
    toDo("", true),
  ]),
];

export function templateNamed(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((item) => item.id === id);
}
