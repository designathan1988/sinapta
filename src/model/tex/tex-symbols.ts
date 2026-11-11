// The TeX commands that stand for one symbol, by what they become.
import type { MathNode } from "./tex-tree.ts";

function table(pairs: string): ReadonlyMap<string, string> {
  return new Map(
    pairs.split(" ").map((pair) => {
      const [name = "", symbol = ""] = pair.split(":");
      return [name, symbol];
    }),
  );
}

const GREEK = table(
  "alpha:α beta:β gamma:γ delta:δ epsilon:ϵ varepsilon:ε zeta:ζ eta:η " +
    "theta:θ vartheta:ϑ iota:ι kappa:κ lambda:λ mu:μ nu:ν xi:ξ pi:π " +
    "varpi:ϖ rho:ρ varrho:ϱ sigma:σ varsigma:ς tau:τ upsilon:υ phi:ϕ " +
    "varphi:φ chi:χ psi:ψ omega:ω Gamma:Γ Delta:Δ Theta:Θ Lambda:Λ Xi:Ξ " +
    "Pi:Π Sigma:Σ Upsilon:Υ Phi:Φ Psi:Ψ Omega:Ω",
);

const SYMBOLS = table(
  "infty:∞ partial:∂ nabla:∇ emptyset:∅ varnothing:∅ hbar:ℏ ell:ℓ " +
    "Re:ℜ Im:ℑ aleph:ℵ",
);

const LARGE = table(
  "sum:∑ prod:∏ coprod:∐ int:∫ iint:∬ iiint:∭ oint:∮ bigcup:⋃ bigcap:⋂",
);

const OPERATORS = table(
  "cdot:⋅ times:× div:÷ pm:± mp:∓ ast:∗ star:⋆ circ:∘ bullet:∙ " +
    "leq:≤ le:≤ geq:≥ ge:≥ neq:≠ ne:≠ approx:≈ equiv:≡ sim:∼ simeq:≃ " +
    "cong:≅ propto:∝ ll:≪ gg:≫ in:∈ notin:∉ ni:∋ subset:⊂ supset:⊃ " +
    "subseteq:⊆ supseteq:⊇ cup:∪ cap:∩ setminus:∖ wedge:∧ vee:∨ neg:¬ " +
    "lnot:¬ forall:∀ exists:∃ to:→ rightarrow:→ leftarrow:← gets:← " +
    "leftrightarrow:↔ Rightarrow:⇒ Leftarrow:⇐ Leftrightarrow:⇔ " +
    "implies:⟹ iff:⟺ mapsto:↦ uparrow:↑ downarrow:↓ mid:∣ parallel:∥ " +
    "perp:⊥ angle:∠ ldots:… dots:… cdots:⋯ vdots:⋮ ddots:⋱ prime:′ " +
    "langle:⟨ rangle:⟩ lfloor:⌊ rfloor:⌋ lceil:⌈ rceil:⌉ vert:| Vert:‖",
);

// Names set upright; lim and its kind carry limits like large operators.
const FUNCTIONS = new Set(
  (
    "sin cos tan cot sec csc arcsin arccos arctan sinh cosh tanh log ln " +
    "lg exp lim liminf limsup max min sup inf det gcd deg dim arg ker Pr"
  ).split(" "),
);

export const LIMIT_FUNCTIONS = new Set(
  "lim liminf limsup max min sup inf det gcd Pr".split(" "),
);

const SPACES = table(",:  ;:  quad:  qquad:  ");

// Characters TeX reserves, written with a backslash to mean themselves.
const ESCAPED = new Set(["{", "}", "%", "$", "#", "&", "_", " "]);

// The node a symbol command stands for, if it stands for one.
export function symbolNode(name: string): MathNode | undefined {
  const greek = GREEK.get(name) ?? SYMBOLS.get(name);
  if (greek !== undefined) return { kind: "identifier", text: greek };
  const large = LARGE.get(name);
  if (large !== undefined)
    return { kind: "operator", text: large, isLarge: true };
  const operator = OPERATORS.get(name);
  if (operator !== undefined) return { kind: "operator", text: operator };
  if (FUNCTIONS.has(name)) {
    return { kind: "identifier", text: name, isFunction: true };
  }
  const space = SPACES.get(name);
  if (space !== undefined) return { kind: "text", text: space };
  if (name === "!" || name === "\\") return { kind: "row", children: [] };
  if (ESCAPED.has(name)) return { kind: "operator", text: name };
  return undefined;
}

// What \left and \right may be followed by.
const DELIMITERS = table(
  "{:{ }:} |:‖ lbrace:{ rbrace:} langle:⟨ rangle:⟩ lfloor:⌊ rfloor:⌋ " +
    "lceil:⌈ rceil:⌉ vert:| Vert:‖",
);

export function delimiterOf(name: string): string | undefined {
  return DELIMITERS.get(name);
}

// The brackets each matrix environment is drawn in.
export const ENVIRONMENTS: ReadonlyMap<string, readonly [string, string]> =
  new Map([
    ["matrix", ["", ""]],
    ["smallmatrix", ["", ""]],
    ["aligned", ["", ""]],
    ["align", ["", ""]],
    ["array", ["", ""]],
    ["pmatrix", ["(", ")"]],
    ["bmatrix", ["[", "]"]],
    ["Bmatrix", ["{", "}"]],
    ["vmatrix", ["|", "|"]],
    ["Vmatrix", ["‖", "‖"]],
    ["cases", ["{", ""]],
  ]);
