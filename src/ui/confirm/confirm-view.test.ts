// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { renderConfirm } from "./confirm.view.ts";

function rendered() {
  const calls: string[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderConfirm({
      question: "Delete this template?",
      answer: "Delete",
      cancel: "Cancel",
      onAnswer: () => calls.push("answer"),
      onCancel: () => calls.push("cancel"),
    }),
    host,
  );
  const button = (label: string) =>
    [...host.querySelectorAll("button")].find(
      (each) => each.textContent.trim() === label,
    );
  return { host, calls, button };
}

describe("a confirm question", () => {
  it("closes, then does what it asked about, on its answer", () => {
    const { calls, button } = rendered();

    button("Delete")?.click();

    expect(calls).toEqual(["cancel", "answer"]);
  });

  it("closes alone on Cancel and on Escape", () => {
    const { host, calls, button } = rendered();

    button("Cancel")?.click();
    host
      .querySelector(".confirm")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

    expect(calls).toEqual(["cancel", "cancel"]);
  });
});
