// Hears a meeting through the microphone and the server (ADR-0013), as
// Notion's AI Meeting Notes do: the browser records a few seconds at a
// time, decodes each piece to 16 kHz samples, and the server's speech
// model turns them into words. Used when the app is signed in to a server.
import type { Listener } from "./transcriber.ts";

const SEGMENT_MS = 6000;
const SAMPLE_RATE = 16_000;
const CHUNK = 0x8000;

// The samples as 16-bit little-endian numbers, in base64.
export function encodeSamples(samples: Float32Array): string {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(index * 2, Math.round(clamped * 0x7fff), true);
  });
  let binary = "";
  for (let at = 0; at < bytes.length; at += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(at, at + CHUNK));
  }
  return btoa(binary);
}

async function samplesOf(blob: Blob): Promise<Float32Array> {
  const context = new AudioContext({ sampleRate: SAMPLE_RATE });
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    return audio.getChannelData(0);
  } finally {
    void context.close();
  }
}

interface Session {
  isOn: boolean;
  recorder?: MediaRecorder;
}

// Records one piece, then the next, until the session is turned off.
function recordPieces(
  stream: MediaStream,
  session: Session,
  hear: (piece: Blob) => void,
): void {
  if (!session.isOn) {
    for (const track of stream.getTracks()) track.stop();
    return;
  }
  const recorder = new MediaRecorder(stream);
  session.recorder = recorder;
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) hear(event.data);
  });
  recorder.addEventListener("stop", () => {
    recordPieces(stream, session, hear);
  });
  recorder.start();
  setTimeout(() => {
    if (recorder.state === "recording") recorder.stop();
  }, SEGMENT_MS);
}

export function recorderListener(
  transcribe: (audio: string) => Promise<string>,
): Listener | undefined {
  if (typeof MediaRecorder !== "function") return undefined;
  if (!("mediaDevices" in navigator)) return undefined;
  return {
    start: (onText, onEnd) => {
      const session: Session = { isOn: true };
      const hear = (piece: Blob): void => {
        void samplesOf(piece)
          .then((samples) => transcribe(encodeSamples(samples)))
          .then((text) => {
            if (text !== "") onText(text);
          })
          .catch(() => undefined);
      };
      navigator.mediaDevices.getUserMedia({ audio: true }).then(
        (stream) => {
          recordPieces(stream, session, hear);
        },
        () => {
          onEnd(true);
        },
      );
      return () => {
        session.isOn = false;
        if (session.recorder?.state === "recording") session.recorder.stop();
      };
    },
  };
}
