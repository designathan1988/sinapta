// A parsed TeX expression, one node per MathML element it becomes.
export type MathNode =
  | { readonly kind: "row"; readonly children: readonly MathNode[] }
  | {
      readonly kind: "identifier";
      readonly text: string;
      // A name such as sin or lim, set upright rather than in italics.
      readonly isFunction?: boolean;
    }
  | { readonly kind: "number"; readonly text: string }
  | {
      readonly kind: "operator";
      readonly text: string;
      // A large operator such as a sum, with limits above and below it
      // in display equations.
      readonly isLarge?: boolean;
    }
  | { readonly kind: "text"; readonly text: string }
  // Source the parser did not know, shown as it was written.
  | { readonly kind: "error"; readonly text: string }
  | {
      readonly kind: "fraction";
      readonly numerator: MathNode;
      readonly denominator: MathNode;
    }
  | {
      readonly kind: "root";
      readonly base: MathNode;
      readonly index?: MathNode;
    }
  | {
      readonly kind: "scripts";
      readonly base: MathNode;
      readonly sub?: MathNode;
      readonly sup?: MathNode;
    }
  | {
      readonly kind: "fenced";
      readonly open: string;
      readonly close: string;
      readonly body: MathNode;
    }
  | {
      readonly kind: "matrix";
      readonly rows: readonly (readonly MathNode[])[];
    };

export type TexError =
  | "unclosed-brace"
  | "unexpected-close"
  | "missing-argument"
  | "missing-right"
  | "missing-delimiter"
  | "unclosed-environment";

export type TexResult =
  | { readonly ok: true; readonly tree: MathNode }
  | { readonly ok: false; readonly error: TexError; readonly offset: number };

export function row(children: readonly MathNode[]): MathNode {
  return { kind: "row", children };
}
