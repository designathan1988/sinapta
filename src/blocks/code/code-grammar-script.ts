// Languages with "#" or "--" comments: Python, shell and SQL.
import { words, type Grammar } from "./code-grammar.ts";

export const SCRIPT_GRAMMARS = {
  python: {
    keywords: words(
      "and as assert async await break class continue def del elif else " +
        "except False finally for from global if import in is lambda None " +
        "nonlocal not or pass print raise return self True try while with " +
        "yield",
    ),
    lineComments: ["#"],
    quotes: ['"""', "'''", '"', "'"],
    multilineQuotes: ['"""', "'''"],
  },
  shell: {
    keywords: words(
      "alias case cd do done echo elif else esac exit export fi for " +
        "function if in local readonly return source then unset until while",
    ),
    lineComments: ["#"],
    quotes: ['"', "'", "`"],
    multilineQuotes: ['"', "'"],
    word: /[A-Za-z_$][\w$-]*/y,
  },
  sql: {
    keywords: words(
      "add all alter and as asc avg begin between by case check commit " +
        "count create default delete desc distinct drop else end exists " +
        "foreign from full group having in index inner insert into is join " +
        "key left like limit max min not null offset on or order outer " +
        "primary references right rollback select set sum table then union " +
        "unique update values view when where with",
    ),
    isCaseInsensitive: true,
    lineComments: ["--"],
    blockComments: [["/*", "*/"]],
    quotes: ["'", '"'],
  },
} as const satisfies Record<string, Grammar>;
