// Markup and style sheets: HTML, CSS and Markdown.
import { words, type Grammar } from "./code-grammar.ts";

export const MARKUP_GRAMMARS = {
  html: {
    keywords: words(""),
    hasTags: true,
    blockComments: [["<!--", "-->"]],
    quotes: ['"', "'"],
    word: /[A-Za-z_][\w:-]*/y,
  },
  css: {
    keywords: words(
      "auto charset container font-face import important inherit initial " +
        "keyframes layer media none revert supports unset",
    ),
    blockComments: [["/*", "*/"]],
    quotes: ['"', "'"],
    word: /-{0,2}[A-Za-z_][\w-]*/y,
  },
  markdown: {
    keywords: words(""),
    quotes: ["```", "`"],
    multilineQuotes: ["```"],
  },
} as const satisfies Record<string, Grammar>;
