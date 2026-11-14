// Appearance and layout's switches after Small text and Full width, as
// Notion's: Table of contents (the floating outline), Page discussions,
// and Inline comments, Default or Minimal.
import {
  PAGE_TYPE,
  setPageLayout,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";

const TEXT = COPY.pageLayout;
const INLINE = ["default", "minimal"] as const;
const INLINE_LABELS = {
  default: TEXT.inlineDefault,
  minimal: TEXT.inlineMinimal,
};

function inlineCommentsItem(page: PageBlock, dispatch: Dispatch): MenuItem {
  const current = page.props.inlineComments ?? "default";
  const pageId = page.id;
  return {
    label: TEXT.inlineComments,
    icon: "comment",
    value: INLINE_LABELS[current],
    submenu: {
      id: `inline-comments:${pageId}`,
      menu: () => ({
        label: TEXT.inlineComments,
        items: INLINE.map((choice) => ({
          label: INLINE_LABELS[choice],
          check: "radio",
          isChecked: choice === current,
          onSelect: () =>
            dispatch(
              setPageLayout.create({
                pageId,
                layout: { inlineComments: choice },
              }),
            ),
        })),
      }),
    },
  };
}

export function layoutItems(page: PageBlock, dispatch: Dispatch): MenuItem[] {
  if (page.type !== PAGE_TYPE) return [];
  const pageId = page.id;
  const showOutline = page.props.showOutline !== false;
  const showPageDiscussions = page.props.showPageDiscussions !== false;
  return [
    {
      label: TEXT.outline,
      icon: "toc",
      check: "switch",
      isChecked: showOutline,
      onSelect: () =>
        dispatch(
          setPageLayout.create({
            pageId,
            layout: { showOutline: !showOutline },
          }),
        ),
    },
    {
      label: TEXT.pageDiscussions,
      icon: "comment",
      check: "switch",
      isChecked: showPageDiscussions,
      onSelect: () =>
        dispatch(
          setPageLayout.create({
            pageId,
            layout: { showPageDiscussions: !showPageDiscussions },
          }),
        ),
    },
    inlineCommentsItem(page, dispatch),
  ];
}
