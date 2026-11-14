# ADR-0014: Two server dependencies, and where the build differs from ADR-0013

**Status:** Accepted
**Date:** 2026-11-14
**Deciders:** Project owner (who asked for everything Notion has, built
and working, and for decisions to be taken and recorded rather than asked)

## Context

ADR-0013 put a local server in `server/` built on Node's own `node:http`,
`node:sqlite` and `node:crypto`, "no new dependency". Two of Notion's
features cannot be built well on those alone:

- **AI Meeting Notes** turn speech into text. Chrome's `SpeechRecognition`
  sends the audio to Google and is missing in headless and other browsers;
  a local model is the only way that works on this machine, offline.
- **Notifications on a person's other devices** (a phone, a closed tab)
  need Web Push: a message encrypted for the browser's push service
  (RFC 8291) and signed with a VAPID key (RFC 8292). `node:crypto` has the
  primitives, but the encoding, padding and JWT details are a protocol of
  their own.

Three choices of ADR-0013's text were also changed while building, and
the record should say so.

## Decision

1. **Speech to text: `@huggingface/transformers` 4.3.2** (Transformers.js),
   server only, loaded with a dynamic `import()` the first time audio
   arrives, so the server starts as fast as before and the tests never
   load it. The model is `Xenova/whisper-base.en`, quantized (`dtype:
   "q8"`), downloaded once into `.data/models` (ignored by git);
   `PAGECRAFT_SPEECH_MODEL` picks another. The browser records six-second
   pieces with `MediaRecorder` and the server answers each with its words.
2. **Web Push: `web-push` 3.6.7** with `@types/web-push` 3.6.4, server
   only. The server makes its VAPID key pair on first use and keeps it in
   SQLite (migration 8, with the subscriptions); it pushes a mention, a
   share and a comment notice to every subscription of the person
   addressed. Version 4.0.0 was released days before this decision and is
   not used yet (packages must be at least two weeks old).
3. **Migrations** live in one file, `server/migrations.ts`, as an ordered
   list of SQL strings run at start, not as numbered files in
   `server/migrations/`. Eight small migrations read best in one place,
   and there is no file loading to get wrong.
4. **Map tiles** are drawn by our own renderer as positioned `<img>`
   elements of OpenStreetMap tiles inside the map's frame, not over a
   `<canvas>`. lit-html draws them like any other markup, the browser
   caches and decodes them, and the pins stay buttons a keyboard can
   reach. The decision that mattered, no map library, holds.
5. **Generated tokens.** `src/styles/tokens.generated.css` is built by
   `npm run tokens` and is the one file exempt from the 250-line limit
   (ADR-0009 already says so for the token source files); it is never
   edited by hand.

## Options Considered

### Speech: Chrome's `SpeechRecognition` only

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | No dependency |
| Works offline | No: audio goes to Google |
| Works headless and in other browsers | No |

### Speech: `whisper.cpp` or Python Whisper as a second process

| Dimension | Assessment |
|-----------|------------|
| Complexity | High: a native build or a Python install |
| Cost | A second process, which the machine's process budget forbids |

### Speech: Transformers.js in the server process (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low: one import, one pipeline call |
| Cost | One dependency, about 150 MB of model on first use |
| Works offline | Yes, after the first download |

### Push: hand-written RFC 8291 and VAPID on `node:crypto`

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium: ECDH, HKDF, AES-GCM padding, ES256 JWT |
| Risk | A protocol error shows only against a real push service |

### Push: `web-push` (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | One small dependency with a long record |

## Trade-off Analysis

Both libraries run only in `server/`, never in the browser bundle, so the
client's five runtime libraries stay five. Both replace code that would be
long, easy to get subtly wrong and hard to test without the outside
service. The cost is install size (the model) and two more packages to
keep current.

## Consequences

- Easier: meeting notes work offline in any browser with a microphone;
  mentions reach a person's phone through Chrome's push service (tested
  end to end through FCM, `p88-push`).
- Harder: the first transcription waits for the model download; the
  server's `node_modules` grows.
- The specification's section 3 lists both under the server's row.
- Revisit: `web-push` 4 once it is two weeks old; a smaller or
  multilingual Whisper model if English-only proves too narrow.

## Action Items

1. [x] `server/transcription.ts`, `src/persistence/recorder-listener.ts`.
2. [x] `server/push.ts`, `server/push-mentions.ts`, the service worker's
   push handler, Settings › Notifications' push row.
3. [x] Specification section 1 and 3 updated.
