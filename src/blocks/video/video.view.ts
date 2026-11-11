import { html, type TemplateResult } from "lit-html";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  defineMediaCommands,
  isEmptyMedia,
  mediaAddress,
  renderMediaCaption,
  renderMediaEmpty,
  type MediaKind,
} from "../media/index.ts";
import { VIDEO_TYPE, type VideoBlock } from "./video.schema.ts";

export const videoCommands = defineMediaCommands(VIDEO_TYPE);

const KIND: MediaKind = {
  commands: videoCommands,
  accept: "video/*",
  text: COPY.media.video,
};

export function renderVideo(
  block: VideoBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  if (isEmptyMedia(block.props)) {
    return renderMediaEmpty(block, KIND, { dispatch, state });
  }
  const address = mediaAddress(block.props, state);
  return html`<figure class="media">
    <video
      class="media__player"
      controls
      preload="metadata"
      data-media-source
      src=${address}
    ></video>
    ${renderMediaCaption(block, KIND, dispatch)}
  </figure>`;
}
