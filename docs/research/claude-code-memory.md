# Claude Code memory: CLAUDE.md and path-scoped rules

Substitute for the unavailable `product-self-knowledge` skill: the official
memory documentation was read directly on 2026-11-10.

## Findings

- `CLAUDE.md` target: "under 200 lines per CLAUDE.md file". Longer files
  "consume more context and reduce adherence".
- Instructions should be "concrete enough to verify" ("Use 2-space
  indentation", not "format code nicely").
- Rules are "context, not enforced configuration". Anything that must hold
  is enforced by lint, not by a sentence in `CLAUDE.md`.
- `.claude/rules/*.md`: YAML front matter with one key, `paths` ("the only
  field Claude Code reads from a rule"). It "accepts a YAML list or a
  comma-separated string".
- Globs are relative to the directory that contains `.claude`. Brace
  expansion works, so `src/{ui,features,blocks}/**/*.ts` is valid.
- "A path-scoped rule loads when Claude uses the Read, Write, or Edit tool
  on a matching file."
- A rule file without `paths`, or with invalid YAML, loads at launch like
  `CLAUDE.md`. A typo in front matter therefore costs context in every
  session.
- `@path` imports exist but load with the importing file, so they do not
  save context. Pagecraft uses "Read on demand" pointers instead.

## Pitfalls

- Auto memory is machine-local and is not shared with cloud sessions; the
  repository files are the only durable memory.

## Decision it supports

`CLAUDE.md` is written exactly as specification section 8 gives it (58
lines). The six rule files use a YAML list under `paths` and stay at or
under 30 lines. Limits that lint enforces are not repeated in rule files.

## Sources

- https://code.claude.com/docs/en/memory
