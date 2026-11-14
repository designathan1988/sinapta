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
- [ ] 23.3 Settings › My account: name, photo, email, password.

## Milestone 24: Sync

- [x] 24.1 Workspace on the server: upload the local workspace at first
  sign-in, download it on another browser.
- [x] 24.2 Operation log with sequences, SSE stream, the others' operations
  applied outside undo after taking back this client's unconfirmed ones.
- [ ] 24.3 Offline queue in IndexedDB, reconnect, the sync state in the
  top bar as Notion shows it.

## Milestone 25: Workspaces

- [x] 25.1 Several workspaces per account; Notion's workspace switcher;
  create; the one opened last opens at sign-in. (Rename, icon, leave and
  delete go with Settings in 25.2.)
- [ ] 25.2 Members and invitations (an invite link printed and shown),
  roles, Settings › People.

## Milestone 26: Sharing

- [ ] 26.1 Notion's Share menu: invite by email, page permissions (Full
  access, Can edit, Can comment, Can view), guests, General access.
- [ ] 26.2 Permissions enforced on the server for every command and read;
  the client shows read-only pages as Notion does.
- [ ] 26.3 Publish to web: a read-only page served by the server, the
  Publish tab with its options; Teamspaces and the Shared section.

## Milestone 27: Collaboration

- [ ] 27.1 Presence: avatars in the top bar, others' cursors and the
  block they edit.
- [ ] 27.2 People mentions, comments from others, the inbox's notices
  (mentions, replies, invites, page changes), notification settings.
- [ ] 27.3 Page history and updates with authors.

## Milestone 28: People properties

- [ ] 28.1 Person, Created by, Last edited by properties; filters, sorts,
  groups by person.
- [ ] 28.2 Verification on pages and the Verification property.

## Milestone 29: Map

- [ ] 29.1 Place property with a picker on a map.
- [ ] 29.2 Map view: tiles on a canvas, pins, zoom, pan, card on click.

## Milestone 30: AI

- [ ] 30.1 `AiProvider` on the server: Ollama when present, the local
  provider otherwise; streaming answers over SSE.
- [ ] 30.2 Notion AI in the editor: Ask AI on space and in the block
  menu, its actions (improve, fix spelling, shorter, longer, summarize,
  translate, explain), Insert below, Replace, Discard.
- [ ] 30.3 AI autofill for database properties; the AI chat in the
  sidebar ("New chat").
