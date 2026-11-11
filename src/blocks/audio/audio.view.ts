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
import { AUDIO_TYPE, type AudioBlock } from "./audio.schema.ts";

export const audioCommands = defineMediaCommands(AUDIO_TYPE);

const KIND: MediaKind = {
  commands: audioCommands,
  accept: "audio/*",
  text: COPY.media.audio,
};

export function renderAudio(
  block: AudioBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  if (isEmptyMedia(block.props)) {
    return renderMediaEmpty(block, KIND, { dispatch, state });
  }
  const address = mediaAddress(block.props, state);
  return html`<figure class="media">
    <audio
      class="media__player"
      controls
      preload="metadata"
      data-media-source
      src=${address}
    ></audio>
    ${renderMediaCaption(block, KIND, dispatch)}
  </figure>`;
}
