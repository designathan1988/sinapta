// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  createTestApp,
  setWorkspaces,
  syncCommands,
  uiCommands,
  type Command,
} from "../state/index.ts";
import { openBillingOnReturn } from "./billing-return.ts";

describe("coming back from the payment processor's page", () => {
  it("opens Billing again and reads the card once the workspace is open", async () => {
    window.history.replaceState(null, "", "/?billing=saved");
    const app = createTestApp({ commands: [...uiCommands, ...syncCommands] });
    const sent: Command[] = [];
    const dispatch = (command: Command) => {
      sent.push(command);
      return app.dispatch(command);
    };

    openBillingOnReturn(app.store, dispatch);
    app.dispatch(setWorkspaces.create({ workspaces: [], workspaceId: "w1" }));
    await Promise.resolve();

    expect(window.location.search).toBe("");
    expect(app.store.getState().ui.overlay).toMatchObject({
      kind: "settings",
      anchorId: "billing",
    });
    expect(sent).toContainEqual(
      expect.objectContaining({ request: { kind: "billing" } }),
    );
  });
});
