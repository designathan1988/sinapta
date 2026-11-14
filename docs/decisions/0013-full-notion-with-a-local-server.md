# ADR-0013: Full Notion parity with a local server

**Status:** Accepted
**Date:** 2026-11-14 (asked for by the owner on 2026-11-14)
**Deciders:** Project owner

## Context

ADR-0011 widened the scope to every Notion feature one person can use
alone and offline, and kept out everything that needs more than one
person or a server: accounts, sync, multiple workspaces, sharing,
permissions, guests, publishing, real-time collaboration, notifications
from others, the people, created by, last edited by and verification
properties, the map view and place property, and AI.

On 2026-11-14 the owner asked for the application to be identical to
Notion in features, interface and behavior, with everything in that list,
and for a local server, database and authentication to be installed where
they are needed. The owner also asked not to be asked again: decisions in
this phase are taken here and recorded.

Forces:

- The architecture's core holds: one store, every change a serializable
  command through `dispatch`, JSON parsed only at boundaries. Commands
  that already travel to IndexedDB can travel to a server.
- The project allows few runtime libraries (specification section 3) and
  has a 30 s verify budget and a machine that froze when too many
  processes ran (2026-11-12). Fewer processes and dependencies are better.
- Node 24.22 is installed and ships `node:http`, `node:sqlite` (SQLite
  3.53), `node:crypto` (scrypt, random bytes, timing-safe compare) and
  runs TypeScript files directly, as `scripts/capture.ts` already does.

## Decision

1. **Scope.** Everything Notion offers is in scope. The list above leaves
   the "out of scope" section of the specification; the only items left
   out are those that need a third party Pagecraft cannot run locally
   (Notion's own integrations marketplace, Slack, Google Drive, payment);
   their menus are drawn as Notion draws them and say they are not
   connected.
2. **Server.** A Node server in `server/`, TypeScript run by Node itself,
   using `node:http`, `node:sqlite` and `node:crypto` only. In
   development its request handler is mounted inside Vite's dev server
   by a Vite plugin, so `npm run dev` stays one process on one port and
   the capture script needs nothing new. `npm run serve` runs the same
   handler standalone and serves `dist/`.
3. **Database.** One SQLite file, `.data/pagecraft.sqlite` (ignored by
   git), opened with WAL. Schema changes are numbered migrations in
   `server/migrations/`, run at start. Tests use `:memory:`.
4. **Accounts.** Email and password, hashed with scrypt (N 2^15, r 8, p 1,
   16-byte salt), compared in constant time. Notion's login also offers a
   code sent by email; the server prints the code to its own log, which
   stands in for the mail. Sessions are random 32-byte ids in an
   `HttpOnly`, `SameSite=Lax` cookie, stored hashed, 30 days, rotated at
   sign-in. Every state-changing request needs the session and an
   `Origin` equal to the server's.
5. **Workspaces and members.** A workspace belongs to the server and has
   members with Notion's roles (Workspace owner, Member, Guest) and page
   permissions (Full access, Can edit, Can comment, Can view). The
   client keeps its local-first copy in IndexedDB as today.
6. **Sync and real time.** The server is the sequencer. A client sends
   each command it dispatched, with the last server sequence it has seen;
   the server checks the sender's permission, appends the command to the
   workspace's log with the next sequence, and pushes it to every other
   open client of that workspace over Server-Sent Events. A client applies
   remote commands through `dispatch` (they do not enter its undo
   history) and replays its own unconfirmed commands after them. Commands
   are already serializable and deterministic, so the same log gives the
   same workspace everywhere. Snapshots every 500 commands bound the
   replay. Offline, commands queue in IndexedDB and are sent in order on
   reconnect. Presence (who is on which page and block) rides the same
   event stream.
7. **Layers.** Network code on the client lives in `src/persistence/`
   (it persists to a remote store), which still imports only `state` and
   `model`. The server imports `src/model/` for its schemas, so a
   workspace is parsed by the same Valibot schemas on both sides. No
   server code is imported by `src/`.
8. **People.** Users are records the workspace can mention; the person,
   created by, last edited by and verification properties read them.
9. **Map.** The map view and place property draw OpenStreetMap tiles with
   a small renderer of our own over `<canvas>`, so no map library is
   added; places are typed or picked on the map (no geocoding service).
10. **AI.** An `AiProvider` interface on the server. The default provider
    calls a local Ollama server when one answers on `127.0.0.1:11434`;
    without it, a deterministic local provider handles what can be done
    without a model (summaries by extraction, autofill from rules) and
    says the model is not installed for the rest. No key is stored in the
    repository.

## Options Considered

### Option A: Node built-ins in Vite's process (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium: HTTP routing, sessions and SSE written by hand, small |
| Cost | No new dependency, no new process |
| Scalability | One machine, one writer: right for a local server |
| Team familiarity | Same TypeScript, same schemas, same test runner |

**Pros:** nothing to install; one port; schemas shared; tests run in the
same Vitest suite against `:memory:`.
**Cons:** hand-written routing and SSE; no WebSocket server (SSE plus
POST covers every flow Notion needs from the client's side).

### Option B: A framework and a database server (Express or Fastify, PostgreSQL, Socket.IO)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium |
| Cost | Several dependencies and a database service to install and run |
| Scalability | Higher than needed |
| Team familiarity | Common |

**Pros:** familiar pieces, WebSockets.
**Cons:** a second always-on process and a database service on a machine
where processes are rationed; more dependencies than the project allows.

### Option C: CRDT library (Yjs) with a sync server

**Pros:** offline merging of concurrent text edits per character.
**Cons:** a second model of the workspace beside the store, breaking the
single source of truth; the store's commands would have to be mapped to
CRDT operations everywhere. Rejected; the sequencer with replay keeps one
model, and text edits are commands on spans already.

## Trade-off Analysis

The sequencer gives a single order to every change, which is what the
store already assumes; concurrent typing in the same block resolves by
order of arrival at the span level rather than by character merging.
Notion itself resolves concurrent edits per block in its own transaction
log, so this matches Notion's behavior closely enough for one machine.

## Consequences

- Easier: every feature that needs other people (mentions, comments from
  others, share menus, presence, inbox notices) has a place to live.
- Harder: commands must stay deterministic (no `Date.now()` or random ids
  inside a command handler; they come in the payload, as they already
  should). A test checks replaying a log twice gives equal workspaces.
- The specification's sections 1, 3 and 4 change; `docs/architecture.md`
  and `docs/ownership.md` gain the server's rows.
- Revisit: WebSockets if a flow needs the client to stream many events per
  second; Yjs only if character-level merging proves necessary.

## Action Items

1. [ ] Milestones 22 to 30 in `docs/superpowers/plans/2026-11-14-full-notion.md`.
2. [ ] Server skeleton, migrations, health route, Vite plugin.
3. [ ] Accounts and Notion's sign-in screens.
4. [ ] Command log, SSE, offline queue, replay test.
5. [ ] Workspaces, members, sharing, guests, publishing.
6. [ ] People properties, presence, mentions of people, inbox notices.
7. [ ] Map view and place property.
8. [ ] AI provider, Notion AI menus, AI autofill.
