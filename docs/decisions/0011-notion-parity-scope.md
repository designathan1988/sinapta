# ADR-0011: Notion parity scope and contract clarifications

**Status:** Accepted
**Date:** 2026-11-11 (asked for by the owner on 2026-11-11; decided under
the owner's standing delegation of 2026-11-10)
**Deciders:** Project owner

## Context

Version 1.1 met its roadmap, but the owner asked for every Notion feature,
with Notion's layout and interactivity. ADR-0010 kept formulas, relations
and rollups out of scope, and the specification lists several Notion
features as out of scope for version 1. An audit of the code against the
contract on the same day (findings C1 to C12 in
`docs/superpowers/specs/2026-11-11-notion-parity-design.md`) also found
places where the specification no longer describes the code, or where the
code drifted from the specification.

## Decision

Widen the scope to every Notion feature that one person can use alone and
offline, as the design document lists in section 4 and the plan
`docs/superpowers/plans/2026-11-11-notion-parity.md` orders into milestones
11 to 20. The architecture, the five runtime libraries and every limit stay.

Still out of scope: real-time collaboration, sharing, permissions, guests,
publishing to the web, notifications to other people or devices, sync, AI
features, integrations and the public API, link previews that need a
server, transcription, the people, created by, last edited by and
verification properties, the map view and place property, and multiple
workspaces.

| # | Decision |
| --- | --- |
| D1 | In scope: Notion features usable by one person offline |
| D2 | One schema version per format change, each with its migration |
| D3 | Follow Notion's interaction patterns; keep Pagecraft's own name, icons, tokens and words |
| D4 | Equations: a TeX subset parsed in `src/model/tex/` into MathML, rendered with lit-html's `mathml` tag |
| D5 | Code highlighting: own tokenizers, painted with the CSS Custom Highlight API |
| D6 | Files live in an IndexedDB asset store owned by `src/persistence/`, 50 MB per file, exported as base64 |
| D7 | Formulas: own expression language, computed by selectors, never stored |
| D8 | Two-way relations update both sides in one transaction |
| D9 | Embeds: sandboxed iframes for an allow-list of https hosts, mirrored in the CSP `frame-src` |
| D10 | One writer per browser profile through Web Locks; other tabs are read-only and follow saves |
| D11 | Comments and page history are local records |
| D12 | Archives are uncompressed ZIP files written by our own writer |
| D13 | `>` followed by a space makes a toggle; `"` makes a quote |
| D14 | Turn-into shortcuts are Ctrl+Shift+0 to 9 on Windows and Linux, Cmd+Option on macOS |
| D15 | Emoji data is generated at build time into a TypeScript module |

The contract is clarified where the audit found it ambiguous or out of date:

- A command handler returns a `CommandEffect`: operations, or a whole
  workspace for load, import and seed, plus optional `ui`, `persistence`
  and merge key. A returned workspace is checked against the invariants
  like any transaction.
- A child folder may import its parent's modules (a block type its
  `block-definition.ts`, a database layout its database feature); a parent
  imports a child only through the child's `index.ts`.
- The six role suffixes mark those six roles. Any other module is named for
  its concept with no suffix; test fixtures end in `-builder.ts`.
- A feature's `index.ts` may hold exactly one gathered `xCommands` array
  besides its re-exports.

## Options considered

### Option A: Parity inside the current architecture (chosen)

**Pros:** every rule, library and test stays meaningful; each slice ships
on its own. **Cons:** formulas, equations and code highlighting are built
here rather than taken from a library.

### Option B: Adopt an editor framework

**Pros:** faster rich text features. **Cons:** the framework, not the
store, would own text; it breaks "one store, one dispatcher" and adds large
dependencies. Rejected.

## Consequences

- Specification section 1 points to the design document for scope; the
  "Out of scope" list is the one above.
- The workspace file changes many times; ADR-0010's rule of one migration
  per change continues.
- Revisit if a feature cannot be built without a sixth runtime library:
  that needs its own ADR before any code.
