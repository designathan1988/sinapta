import "./embed.css";
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderUrlField } from "../../ui/url-field/index.ts";
import { setEmbedHeight, setEmbedUrl } from "./embed.commands.ts";
import { toEmbedUrl } from "./embed-hosts.ts";
import { EMBED_HEIGHT, type EmbedBlock } from "./embed.schema.ts";

const HEIGHT_PROPERTY = "--embed-height";

const KEY_STEPS: Readonly<Record<string, number>> = {
  ArrowDown: EMBED_HEIGHT.step,
  ArrowRight: EMBED_HEIGHT.step,
  ArrowUp: -EMBED_HEIGHT.step,
  ArrowLeft: -EMBED_HEIGHT.step,
};

function renderEmpty(block: EmbedBlock, dispatch: Dispatch): TemplateResult {
  const text = COPY.embed;
  return renderUrlField({
    label: text.label,
    placeholder: text.placeholder,
    submitLabel: text.submit,
    invalidMessage: text.invalid,
    isValid: (value) => toEmbedUrl(value) !== undefined,
    onSubmit: (url) => dispatch(setEmbedUrl.create({ blockId: block.id, url })),
  });
}

// The bar under the frame sets its height: dragged, or with the arrow
// keys. While dragging, the browser owns the height; the store gets it on
// release.
function renderHeightHandle(block: EmbedBlock, dispatch: Dispatch) {
  const height = block.props.height ?? EMBED_HEIGHT.initial;
  const blockId = block.id;
  const frameTop = (event: PointerEvent) =>
    event.currentTarget instanceof Element
      ? event.currentTarget.closest(".embed")?.getBoundingClientRect().top
      : undefined;
  const onKeyDown = (event: KeyboardEvent): void => {
    const step = KEY_STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    dispatch(setEmbedHeight.create({ blockId, height: height + step }));
  };
  const onPointerDown = (event: PointerEvent): void => {
    if (!(event.currentTarget instanceof Element)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerUp = (event: PointerEvent): void => {
    const top = frameTop(event);
    if (top === undefined) return;
    dispatch(setEmbedHeight.create({ blockId, height: event.clientY - top }));
  };
  return html`<div
    class="embed__handle"
    role="slider"
    tabindex="0"
    aria-orientation="vertical"
    aria-label=${COPY.embed.height}
    aria-valuemin=${EMBED_HEIGHT.min}
    aria-valuemax=${EMBED_HEIGHT.max}
    aria-valuenow=${height}
    aria-valuetext=${`${String(height)} ${COPY.embed.heightValue}`}
    @keydown=${onKeyDown}
    @pointerdown=${onPointerDown}
    @pointerup=${onPointerUp}
  ></div>`;
}

// The page of an allowed host in a sandboxed frame: scripts run in the
// host's own origin, never this app's.
export function renderEmbed(
  block: EmbedBlock,
  dispatch: Dispatch,
): TemplateResult {
  const source = toEmbedUrl(block.props.url);
  if (source === undefined) return renderEmpty(block, dispatch);
  const height = block.props.height ?? EMBED_HEIGHT.initial;
  const sized = ref((element) => {
    if (element instanceof HTMLElement) {
      element.style.setProperty(HEIGHT_PROPERTY, `${String(height)}px`);
    }
  });
  return html`<figure class="embed" ${sized}>
    <iframe
      class="embed__frame"
      title=${COPY.embed.frame}
      src=${source}
      sandbox="allow-scripts allow-same-origin allow-popups"
      referrerpolicy="strict-origin-when-cross-origin"
      loading="lazy"
      allow="fullscreen; picture-in-picture; encrypted-media"
    ></iframe>
    ${renderHeightHandle(block, dispatch)}
  </figure>`;
}
