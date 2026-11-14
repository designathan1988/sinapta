// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../../state/index.ts";
import { createDatabaseApp } from "../database-builder.ts";
import { renderDatabase } from "../database.view.ts";
import { VIEW_SETTINGS_OVERLAY } from "./view-settings.view.ts";

const MEETING = { title: "Weekly sync", date: "2026-11-16", time: "10:00" };

// The view settings on Linked events, with a calendar connected or not.
function rendered(hasCalendar: boolean) {
  const app = createDatabaseApp([{ name: "When", type: "date" }], []);
  const [when] = app.propertyIds;
  const built = app.store.getState();
  const sync = {
    ...built.persistence.sync,
    apps: hasCalendar
      ? [{ app: "google-calendar", host: "calendar.test" }]
      : [],
    calendarEvents: hasCalendar ? [MEETING] : [],
  };
  const overlay: OpenOverlay = {
    kind: VIEW_SETTINGS_OVERLAY,
    anchorId: app.databaseId,
    panel: "linked-events",
  };
  const state = {
    ...built,
    persistence: { ...built.persistence, sync },
    ui: { ...built.ui, overlay },
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent, when, databaseId: app.databaseId };
}

describe("the view settings' Linked events, as Notion's", () => {
  it("asks to connect a calendar, in Settings › Connections", () => {
    const { host, sent } = rendered(false);
    const connect = [...host.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Connect calendar",
    );

    connect?.click();

    expect(host.textContent).toContain(
      "Connect a calendar to choose meetings and automatically file their notes here.",
    );
    expect(sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: "settings", anchorId: "connections" },
    });
  });

  it("files a coming meeting's notes here as a page on its day", () => {
    const { host, sent, when, databaseId } = rendered(true);
    const meeting = [
      ...host.querySelectorAll<HTMLElement>("[data-index]"),
    ].find((row) => row.textContent.includes("Weekly sync"));

    meeting?.click();

    expect(sent.find((command) => command.type === "row.add")).toMatchObject({
      type: "row.add",
      databaseId,
      title: "Weekly sync",
      opensPage: true,
      values: { [when ?? ""]: { start: "2026-11-16" } },
    });
  });
});
