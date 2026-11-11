// Languages with C's comments and strings: JavaScript, TypeScript, JSON,
// Java, C, C#, Go and Rust.
import { words, type Grammar } from "./code-grammar.ts";

const C_COMMENTS = {
  lineComments: ["//"],
  blockComments: [["/*", "*/"]],
} as const;

const JS_KEYWORDS =
  "async await break case catch class const continue debugger default " +
  "delete do else export extends false finally for from function if " +
  "import in instanceof let new null of return static super switch this " +
  "throw true try typeof undefined var void while with yield";

const TS_KEYWORDS =
  "abstract any as asserts bigint boolean declare enum implements infer " +
  "interface is keyof namespace never number private protected public " +
  "readonly satisfies string symbol type unique unknown";

export const C_FAMILY_GRAMMARS = {
  javascript: {
    ...C_COMMENTS,
    keywords: words(JS_KEYWORDS),
    quotes: ['"', "'", "`"],
    multilineQuotes: ["`"],
  },
  typescript: {
    ...C_COMMENTS,
    keywords: words(`${JS_KEYWORDS} ${TS_KEYWORDS}`),
    quotes: ['"', "'", "`"],
    multilineQuotes: ["`"],
  },
  json: { keywords: words("true false null"), quotes: ['"'] },
  java: {
    ...C_COMMENTS,
    keywords: words(
      "abstract boolean break byte case catch char class const continue " +
        "default do double else enum extends false final finally float for " +
        "if implements import instanceof int interface long new null " +
        "package private protected public record return short static super " +
        "switch this throw throws true try var void volatile while",
    ),
    quotes: ['"""', '"', "'"],
    multilineQuotes: ['"""'],
  },
  c: {
    ...C_COMMENTS,
    keywords: words(
      "auto bool break case char const continue default define do double " +
        "else endif enum extern false float for goto if ifdef ifndef " +
        "include inline int long NULL pragma register return short signed " +
        "sizeof static struct switch true typedef union unsigned void " +
        "volatile while",
    ),
    quotes: ['"', "'"],
  },
  csharp: {
    ...C_COMMENTS,
    keywords: words(
      "abstract as async await base bool break byte case catch char class " +
        "const continue decimal default delegate do double else enum event " +
        "false finally float for foreach get if in int interface internal " +
        "is lock long namespace new null object out override params private " +
        "protected public readonly record ref return sealed set short static " +
        "string struct switch this throw true try typeof uint ulong using " +
        "var virtual void while",
    ),
    quotes: ['"', "'"],
  },
  go: {
    ...C_COMMENTS,
    keywords: words(
      "bool break byte case chan const continue default defer else error " +
        "fallthrough false float64 for func go goto if import int interface " +
        "map nil package range return select string struct switch true type " +
        "var",
    ),
    quotes: ['"', "'", "`"],
    multilineQuotes: ["`"],
  },
  rust: {
    ...C_COMMENTS,
    keywords: words(
      "as async await break const continue crate dyn else enum Err extern " +
        "false fn for if impl in let loop match mod move mut None Ok pub ref " +
        "return self Self Some static struct super trait true type unsafe " +
        "use where while",
    ),
    quotes: ['"'],
    multilineQuotes: ['"'],
  },
} as const satisfies Record<string, Grammar>;
