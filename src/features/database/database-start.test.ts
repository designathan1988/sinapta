import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { selectDatabase } from "../../blocks/database/index.ts";
import { createTestApp, UNDO_COMMAND } from "../../state/index.ts";
import {
  databaseStartCommands,
  startDatabase,
} from "./database-start.commands.ts";

const PAGE = toBlockId("page");

function createApp(children: { id: string }[] = []) {
  const props = {
    title: [{ text: "Plan" }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
  };
  const workspace = buildWorkspace([{ id: "page", props, children }]);
  const app = createTestApp({ workspace, commands: databaseStartCommands });
  const block = () => app.store.getState().workspace.blocks[PAGE];
  const views = () => Object.values(app.store.getState().workspace.views);
  const properties = () =>
    selectDatabase(app.store.getState(), PAGE)?.props.properties ?? [];
  return { ...app, block, views, properties };
}

describe("database.startFromPage", () => {
  it("turns an empty page into a database shown as a table", () => {
    const { dispatch, block, views } = createApp();

    dispatch(startDatabase.create({ pageId: PAGE, viewType: "table" }));

    expect(block()?.type).toBe("database");
    expect(block()?.props).toMatchObject({
      title: [{ text: "Plan" }],
      properties: [],
    });
    expect(views().map((view) => view.type)).toEqual(["table"]);
  });

  it("gives a board a status property to group by", () => {
    const { dispatch, properties, views } = createApp();

    dispatch(startDatabase.create({ pageId: PAGE, viewType: "board" }));

    const [status] = properties();
    expect(status).toMatchObject({ name: "Status", type: "select" });
    expect(status?.options).toHaveLength(3);
    expect(views()[0]?.groupPropertyId).toBe(status?.id);
  });

  it("gives a calendar a date property to place rows by", () => {
    const { dispatch, properties, views } = createApp();

    dispatch(startDatabase.create({ pageId: PAGE, viewType: "calendar" }));

    const [date] = properties();
    expect(date).toMatchObject({ name: "Date", type: "date" });
    expect(views()[0]?.datePropertyId).toBe(date?.id);
  });

  it("leaves a page that already has content alone", () => {
    const { dispatch, block } = createApp([{ id: "text" }]);

    dispatch(startDatabase.create({ pageId: PAGE, viewType: "table" }));

    expect(block()?.type).toBe("page");
  });

  it("is undone in one step", () => {
    const { dispatch, block, views } = createApp();

    dispatch(startDatabase.create({ pageId: PAGE, viewType: "board" }));
    dispatch({ type: UNDO_COMMAND });

    expect(block()?.type).toBe("page");
    expect(views()).toEqual([]);
  });
});
