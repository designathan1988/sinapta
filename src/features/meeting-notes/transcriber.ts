// Listens while a meeting notes block records (ADR-0013): the browser's
// speech recognition hears the meeting, and each finished sentence goes to
// the block's transcript. It listens again when the browser stops early,
// as it does after a silence, until the block stops recording.
import {
  appendTranscript,
  stopTranscribing,
} from "../../blocks/meeting-notes/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState, AppStore, Dispatch } from "../../state/index.ts";

export interface Listener {
  // Starts hearing; returns what stops it. It ends on its own after a
  // silence, or has failed when the browser may not listen at all.
  readonly start: (
    onText: (text: string) => void,
    onEnd: (hasFailed: boolean) => void,
  ) => () => void;
}

function recordingIn(state: AppState): BlockId | undefined {
  return Object.values(state.workspace.blocks).find(
    (block) =>
      block.type === "meeting-notes" && block.props.status === "recording",
  )?.id;
}

export function startTranscriber(
  store: AppStore,
  dispatch: Dispatch,
  listener: Listener | undefined,
): void {
  if (listener === undefined) return;
  let heard: { blockId: BlockId; stop: () => void } | undefined;
  const listen = (blockId: BlockId): void => {
    const stop = listener.start(
      (text) => {
        queueMicrotask(() =>
          dispatch(appendTranscript.create({ blockId, text })),
        );
      },
      (hasFailed) => {
        if (heard?.blockId !== blockId) return;
        heard = undefined;
        // Refused a microphone: the recording stops instead of trying
        // again forever.
        if (hasFailed) {
          queueMicrotask(() => dispatch(stopTranscribing.create({ blockId })));
          return;
        }
        follow(store.getState());
      },
    );
    heard = { blockId, stop };
  };
  const follow = (state: AppState): void => {
    const recording = recordingIn(state);
    if (heard !== undefined && heard.blockId !== recording) {
      const { stop } = heard;
      heard = undefined;
      stop();
    }
    if (recording !== undefined && heard === undefined) listen(recording);
  };
  store.subscribe(follow);
}

// One recognition result's words, when the browser has settled on them.
function finalWords(result: unknown): string | undefined {
  if (typeof result !== "object" || result === null) return undefined;
  if (Reflect.get(result, "isFinal") !== true) return undefined;
  const best: unknown = Reflect.get(result, 0);
  if (typeof best !== "object" || best === null) return undefined;
  const words: unknown = Reflect.get(best, "transcript");
  return typeof words === "string" ? words.trim() : undefined;
}

// The finished sentences of a recognition result event.
function finishedText(event: Event): string {
  const results: unknown = Reflect.get(event, "results");
  if (typeof results !== "object" || results === null) return "";
  const from = Number(Reflect.get(event, "resultIndex"));
  const length = Number(Reflect.get(results, "length"));
  const parts: string[] = [];
  for (let index = from || 0; index < (length || 0); index += 1) {
    const words = finalWords(Reflect.get(results, index));
    if (words !== undefined) parts.push(words);
  }
  return parts.join(" ");
}

// The browser's speech recognition class, looked up when needed.
function recognitionOf(): unknown {
  const standard: unknown = Reflect.get(globalThis, "SpeechRecognition");
  const prefixed: unknown = Reflect.get(globalThis, "webkitSpeechRecognition");
  return standard ?? prefixed;
}

// The browser's speech recognition, when it has one.
export function browserListener(): Listener | undefined {
  if (typeof recognitionOf() !== "function") return undefined;
  return {
    start: (onText, onEnd) => {
      const Recognition = recognitionOf();
      if (typeof Recognition !== "function") return () => undefined;
      const recognizer: unknown = Reflect.construct(Recognition, []);
      if (!(recognizer instanceof EventTarget)) return () => undefined;
      Reflect.set(recognizer, "continuous", true);
      Reflect.set(recognizer, "lang", navigator.language);
      recognizer.addEventListener("result", (event) => {
        const text = finishedText(event);
        if (text !== "") onText(text);
      });
      let hasFailed = false;
      recognizer.addEventListener("error", (event) => {
        const kind: unknown = Reflect.get(event, "error");
        hasFailed = kind !== "no-speech" && kind !== "aborted";
      });
      recognizer.addEventListener("end", () => {
        onEnd(hasFailed);
      });
      const call = (name: string) => {
        const method: unknown = Reflect.get(recognizer, name);
        if (typeof method === "function") Reflect.apply(method, recognizer, []);
      };
      call("start");
      return () => {
        call("stop");
      };
    },
  };
}
