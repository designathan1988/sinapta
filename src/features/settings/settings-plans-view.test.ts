// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { renderPlans } from "./settings-plans.view.ts";

describe("Settings › Plans", () => {
  it("shows the free plan, and Upgrade turned off with the reason", () => {
    const host = document.createElement("div");
    render(renderPlans(), host);

    expect(host.textContent).toContain("Free, on your own server");
    expect(host.querySelector("button")?.disabled).toBe(true);
    expect(host.textContent).toContain("Payment is Notion's own service");
  });
});
