# ADR-0010: Version 1.1 scope and format changes

**Status:** Accepted
**Date:** 2026-11-11 (asked for by the owner on 2026-11-10)
**Deciders:** Project owner

## Context

Version 1 met its specification, but the owner judged the app too basic and
asked for a complete, end-to-end workspace. Some of what a Notion-style app
is expected to do was listed as out of scope (board, calendar and gallery
views, file images), and several additions change the workspace file, which
is a public contract.

## Decision

Widen the scope as `docs/plan.md` lists in milestones 8 to 10, keeping the
version 1 architecture unchanged: one store, one dispatcher, one owner per
concern, tokens only, five runtime libraries. Still out of scope: anything
that needs a server (collaboration, accounts, sync, uploads to a server),
formulas, relations and rollups.

The file format changes three times, each with its own migration so that
every older file still loads and imports:

| Version | Adds | Migration |
| --- | --- | --- |
| 2 | Underline and strikethrough marks; `color` and `highlight` on text spans | `0002-text-styles.ts`, identity |
| 3 | View types `board`, `gallery`, `list`, `calendar`; `groupPropertyId`, `datePropertyId` | `0003-view-layouts.ts`, identity |
| 4 | Page `cover` and `isFullWidth` | `0004-page-cover.ts`, identity |

Each change only adds optional keys or new enum values, so a file of the
previous version is already valid and its migration only raises the
version. A file from a newer version is still refused, not partly read.

Images chosen from a file are kept in the workspace as raster data
addresses of at most 5 MB, since there is no server to upload them to. The
production content security policy allows images from https addresses.

## Options considered

### Option A: One format version for all additions

**Pros:** one migration. **Cons:** the format would change ahead of the
features that use it; a file written halfway through would claim keys no
code reads yet.

### Option B: One version per change (chosen)

**Pros:** every released state of the app writes a version that matches
what it can read; each migration is small and named for its change.
**Cons:** three migration files that do nothing but raise the version.

## Consequences

- Older apps refuse files written by version 1.1, with the "newer version"
  message, rather than dropping colors, layouts or covers silently.
- A data address can make an exported file large; the 5 MB cap keeps one
  image from dominating it.
- Revisit if a later change needs to move or rename data: that migration
  will be the first that is not an identity.
