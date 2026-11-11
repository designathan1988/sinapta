// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../state/index.ts";
import { renderShell } from "./shell.view.ts";

describe("renderShell", () => {
  it("opens the keyboard shortcuts from the help button in the corner", () => {
    const sent: Command[] = [];
    const dispatch: Dispatch = (command) => {
      sent.push(command);
      return { ok: true };
    };
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(renderShell(createInitialState(), dispatch), host);

    host.querySelector<HTMLButtonElement>(".app__help button")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "shortcut-help" },
      }),
    ]);
  });
});
