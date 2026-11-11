// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { renderEquationInto, renderMath } from "./equation.view.ts";

function rendered(source: string, display: "block" | "inline" = "block") {
  const host = document.createElement("div");
  render(renderMath(source, display), host);
  return host;
}

describe("renderMath", () => {
  it("draws a fraction as MathML", () => {
    const math = rendered("\\frac{a}{b}").querySelector("math");

    expect(math?.getAttribute("display")).toBe("block");
    expect(math?.querySelector("mfrac mi")?.textContent).toBe("a");
    expect(math?.querySelectorAll("mfrac > *")).toHaveLength(2);
  });

  it("puts limits under and over a sum in a block, beside it inline", () => {
    expect(rendered("\\sum_i^n x").querySelector("munderover")).not.toBeNull();
    expect(
      rendered("\\sum_i^n x", "inline").querySelector("msubsup"),
    ).not.toBeNull();
  });

  it("shows source it cannot read as an error, as written", () => {
    const error = rendered("\\frac{1").querySelector("merror");

    expect(error?.textContent.trim()).toBe("\\frac{1");
  });
});

describe("renderEquationInto", () => {
  it("draws the equation in a shadow root and keeps the light text", () => {
    const host = document.createElement("span");
    host.append("x^2");

    renderEquationInto(host, "x^2");

    expect(host.textContent).toBe("x^2");
    expect(host.shadowRoot?.querySelector("math msup")).not.toBeNull();
  });
});
