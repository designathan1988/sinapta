# Plan: full Notion parity with a local server (milestones 22 to 30)

Decided in ADR-0013. Each task is a vertical slice that ends running,
photographed with `npm run capture`, `npm run verify` green and one
Conventional Commit. Server code lives in `server/`; client network code
in `src/persistence/`.

## Milestone 22: Local server

- [x] 22.1 `server/` with `node:http` routing, `node:sqlite` database,
  numbered migrations, `GET /api/health`; mounted in Vite by a plugin;
  `npm run serve` standalone serving `dist/`. Tests on `:memory:`.
- [x] 22.2 Architecture rules for `server/` (imports `src/model/` only;
  nothing in `src/` imports it) in `src/app/architecture.test.ts`.

## Milestone 23: Accounts

- [x] 23.1 Users, scrypt hashes, sessions in a cookie; sign up, sign in,
  sign out, `GET /api/me`; Origin check.
- [x] 23.2 Notion's sign-in screens (email, then password or a login
  code printed by the server), the account in the sidebar's workspace
  menu, Log out; with no server answering, the app keeps today's local
  mode on the browser's copy.
- [x] 23.3 Settings › My account: the preferred name and the email.

## Milestone 24: Sync

- [x] 24.1 Workspace on the server: upload the local workspace at first
  sign-in, download it on another browser.
- [x] 24.2 Operation log with sequences, SSE stream, the others' operations
  applied outside undo after taking back this client's unconfirmed ones.
- [x] 24.3 The unconfirmed transactions kept in IndexedDB (the meta store's
  "outbox"), retried while open and made again on the server's workspace
  after a reload; the top bar says Syncing… or Offline while changes wait.

## Milestone 25: Workspaces

- [x] 25.1 Several workspaces per account; Notion's workspace switcher;
  create; the one opened last opens at sign-in. (Rename, icon, leave and
  delete go with Settings in 25.2.)
- [x] 25.2 Members and invitations (an address without an account joins
  when it signs up), roles, Settings › My account, General and People.

## Milestone 26: Sharing

- [x] 26.1 Notion's Share menu: invite by email, page permissions (Full
  access, Can edit, Can comment, Can view), guests, General access.
- [x] 26.2 Guests: the server sends them only the pages shared with them,
  passes on only the operations inside, and refuses their changes outside
  pages they may edit. The client knows each shared page's access: a page
  they may only view or comment on reads as a locked page, and the
  dispatcher refuses its changes, comments excepted where they may
  comment. Members too read only what they may: the teamspaces, their own
  top pages, pages open to the workspace, and pages shared with them (the
  pages made before pages had makers are the workspace owner's, the
  browser's copy they uploaded); another member's private
  pages are neither sent to them nor changed by them.
- [x] 26.3 Publish to web: a read-only page served by the server and the
  Publish tab, and the sidebar's Shared section: the top pages shared
  with people, and "Start collaborating" while none is. Teamspaces:
  Settings › Teamspaces with its Owners, Access filter and search, and
  its "Create a teamspace", the sidebar's
  Teamspaces section, pages added inside; a teamspace open to the
  workspace or closed to its members, who join and leave in Settings, and
  the server sends a closed one to its members and maker alone.

## Milestone 27: Collaboration

- [x] 27.1 Presence: the faces of the others on the open page in the top
  bar, beside the block each writes in, and their caret in its text with
  their name.
- [x] 27.2 People mentions ("@" lists the workspace's people), each
  comment's author, the inbox's mentions and replies, the edits others
  make to one's pages, and a guest's shared pages; Settings ›
  Notifications turns each kind off or on.
- [x] 27.3 Page history names who wrote each version.

## Milestone 28: People properties

- [x] 28.1 Created by and Last edited by: the dispatcher stamps the
  signed-in person on every block made or changed; filters and sorts.
- [x] 28.1b The Person property: the workspace's people chosen in the
  cell's popover and on the row's page; filters Contains, Is empty, Is
  not empty; views group by it, a group per person.
- [x] 28.2 Verify in the page menu, the verified badge in the top bar, and
  the Verification property with its filters.

## Milestone 29: Map

- [x] 29.1 Place property, typed as "Name @ latitude, longitude" (address
  search needs a geocoding service), or picked on the map: a double-click
  adds a row at that place.
- [x] 29.2 Map view: OpenStreetMap tiles framed to every pin, a pin per
  row that opens it; drag to move, scroll or "+"/"−" to zoom.

## Milestone 30: AI

- [x] 30.1 AI on the server: Ollama when it answers on 127.0.0.1:11434
  (model from PAGECRAFT_AI_MODEL, llama3.2 by default), else a local
  provider for summaries, shorter text and action items; the answer is
  streamed as Server-Sent Events and shown as it is written.
- [x] 30.2 Ask AI in the block menu with Notion's actions, the answer with
  Insert below, Replace, Discard; Space on an empty line opens "Ask AI
  anything…", whose plain-text requests the local provider answers too.
- [x] 30.3 AI autofill for a text property (summary, action items), done
  by the server for every row; the AI chat from the sidebar's "New chat".
