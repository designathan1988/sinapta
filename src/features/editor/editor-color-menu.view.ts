// The block menu's colors: the default, a tone for the text, or a tone
// behind it, for the whole block.
import "./editor-color.css";
import { nothing, type TemplateResult } from "lit-html";
import {
  parseBlockId,
  TONES,
  type BlockColor,
  type BlockId,
} from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { setBlockColor } from "./editor-color.commands.ts";

export const BLOCK_COLOR_OVERLAY = "block-color";

// The block menu item that opens the colors, in place of the block menu.
export function colorMenuItem(
  overlay: OpenOverlay,
  dispatch: Dispatch,
): MenuItem {
  return {
    label: COPY.blockMenu.color,
    icon: "color",
    opensPanel: true,
    onSelect: () =>
      dispatch(
        openOverlay.create({
          overlay: { ...overlay, kind: BLOCK_COLOR_OVERLAY },
        }),
      ),
  };
}

function colorItems(blockId: BlockId, dispatch: Dispatch): MenuItem[] {
  const choose = (color: BlockColor | null) => (): void => {
    dispatch(setBlockColor.create({ blockIds: [blockId], color }));
  };
  return [
    { label: COPY.formatToolbar.defaultColor, onSelect: choose(null) },
    ...TONES.map((tone) => ({
      label: COPY.tones[tone],
      onSelect: choose(tone),
    })),
    ...TONES.map((tone) => ({
      label: `${COPY.tones[tone]} ${COPY.blockMenu.background}`,
      onSelect: choose(`${tone}-background`),
    })),
  ];
}

export function renderColorMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  if (overlay?.kind !== BLOCK_COLOR_OVERLAY) return nothing;
  const blockId = parseBlockId(overlay.anchorId ?? "");
  if (blockId === undefined) return nothing;
  return renderMenu({
    label: COPY.blockMenu.color,
    items: colorItems(blockId, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
    // In the block menu's place, before the grip.
    ...(overlay.point ? { point: overlay.point } : { placement: "before" }),
  });
}
