// Renders a database's view settings for the tests of its panels: a
// table with a date and a files property, set up as asked.
import { render } from "lit-html";
import type { Command, Dispatch, OpenOverlay } from "../../../state/index.ts";
import type { PropertyId } from "../../../model/index.ts";
import { createDatabaseApp } from "../database-builder.ts";
import { renderDatabase } from "../database.view.ts";
import { setViewGroupBy } from "../group.commands.ts";
import { setViewType } from "../view-layout.commands.ts";
import { sortByProperty } from "../view.commands.ts";
import { VIEW_SETTINGS_OVERLAY } from "./index.ts";

export interface Setup {
  readonly panel?: string;
  readonly grouped?: boolean;
  readonly board?: boolean;
  readonly sorted?: boolean;
  readonly calendar?: boolean;
}

type App = ReturnType<typeof createDatabaseApp>;

// The view as the test asks: its layout, its grouping and its sort.
function arrange(app: App, setup: Setup, due: PropertyId): void {
  const viewId = app.view().id;
  const layout =
    setup.board === true
      ? "board"
      : setup.calendar === true
        ? "calendar"
        : undefined;
  if (layout !== undefined) {
    app.dispatch(setViewType.create({ viewId, viewType: layout }));
  }
  if (setup.grouped === true) {
    app.dispatch(setViewGroupBy.create({ viewId, propertyId: due }));
  }
  if (setup.sorted === true) {
    const sort = { viewId, propertyId: due, keepOthers: true } as const;
    app.dispatch(sortByProperty.create({ ...sort, direction: "descending" }));
  }
}

function rowFinder(host: HTMLElement) {
  return (label: string): HTMLElement => {
    const found = [
      ...host.querySelectorAll<HTMLElement>(".menu [data-index]"),
    ].find(
      (item) =>
        item.querySelector(".menu__label")?.textContent.trim() === label,
    );
    if (found === undefined) throw new Error(`no ${label} row`);
    return found;
  };
}

export function rendered(setup: Setup = {}) {
  const app = createDatabaseApp(
    [
      { name: "Due", type: "date" },
      { name: "Files", type: "files" },
    ],
    [],
  );
  const viewId = app.view().id;
  const [due, files] = app.propertyIds;
  if (due === undefined || files === undefined) throw new Error("setup");
  arrange(app, setup, due);
  const built = app.store.getState();
  const overlay: OpenOverlay = {
    kind: VIEW_SETTINGS_OVERLAY,
    anchorId: app.databaseId,
    ...(setup.panel !== undefined && { panel: setup.panel }),
  };
  const state = { ...built, ui: { ...built.ui, overlay } };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatabase(state, dispatch), host);
  return { host, sent, row: rowFinder(host), due, files, viewId };
}
