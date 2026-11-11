// What the "Getting started" page holds: a short tour of the app, made of
// the same blocks a person would write.
import { BULLETED_LIST_TYPE } from "../../blocks/bulleted-list/index.ts";
import { CALLOUT_TYPE } from "../../blocks/callout/index.ts";
import { DIVIDER_TYPE } from "../../blocks/divider/index.ts";
import { HEADING_TYPE } from "../../blocks/heading/index.ts";
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import { QUOTE_TYPE } from "../../blocks/quote/index.ts";
import { TO_DO_TYPE } from "../../blocks/to-do/index.ts";
import { TOGGLE_TYPE } from "../../blocks/toggle/index.ts";
import type { BlockProps, RichText } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";

export interface SeedBlock {
  readonly type: string;
  readonly props: BlockProps;
  readonly children?: readonly SeedBlock[];
}

const TEXT = COPY.onboarding;

const rich = (text: string): RichText => [{ text }];

const block = (
  type: string,
  text: string,
  extra: BlockProps = {},
): SeedBlock => ({
  type,
  props: { text: rich(text), ...extra },
});

const heading = (text: string, level: number): SeedBlock =>
  block(HEADING_TYPE, text, { level });

const toDo = (text: string): SeedBlock =>
  block(TO_DO_TYPE, text, { isChecked: false });

export const GETTING_STARTED: SeedBlock = {
  type: PAGE_TYPE,
  props: {
    title: rich(TEXT.title),
    icon: "\u{1F44B}",
    isFavorite: true,
    isTrashed: false,
    cover: "sunrise",
  },
  children: [
    heading(TEXT.welcome, 1),
    block(PARAGRAPH_TYPE, TEXT.intro),
    block(CALLOUT_TYPE, TEXT.tip, { icon: "\u{1F4A1}" }),
    heading(TEXT.writeHeading, 2),
    toDo(TEXT.slash),
    toDo(TEXT.format),
    toDo(TEXT.markdown),
    toDo(TEXT.paste),
    toDo(TEXT.move),
    heading(TEXT.organizeHeading, 2),
    block(BULLETED_LIST_TYPE, TEXT.nest),
    block(BULLETED_LIST_TYPE, TEXT.favorite),
    block(BULLETED_LIST_TYPE, TEXT.views),
    {
      ...block(TOGGLE_TYPE, TEXT.dataQuestion, { isOpen: false }),
      children: [block(PARAGRAPH_TYPE, TEXT.dataAnswer)],
    },
    { type: DIVIDER_TYPE, props: {} },
    block(QUOTE_TYPE, TEXT.closing),
  ],
};

export function countSeedBlocks(seed: SeedBlock): number {
  const children = seed.children ?? [];
  return children.reduce((sum, child) => sum + countSeedBlocks(child), 1);
}
