// A page's cover and its width. Only pages have them: a database already
// fills the width and shows its rows where a cover would go.
import { safeImageSource, type BlockId } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import {
  COVER_PRESETS,
  isCover,
  PAGE_TYPE,
  type PageProps,
} from "./page.schema.ts";
import { selectPage } from "./page.selectors.ts";

function updatePage(
  state: AppState,
  pageId: BlockId,
  change: (props: PageProps) => PageProps,
): CommandEffect {
  const page = selectPage(state, pageId);
  if (page?.type !== PAGE_TYPE) return {};
  const props = change(page.props);
  return {
    operations: [
      { type: "record.update", kind: "block", id: pageId, patch: { props } },
    ],
  };
}

// The preset a page gets when a cover is added without a choice: the same
// one for the same page, and different ones across pages.
export function coverFor(pageId: BlockId): string {
  let sum = 0;
  for (const character of pageId) sum += character.charCodeAt(0);
  return COVER_PRESETS[sum % COVER_PRESETS.length] ?? COVER_PRESETS[0];
}

export const setPageCover = defineCommand<{
  pageId: BlockId;
  // A preset name, an image address, or null to remove the cover.
  cover: string | null;
}>({
  type: "page.setCover",
  handle(state, command) {
    const { cover } = command;
    if (cover !== null && !isCover(cover)) return {};
    const stored = cover === null ? null : (safeImageSource(cover) ?? cover);
    const isPreset = COVER_PRESETS.some((preset) => preset === cover);
    return updatePage(state, command.pageId, (props) => ({
      ...props,
      cover: isPreset ? cover : stored,
    }));
  },
});

export const togglePageFullWidth = defineCommand<{ pageId: BlockId }>({
  type: "page.toggleFullWidth",
  handle: (state, command) =>
    updatePage(state, command.pageId, (props) => ({
      ...props,
      isFullWidth: props.isFullWidth !== true,
    })),
});

export const pageCoverCommands = [setPageCover, togglePageFullWidth];
