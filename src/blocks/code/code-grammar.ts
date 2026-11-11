// How a language is read for highlighting. A grammar names its keywords
// and how its comments and strings start and end; one tokenizer reads
// every language with it (design decision D5).
export type TokenKind =
  "keyword" | "string" | "number" | "comment" | "function" | "punctuation";

export interface Grammar {
  readonly keywords: ReadonlySet<string>;
  // Keywords match in any case, as in SQL.
  readonly isCaseInsensitive?: boolean;
  readonly lineComments?: readonly string[];
  readonly blockComments?: readonly (readonly [string, string])[];
  // Marks that open and close strings, longest first. Strings end at the
  // end of their line unless their mark is also in `multilineQuotes`.
  readonly quotes?: readonly string[];
  readonly multilineQuotes?: readonly string[];
  // A sticky pattern for names, when the language allows more than
  // letters, digits, "_" and "$" in them.
  readonly word?: RegExp;
  // A name right after "<" or "</" is a tag name, shown as a keyword.
  readonly hasTags?: boolean;
}

export function words(list: string): ReadonlySet<string> {
  return new Set(list.split(" ").filter((word) => word !== ""));
}
