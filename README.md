# Pagecraft

A local-first, single-user workspace app: nested pages edited as blocks and
database pages shown as a table. TypeScript, HTML and CSS, no UI framework.
It runs in the browser with no server and no account.

## Setup

Requires Node 22.12 or later.

```bash
npm install
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run check:watch` | Type check in watch mode |
| `npm run test:watch` | Tests in watch mode |
| `npm run tokens` | Rebuild `src/styles/tokens.generated.css` |
| `npm run lint` | ESLint, Stylelint and Prettier check |
| `npm run test` | Full test suite |
| `npm run verify` | Type check, lint and tests; run before every commit |
| `npm run build` | Production build in `dist/` |

## Documents

- `docs/specification.md`: scope, architecture, naming and workflow.
- `docs/architecture.md`: data flow and layers.
- `docs/ownership.md`: the one owner of each concern.
- `docs/decisions/`: decisions and their reasons.
