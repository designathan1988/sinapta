# TypeScript

## Version checked

2026-11-10, Node 22.23.4, npm 10. `typescript@7.0.2` (npm `latest`), `@typescript/typescript6@6.0.2` (reports `Version 6.0.3`), `typescript-eslint@8.72.2`, `vite@8.3.7`, `vitest@5.1.0`. Everything below was run in a scratch project.

## Findings

- **TypeScript 7 is the native (Go) compiler.** The `typescript` package ships a `tsc` launcher plus per-platform binaries (`@typescript/typescript-linux-x64`, ...). Its main export only exposes `version`; there is **no JavaScript compiler API** in 7.0 (a new one is announced for 7.1).
- **`tsc --noEmit --watch` works in 7.0.2.** Ran it in the background without a TTY: first check, then "File change detected ... Found 0 errors" after an edit. The sample type-checked in 0.08 s (TS 6: 0.47 s). Both compilers reported identical errors.
- **typescript-eslint 8.72.2 does not support TS 7.** Peer range is `typescript >=4.8.4 <6.1.0`; `npm install` fails with `ERESOLVE`, and when forced ESLint crashes: `Error: typescript-eslint does not support TS 7.0`. Support for TS 7.1 is tracked in typescript-eslint issue 10940 (open, no date).
- **Vite 8 and Vitest 5 do not depend on `typescript`** (Vite transpiles with Oxc/Rolldown), so they are unaffected.
- **Working setup (verified): both compilers side by side**, as the TS 7 announcement recommends. The name `typescript` must resolve to the 6.0 API for typescript-eslint; TS 7 is installed under an alias and owns the `tsc` binary:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@7.0.2",
    "typescript": "npm:@typescript/typescript6@6.0.2"
  },
  "scripts": {
    "check": "tsc --noEmit",
    "check:watch": "tsc --noEmit --watch --preserveWatchOutput"
  }
}
```

  Result: `npx tsc -v` → 7.0.2, `npx tsc6 -v` → 6.0.3, `require("typescript").version` → 6.0.3, ESLint with typed rules runs clean.
- **tsconfig.json** (accepted without change by 6.0.3 and 7.0.2):

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "types": ["vite/client"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "erasableSyntaxOnly": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "scripts", "vite.config.ts"]
}
```

## Pitfalls

- TS 7 removed `baseUrl`, `moduleResolution: node10` and `target: es5` (hard errors); `types` now defaults to `[]`, so `vite/client` must be listed.
- `verbatimModuleSyntax` requires `import type` for types (error TS1484). `erasableSyntaxOnly` bans `enum`, namespaces and parameter properties; this is also what lets Node run `scripts/*.ts` directly (see `design-tokens.md`).
- Imports carry the `.ts` extension (`allowImportingTsExtensions`), which Vite, Vitest and Node all accept.
- Watch mode clears the screen with escape codes unless `--preserveWatchOutput` is passed; background logs are unreadable without it.
- Exit code on type errors is 1 in TS 7 and 2 in TS 6. Test only for non-zero.
- The editor uses whichever `typescript` it finds (6.0.3 here); the two compilers could in theory disagree. Fallback if that ever bites: drop the alias pair and pin `typescript@6.0.3` alone.

## Decision it supports

ADR for language and type checking: use TS 7.0.2 for `tsc` (meets "current stable release" and the 2 s watch budget) with `typescript` aliased to `@typescript/typescript6` for typescript-eslint. Revisit when typescript-eslint ships TS 7.1 support.

## Sources

- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ (section "Running side-by-side with TypeScript 6.0")
- https://typescript-eslint.io/users/dependency-versions/
- https://github.com/typescript-eslint/typescript-eslint/issues/10940
- https://www.typescriptlang.org/tsconfig/
