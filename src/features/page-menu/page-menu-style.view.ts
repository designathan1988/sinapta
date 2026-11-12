// The page menu's style options: the font, small text and full width.
// Only pages have them: a database always fills the width.
import {
  PAGE_FONTS,
  PAGE_TYPE,
  setPageBacklinks,
  setPageFont,
  togglePageFullWidth,
  togglePageSmallText,
  type PageBlock,
  type PageFont,
} from "../../blocks/page/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";

function fontItem(
  page: PageBlock,
  font: PageFont,
  dispatch: Dispatch,
): MenuItem {
  return {
    label: COPY.pageMenu.fonts[font],
    check: "radio",
    isChecked: (page.props.font ?? "default") === font,
    onSelect: () => dispatch(setPageFont.create({ pageId: page.id, font })),
  };
}

const DISPLAYS = ["expanded", "popover", "off"] as const;

function backlinksItem(page: PageBlock, dispatch: Dispatch): MenuItem {
  const current = page.props.backlinks ?? "popover";
  const pageId = page.id;
  return {
    label: COPY.backlinks.menu,
    icon: "arrow-up-right",
    value: COPY.backlinks.displays[current],
    submenu: {
      id: `backlinks:${pageId}`,
      menu: () => ({
        label: COPY.backlinks.menu,
        items: DISPLAYS.map((display) => ({
          label: COPY.backlinks.displays[display],
          check: "radio",
          isChecked: display === current,
          onSelect: () =>
            dispatch(setPageBacklinks.create({ pageId, display })),
        })),
      }),
    },
  };
}

export function styleItems(page: PageBlock, dispatch: Dispatch): MenuItem[] {
  if (page.type !== PAGE_TYPE) return [];
  const pageId = page.id;
  return [
    ...PAGE_FONTS.map((font) => fontItem(page, font, dispatch)),
    {
      label: COPY.pageMenu.smallText,
      check: "box",
      isChecked: page.props.isSmallText === true,
      onSelect: () => dispatch(togglePageSmallText.create({ pageId })),
    },
    backlinksItem(page, dispatch),
    {
      label: COPY.pageMenu.fullWidth,
      check: "box",
      isChecked: page.props.isFullWidth === true,
      onSelect: () => dispatch(togglePageFullWidth.create({ pageId })),
    },
  ];
}
