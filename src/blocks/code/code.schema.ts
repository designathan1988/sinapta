import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const CODE_TYPE = "code";

// The languages a code block can be highlighted as, in menu order.
export const CODE_LANGUAGES = [
  "plain",
  "javascript",
  "typescript",
  "json",
  "html",
  "css",
  "python",
  "java",
  "c",
  "csharp",
  "go",
  "rust",
  "sql",
  "shell",
  "markdown",
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

// Other names a language goes by, as in the word after a Markdown fence.
const ALIASES: Readonly<Record<string, CodeLanguage>> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  htm: "html",
  xml: "html",
  py: "python",
  cpp: "c",
  "c++": "c",
  h: "c",
  cs: "csharp",
  "c#": "csharp",
  golang: "go",
  rs: "rust",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  console: "shell",
  md: "markdown",
  text: "plain",
  txt: "plain",
};

// The language a name stands for, in any case, if the app knows it.
export function codeLanguageOf(name: string): CodeLanguage | undefined {
  const key = name.trim().toLowerCase();
  const known = CODE_LANGUAGES.find((language) => language === key);
  return known ?? (Object.hasOwn(ALIASES, key) ? ALIASES[key] : undefined);
}

// Format version 9 adds the language, line wrapping and a caption, all
// optional: a block without them is plain, unwrapped and uncaptioned.
export const codePropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
  language: v.optional(v.picklist(CODE_LANGUAGES)),
  isWrapped: v.optional(v.boolean()),
  caption: v.optional(richTextSchema),
});

export type CodeProps = v.InferOutput<typeof codePropsSchema>;
export type CodeBlock = TypedBlock<typeof CODE_TYPE, CodeProps>;
