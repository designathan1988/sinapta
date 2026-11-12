// Every kind of block, made through the "/" menu on a new page as a person
// would, written in, then pointed at: its handles must stand level with
// its first line, whatever space the kind opens above it.
import type { Session } from "./audit-session.ts";
import { showsSoon, type Scenario } from "./scenarios-editor.ts";

const KINDS = [
  "Text",
  "Heading 1",
  "Heading 2",
  "Heading 3",
  "Heading 4",
  "Toggle heading 1",
  "Toggle heading 2",
  "Toggle heading 3",
  "Bulleted list",
  "Numbered list",
  "To-do list",
  "Toggle",
  "Quote",
  "Callout",
  "Code",
];

const BLOCKS = ".app__page .editor .editor__block";

async function newBlankPage(session: Session): Promise<void> {
  const { page } = session;
  await page
    .locator(".app__sidebar")
    .getByRole("button", { name: "New page" })
    .first()
    .click();
  await page.keyboard.type("Every block");
  await page.keyboard.press("Enter");
}

// Makes one block of a kind at the end of the page and checks it.
async function makeBlock(session: Session, kind: string): Promise<void> {
  const { page } = session;
  const words = `${kind} block`;
  await page.keyboard.type(`/${kind}`);
  const isOpen = await showsSoon(session, ".slash-menu__item");
  session.expect(isOpen, `make-${kind}`, `typing /${kind} opened no menu`);
  const label = new RegExp(`^${kind}$`);
  await page
    .locator(".slash-menu__item", {
      has: page.locator(".slash-menu__label", { hasText: label }),
    })
    .click();
  await page.keyboard.type(words);
  const block = page.locator(BLOCKS, { hasText: words }).last();
  const isMade = (await block.count()) > 0;
  session.expect(isMade, `make-${kind}`, `no block shows "${words}"`);
  await block.hover({ position: { x: 24, y: 4 } });
  const slug = kind.toLowerCase().replaceAll(" ", "-");
  await session.check(`kind-${slug}`, "on-problem");
  await page.locator(".app__page .editor__continue").click();
}

async function everyKind(session: Session): Promise<void> {
  await newBlankPage(session);
  for (const kind of KINDS) {
    try {
      await makeBlock(session, kind);
    } catch (error) {
      const reason = String(error).split("\n")[0] ?? "";
      session.expect(false, `make-${kind}`, `stopped: ${reason}`);
      await session.page.keyboard.press("Escape");
    }
  }
  await session.check("every-kind");
}

export const BLOCK_SCENARIOS: readonly Scenario[] = [
  { name: "every-kind", run: everyKind },
];
