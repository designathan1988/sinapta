// The page menu's style, as Notion's: three tiles for the font, each its
// "Ag" in that font, then switches for small text and full width, and how
// backlinks show. Only pages have them: a database always fills the width.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  PAGE_FONTS,
  PAGE_TYPE,
  setPageBacklinks,
  setPageFont,
  togglePageFullWidth,
  togglePageSmallText,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";

const FONT_SAMPLE = "Ag";

export function renderFontTiles(
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  if (page.type !== PAGE_TYPE) return nothing;
  const current = page.props.font ?? "default";
  return html`<div class="menu__section" aria-hidden="true">
      ${COPY.pageLayout.fontStyle}
    </div>
    <div
      class="page-menu__fonts"
      role="group"
      aria-label=${COPY.pageMenu.style}
    >
      ${PAGE_FONTS.map(
        (font) =>
          html`<button
            type="button"
            class="page-menu__font"
            data-font=${font}
            aria-pressed=${String(font === current)}
            @click=${() =>
              dispatch(setPageFont.create({ pageId: page.id, font }))}
          >
            <span class="page-menu__font-sample" aria-hidden="true"
              >${FONT_SAMPLE}</span
            >
            <span>${COPY.pageMenu.fonts[font]}</span>
          </button>`,
      )}
    </div>`;
}

const DISPLAYS = ["expanded", "popover", "off"] as const;

export function backlinksItem(page: PageBlock, dispatch: Dispatch): MenuItem {
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

// Small text and full width, each a switch, as Notion's.
export function styleItems(page: PageBlock, dispatch: Dispatch): MenuItem[] {
  if (page.type !== PAGE_TYPE) return [];
  const pageId = page.id;
  return [
    {
      label: COPY.pageMenu.smallText,
      icon: "text",
      check: "switch",
      isChecked: page.props.isSmallText === true,
      onSelect: () => dispatch(togglePageSmallText.create({ pageId })),
    },
    {
      label: COPY.pageMenu.fullWidth,
      icon: "expand",
      check: "switch",
      isChecked: page.props.isFullWidth === true,
      onSelect: () => dispatch(togglePageFullWidth.create({ pageId })),
    },
  ];
}
