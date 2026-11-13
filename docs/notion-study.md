# Notion study

The one source of truth for what Notion looks like and does, and how far
Pagecraft matches it. Every study of Notion lands here: measures, the
behavior seen, what Pagecraft does today, and what is left. No other file
holds Notion findings; `docs/design-system.md` holds only the tokens that
carry them.

## How Notion is studied

- Notion is photographed only with `npm run capture -- notion <url |
  steps.json>` (`scripts/capture.ts`): headless, 1440 × 900 at 2x, in a
  context carrying the sign-in of the test account's Chrome window
  (port 9333, never closed). Interacting with the test account is
  allowed.
- A plan's steps click, type, press, hover and read like a person: the
  mouse stays on what it clicked, so submenus that open on hover stay
  open. Each action names what it expects to appear; Escape at the start
  closes a panel Notion leaves open after loading.
- Every menu is entered, and every row with a chevron opened, before it
  is written down; each photo is opened and looked at.
- Read Notion with `read` steps in the page: `innerText` of
  `.notion-overlay-container` for a menu's words, `getBoundingClientRect()`
  and `getComputedStyle()` for sizes and colors (custom properties such
  as `--c-bacEle`, `--c-texPri`).
- Photos: `.captures/notion/<plan>/NN-step.png`.
- Undo every change made in Notion during a study.

## Interaction states (measured with a real pointer, 2026-11-13)

Static measures missed a black square behind the page icon on hover, so
every control is now checked in its states: rest, pointed at, pressed,
open, focused, by a real pointer, in Notion and in Pagecraft.

| Control | Notion when pointed at |
| --- | --- |
| Most buttons, rows, chips, menu rows, toolbar tools, table header, "New page", calculations, block "+" and grip | a wash `--ca-bacIntTra`: `#ffffff0e` by night, `#211b170d` by day; pressed or open doubles it |
| Sidebar's top icon buttons (hide, inbox, new page) | a stronger wash `--ca-borPriTra`: `#ffffeb1a` by night, `#1c13011c` by day |
| Page icon, database icon | nothing; only the pointer cursor |
| "Edited 5h ago" in the top bar | nothing |
| Table cells | nothing (the value bar appears instead) |
| "New" | its blue fill turns `rgb(61 144 225)` |
| To-do box | a light wash (`--ca-bacSecTra` × 1.5); box 16 px, radius 1.5 px, border `#e6e5e3` by night, `#383836` by day; ticked `#2783de` |
| Row tick box | radius 3 px, border `#fffceb4e` by night, `#1b150030` by day |
| Raised bars (cell actions, peek) | `--c-shaOutMd`: by night `0 0 0 1px #383836, 0 4px 12px -2px #19191914`; by day `0 8px 12px #19191907, 0 2px 6px #19191907, 0 0 0 1px #2a1c0012` |

Notion's washes are translucent, so they read the same on the page, the
sidebar, a cover or a menu. Pagecraft's were opaque, which drew a dark
box wherever the surface under them differed: fixed at the token
(`color.bg.hover`, `color.bg.active`, `color.bg.hoverStrong`).

## How Pagecraft is checked against it

1. Open the review server (`npm run dev -- --port 5190`, launch config
   "review"), never the owner's workspace.
2. Capture it headless at 1440 × 900 at 2x: Chrome driven by the
   project's `playwright-core`, a real mouse pointing at each control,
   each region photographed at native pixels and looked at.
3. Open the control with the pointer, then again with the keyboard:
   arrows move, Enter chooses, Escape closes and gives focus back.
4. Compare with the same control in Notion by the numbers below.
5. Choose a value and check that the view shows it at once and that undo
   brings the old value back.

## Notion reference (measured)

Measured in the owner's workspace, dark theme, read-only.

| Part | Measure |
| --- | --- |
| Menu panel | 290 px wide (250 for short lists), radius 10 px, background `#252525`, ring `0 0 0 1px #383836`, shadows `0 14px 28px -6px rgb(25 25 25 / .2)` and `0 2px 4px -1px rgb(25 25 25 / .12)` |
| Menu row | 28 px high, radius 6 px, 4 px inset from the panel edge; icon 20 px; label 14 px; hover `rgb(255 255 255 / .055)`, background change 20 ms |
| Row value | 14 px, muted `#7D7A75`, then a chevron; the row opens a panel |
| Section label | 12 px, weight 500, `#ADA9A3` |
| Panel header | back arrow, title 14 px weight 600, close button |
| Search field | 28 px, padding 3 × 6 px, radius 6 px, fill `rgb(252 252 252 / .03)`, focus ring `0 0 0 1px #2383E2` inside and out, text 14 px |
| Option | `role="option"`, 28 px, the chosen one ends with a 16 px check |
| Option with text | title, then a two-line description in 12 px muted text |
| Switch | track 30 × 18 px, radius full, padding 2 px, on `#2783DE`; knob 14 px white, moves 12 px; 200 ms ease-out |
| Layout tile | 83 × 57 px, radius 6 px, ring `inset 0 0 0 1px #383836`; chosen: ring 2 px `#2783DE`, label blue, 11 px |
| Opening | panels fade and slide in over a short time; submenus open beside their row |
| Search dialog | 1006 × 676 px at 1280 × 760, 68 px from the top, radius 20 px, ring and two shadows; field 16 px; filter chips 24 px pills; rows 36 px, radius 12 px, icon, title, "— path"; the active page previewed on the right |
| Side peek | docked at the window's right, 640 px of 1280; full height; ring `0 0 0 1px #383836` and `0 4px 12px -2px`; bar of 24 px buttons: Close, Open as full page, then the peek mode switch, then Previous and Next (dimmed at the ends), the page's actions at the end; title 32 px bold; text inset 76 px |
| Table Open button | on hover of the title cell: the open mode's icon and OPEN in 12 px capitals on a raised pill; the peeked row is ringed in blue |

## Blocks (measured, light theme, full-width page 1440 px)

Text color `rgb(44 44 43)`; font stack `ui-sans-serif, -apple-system,
BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica,
… Arial, sans-serif`.

| Block | Box | Text |
| --- | --- | --- |
| Page title | 48 px high | 40 px, weight 700, line 48 px |
| Heading 1 | 55 px high | 30 px, weight 600, line 39 px |
| Heading 2 | 47 px high | 24 px, weight 600, line 31.2 px |
| Paragraph | 40 px high (24 px line plus block padding) | 16 px, weight 400, line 24 px, text 6 px in from the column |
| Quote | 40 px, padding 8 px | 16 px, line 24 px, text 25 px in (bar and gap) |
| Callout | padding 8 px | text 21 px in |
| Divider | 13 px high | |
| Image | padding 8 px | |

## Database (measured, dark theme)

### Inline database header

One 40 px row: the database's icon in a 22 px box, the title in 24 px
weight 600 (line 31.2 px), then a 24 × 24 "+" (add a view) right after the
title. A single view shows no tabs. At the row's end the tools, 28 × 28,
radius 6, no gap: Filter, Sort, Automations, AI autofill, Search, then
Settings; 6 px later the blue "New" (49 × 28, corners 6 0 0 6) and its
24 × 28 arrow (more ways to add). Pagecraft has every tool but
Automations and AI autofill, which need a server.

### Rows

- Row 37 px (36 px and a 1 px border); cell text 14 px, line 1.5,
  padding 7.5 px × 8 px; numbers right-aligned.
- The gutter sits in the page margin, cells start under the title:
  "+" (24 px, adds a row below; Alt adds above), the grip (18 px), then
  the tick box in a 36 × 36 label; it fades in over 200 ms.
- The title cell shows the Open pill on hover of any cell of the row
  ("Abrir no modo lado a lado" in side peek mode).

### Cell quick actions (hover on a value cell)

- Every non-title value cell shows, on hover, a bar at its start: inside
  an absolutely placed strip (`top: 6px`, `inset-inline: 0`,
  `margin: 0 4px`, `justify-content: start`, `pointer-events: none`), a
  sticky pill (`inset-inline-end: 4px`), background `--c-bacEle`
  (`rgb(32 32 32)`), padding 2 px, 24 px high, radius 6 px, shadow
  `0 0 0 1px rgb(56 56 54), 0 4px 12px -2px rgb(25 25 25 / .08)`.
  The bar covers the value; it stays left even for right-aligned numbers.
- In it, two 24 × 20 buttons (radius 4 px, 16 px icons in the secondary
  icon color): "Comment on property value" (speech bubble) and "Copy to
  clipboard".
- "Comment" opens the comment composer as a popover centered under the
  cell: 470 px wide, radius 10, the menu panel's ring and shadows;
  padding 9 px 8 px 8 px 12 px; avatar 24 px; the field "Add a
  comment…" 14 px on a 20 px line, focused at once; on its right
  Attach file, Mention, Send (24 × 24 each). Enter posts.
- Once a value has a discussion, its bar's first button becomes "Open
  discussion": the bubble and the count (12 px, weight 600, tertiary
  text), padding 0 6 px; the bar shows while the cell is hovered.
- On the row's page the property row with a discussion carries, just
  past its end in the right margin (absolute, `top: 6px`), a 24 px
  button: the bubble and the count, named "1 comment". It opens the
  discussions popover (480 px, radius 10): each comment shows the
  author, the time, then the value it is about as a quoted line in 13 px
  secondary text (`rgb(173 169 163)`) — the property name, ":", then the
  value as it read when the discussion began — indented 32 px under the
  name, then the comment. Hovering a comment shows Add reaction, Resolve,
  More actions (Mark as unread, Edit, Copy link, Mute replies, Delete).
  Delete asks "Delete this comment?" with Delete and Cancel.
- Value discussions are not listed under the page's own discussions;
  they live by their property.
- Pagecraft (2026-11-13): the bar, its two buttons, the composer and the
  discussions popovers (470 and 480 px), the count by the property on
  the row's page, the value quoted under the first comment, and the
  delete question are built to these numbers
  (`cell-actions.view.ts`, `row-value-comments.view.ts`,
  `features/comments/`). Reactions, Mark as unread, Edit, Copy link and
  Mute replies are not built (one person, no notifications).

## Search (measured, dark theme, 2026-11-13)

- Opened from the sidebar's "Search or ask" field (8 px radius, a 1 px
  border) or Ctrl+K: a 1006 × 700 px dialog, radius 20 px.
- Under the field a row of filter chips, each 24 px, radius 32 px,
  padding 0 8 px, gap 6 px, 14 px secondary text (`rgb(173 169 163)`),
  no fill: "Title only", "Created by", "In page", then "Filter" (dimmer,
  `rgb(125 122 117)`, padding 0 9 0 5 px, radius 12 px).
- Each chip leads with a 16 px icon (Aa, a person, a page) and ends with
  a small chevron down; no border, no shadow.
- A chip with a value turns blue (`rgb(39 131 222)`) on a translucent
  blue fill and reads "In page: Budget, Salary". The filters stay set
  when the search is closed and opened again.
- With a filter set the list reads "Search results", with a sort choice
  "Best matches ⌄" at its right.
- "In page" opens a 250 px popover (min 180, at most 40 % of the window
  high): a field holding the chosen pages as 18 px tokens (icon, name,
  a remove ×) with a blue focus ring, placeholder "Search pages"; under
  it the other pages as 28 px options (a row page shows its path in
  12 px tertiary text, "Budget / Income"). Choosing keeps it open; it
  is a multiple choice.
- "Filter" lists "Date"; choosing it adds a "Date" chip and opens its
  248 px popover: a header with the field it reads ("Last edited", a
  list of "Created" and "Last edited") and "Clear"; 28 px rows Today,
  Last 7 days, Last 30 days; a month calendar to pick a day or a range;
  "Remove" at the foot, which takes the chip away.
- With no query the results group recent pages by when they were opened:
  "Today", "Yesterday", then older; with a query or a filter, "Best
  matches". The foot reads "Ctrl+Enter Open in new tab".
- Pagecraft has one person, so "Created by" has nothing to choose; it is
  left out.
- Pagecraft (2026-11-13): Title only, In page (tokens, search, Backspace)
  and Filter › Date (field, Clear, presets, month, Remove) are built and
  kept while the search is closed (`features/command-palette/search-*`).
  Not built: grouping recents by Today and Yesterday (visit times are not
  kept) and the "Best matches" sort choice.

## Page menu (measured, dark theme, 2026-11-13)

- The "…" at the top bar's end ("Actions") opens a 256 px menu with a
  search field ("Search actions…") and 28 px options, in groups: Copy
  link (Ctrl+Alt+L on the web), Copy page contents, Duplicate (Ctrl+D),
  Move to (Ctrl+Shift+P); Version history, Updates and analytics;
  Appearance and layout ›, Use with AI ›, Suggest edits, Get notified ›
  (its value, "Comments"); Lock page (a switch), Move to trash; More ›.
  The foot: "Last edited", the person, "yesterday at 19:08", then the
  word count.
- Appearance and layout opens a 300 px submenu beside it: "Font style"
  with three 92 × 61 tiles (Ag, Default, Serif, Mono), then the section
  "Appearance" with switches Small text, Full width, Table of contents,
  Page discussions, and "Inline comments ›".
- More › holds Translate, Import, Export, Turn into wiki, Connections
  (None), Open in the Windows app.
- Backlinks are no longer a row of this menu.
- Pagecraft (2026-11-13): the groups above in that order, without the
  rows that need a server, AI or other people; Appearance and layout
  holds the font tiles, Small text, Full width and Backlinks; More holds
  Export › (Markdown, HTML, print). Copy link keeps Ctrl+L, and Duplicate
  and Move to show no keys, since only working keys are shown. The
  submenus never opened before: the menu was drawn without its context.

## Trash (measured, dark theme, 2026-11-13)

- Reached from the sidebar foot's "Library, Trash, more…" menu (240 px:
  Library, AI notes, Skills, My tasks, Marketplace, Trash).
- A floating panel 414 × 453 px over the sidebar's edge near its foot,
  radius 10, the menu panel's color, ring and shadows; its height stays
  the same with no results.
- A search field ("Search pages in Trash", 20 px text line), then 24 px
  chips: Last edited by, In, Teamspaces; "No results" in the middle;
  at the foot "After a page has been in Trash for 30 days, it will be
  deleted automatically" and a Help button.
- Pagecraft (2026-11-13): a panel beside the sidebar's foot, 416 × 453,
  the search, the "In" choice, the rows with Restore and Delete, "No
  results" centered and the note at the foot. "Last edited by" and
  "Teamspaces" need other people.

## Version history (measured, dark theme, 2026-11-13)

- Page menu › Version history fills the window: the versions down the
  left in a 320 px column (`#191919`, a 1 px `#2c2c2b` border on its
  right), "Group by" a span of time, each version with its time and
  author; "Current version"; "Start restore".
- The chosen version shows beside it as the page, read only; the words
  that version wrote are in `rgb(35 131 226)` on
  `rgb(35 131 226 / .14)`.
- Pagecraft (2026-11-13): the versions in a 320 px column on the left
  with Restore, the version beside them with the words it wrote (and the
  blocks it added) marked in Notion's colors against the version before.
  "Group by" and authors are not built (one person).

## Feature catalog (audit of 2026-11-13)

Every entry Notion offers, in its words, and whether Pagecraft has it:
**yes**, **part** (what is missing said), **no**, or **n/a** (needs a
server, AI or other people). Photos of Notion are kept in
`.captures/notion/` (the pane's frames, 800 px wide).

### Slash menu (`/` on an empty line), 15 sections

Photo `001-slash-menu.jpg`. A 309 px panel, 320 px of list before it
scrolls, "Close menu  esc" at its foot; typing filters it.

| Section | Entries | Pagecraft |
| --- | --- | --- |
| Suggestions | AI notes; HTML (new) | n/a; **no** (HTML block) |
| Basic blocks | Text; Heading 1–4 (`#`…`####`); Bulleted list (`-`); Numbered list (`1.`); To-do list (`[]`); Toggle list (`>`); Page; Callout; Quote (`"`); Table; Divider (`---`); Link to page | **yes** |
| Media | Image; Video; Audio; Code (```` ``` ````); File; Web bookmark | **yes** |
| Database | Table view; Board view; Gallery view; List view; Feed view; Dashboard view (new); Calendar view; Timeline view; Map view (new); Vertical bar chart; Horizontal bar chart; Line chart; Donut chart; Number chart; Form; Database – inline; Database – full page; Linked view of data source | **part**: only "inline database" and "linked view" are listed; no entry per view, no number chart, no dashboard, no map, no full-page database entry |
| Advanced blocks | Table of contents; Block equation; Button; Breadcrumb; Tabs (new); Synced block; Toggle heading 1–3 (`# >`…); 2, 3, 4, 5 columns; Code – Mermaid; AI block | **part**: no Tabs, no Mermaid, columns as one entry; AI n/a |
| Inline | Mention a person; Mention a page or data source; Date or reminder; Emoji; Inline equation | **yes** (a person: n/a) |
| Integrations | Embed; HTML; Google Drive, Tweet, GitHub Gist, Google Maps, Figma, … (about 50 named services) | **part**: one Embed for any address; no named services |
| Import | CSV; Text and Markdown; Confluence; Google Docs; Dropbox Paper; Evernote; Workflowy; Word; Monday; Quip; ZIP | **part**: CSV, Markdown, ZIP from the sidebar, not from `/` |
| Turn into | Heading 1–4; Page in; Bulleted, numbered, to-do, toggle lists; Code; Quote; Toggle heading 1–4 | **no** in `/` (the block menu has Turn into) |
| Actions | Link to block (Alt+Shift+L); Duplicate (Ctrl+D); Move to (Ctrl+Shift+P); Delete (Del); Ask AI | **no** in `/` (the block menu has them); no "Link to block" |
| A short break | Brew | n/a |
| Text color | Default and 9 colors | **yes** |
| Background color | Default and 9 colors | **yes** |

## Properties (audit of 2026-11-13, photos in `.captures/notion/a1…a5`)

### Adding a property

- "+ Adicionar propriedade" ends the header row; once a column exists it
  becomes a bare "+" followed by "…". Clicking it turns the header cell
  into a field "Digite o nome da propriedade…" (emoji button at its left)
  over a 415 × 450 menu, background #252525, that scrolls (707 px tall).
- Menu sections: "Preenchedor Automático da IA" (Resumir, Traduzir, each
  with a "Básico" badge and a chevron); "Selecionar tipo" with a search
  icon; then the types in two columns, groups split by rules:
  - Texto, Número, Selecionar, Seleção múltipla, Status, Data, Pessoa,
    Arquivos e mídia, Caixa de seleção, URL, Telefone, E-mail;
  - Relação, Rollup, Fórmula, Botão, ID, Local;
  - Criado em, Última edição, Criado por, Última edição por;
  - "Habilidades": Description, Files;
  - integrations (blue upload badge): Google Drive Arquivo, Figma
    Arquivo, Pull Requests do GitHub, Zendesk Ticket.
- A row pointed at gets the hover wash and a "?" at its right.
- Choosing a type adds the column at once, named as the type; no
  settings open (Relação is the exception, below).

### Column menu (click a header)

- Top: the type's icon in a 32 px box, then the name in a field with an
  "i" at its end.
- Rows, as Notion shows them for a text column: Acesso à propriedade;
  Alterar tipo ›; Preenchimento automático com IA ("Agora com agentes"
  badge) ›; rule; Filtrar; Ordenar ›; Agrupar; Calcular ›; Congelar;
  Ocultar; Desfazer encapsulamento de conteúdo; rule; Inserir à
  esquerda; Inserir à direita; Duplicar propriedade; Excluir propriedade.
- Per type: "Editar propriedade ›" heads the rows for Número,
  Selecionar, Seleção múltipla, Status, Data, Pessoa, Rollup, Fórmula,
  ID, Criado em, Última edição ("Editar automação" for Botão). Status
  adds "Exibir como › Selecionar"; URL adds "Mostrar URL completo";
  Arquivos e mídia has no AI and no Agrupar; Caixa de seleção has no
  wrap row; Rollup and Fórmula have no AI and no Agrupar; Botão keeps
  only Acesso, Alterar tipo, Congelar, Ocultar, insert, duplicate,
  delete; ID has no Acesso, Alterar tipo or Duplicar; the automatic
  types (Criado/Última edição …) have no Acesso; Criado por and Última
  edição por have no Editar propriedade. Congelar is dimmed on a column
  that cannot freeze.
- "Editar propriedade ›" opens a submenu beside the menu (to its left
  when there is no room), held open while pointed at:
  - Número: Formato de número › Número; Casas decimais › Padrão;
    "Mostrar como" tiles 42 Número / Barra / Anel (chosen tile outlined
    blue); note "As alterações se aplicam a todas as visualizações que
    mostram essa propriedade."
  - Selecionar, Seleção múltipla: Ordenar › Manual; "Opções" with
    "Adicionar uma opção" and "Gerar com a IA".
  - Status: groups A fazer, Em andamento, Concluídos, each with a "+";
    options as chips with a grip and a chevron (Não iniciada marked
    PADRÃO; Em andamento blue; Concluído green).
  - Data, Criado em, Última edição: Formato de data › Data completa;
    Formato de hora › 12 horas; Data adds Notificações › Nenhum.
  - Pessoa: Limite › Sem limite; Padrão › Nenhum padrão; Notificações ›
    Apenas pessoas.
  - Rollup: Relação › Selecionar; Propriedade de destino › Selecionar;
    Calcular.
  - Fórmula: Editar fórmula.
  - ID: Prefixo, "TSK-1, TSK-2, TSK-3, …", Adicionar prefixo de ID.
  - Botão: "Editar automação" opens a centered dialog "Botão": Quando ·
    "O botão é clicado"; Fazer · "+ Nova ação"; a blue Salvar.

### Inside "Editar propriedade" (third level, photos `a6-submenus`)

Each row with a value opens a list beside it; the chosen value carries a
check.

- Número › Formato de número: a list headed by a focused "Filtrar
  formatos…" field: Número, Número com separadores, Percentual, then 38
  currencies (Dólar dos EUA (USD) … Real (BRL) … Peso uruguaio …).
  Casas decimais: Padrão, 0, 1, 2, 3, 4, 5.
- Selecionar › Ordenar: Manual, Alfabética, Alfabética reversa.
  "Adicionar uma opção" turns into a field to type the new option.
- Status: an option's chevron opens its menu: its name in a focused
  field with "i"; Excluir; Definir como padrão; Agrupar › A fazer (the
  group it sits in); "Cores": Padrão, Cinza, Marrom, Laranja, Amarelo,
  Verde, Azul, Roxo, Rosa, Vermelho (swatch squares). "Exibir como ›"
  in the column menu: Caixa de seleção, Selecionar.
- Data › Formato de data: Data completa, Data curta, Mês/Dia/Ano,
  Dia/Mês/Ano, Ano/Mês/Dia, Relativo. Formato de hora: Oculto, 12 horas,
  24 horas. Notificações: Nenhum, No dia do evento (09:00), 1 dia antes
  de (09:00), 2 dias antes de (09:00), 1 semana antes de (09:00).
- Pessoa › Limite: 1 Pessoa, Sem limite. Padrão: Nenhum padrão, Criada
  por. Notificações: Pessoas e grupos, Apenas pessoas, Nenhuma.
- Rollup › Relação: the relation properties; Propriedade de destino
  (empty until a relation is chosen); Calcular: Nenhum, Contagem ›,
  Percentual ›.
- Fórmula › Editar fórmula: a wide panel "Editar fórmula (?)" with a
  close ×: an AI field "Escreva, corrija ou explique uma fórmula…" with a
  send arrow; "Sua fórmula" editor outlined blue; "Pré-visualizar com
  Selecione uma página ⌄"; "Modo de depuração" switch; "Válido" in green
  and a "Tipo:desconhecido" chip; below, a list (Propriedades, each
  with its icon; Incorporações not/true/false; Geral if() ifs() and()
  or() not() empty() length() format() equal() unequal() let() lets();
  Texto substring() contains() test() match() replace() replaceAll()
  lower() upper() trim() repeat() padStart() padEnd() link() style()
  unstyle() concat() join() split(); Número formatNumber() add()
  subtract() multiply() mod() pow() divide() min() max() sum() median()
  mean() abs() …) beside a help pane for the item pointed at: its name,
  a line of description, examples in code each with a copy button.
- ID › Prefixo: "TSK-1, TSK-2, TSK-3, …", "Adicionar prefixo de ID".

### Column menu submenus

- Alterar tipo: the 22 types with icons (Texto … ID), no groups.
- Preenchimento automático com IA: Básico (dimmed: "Indisponível para
  este tipo de propriedade"), Agente personalizado (Novo) with its
  description.
- Ordenar (number): Ordenar baixo → alto, Ordenar alto → baixo.
- Acesso à propriedade: a centered dialog "Acesso à propriedade · Para
  # Número ⌄", an upgrade card (Business plan), "Acesso padrão" with
  "Herdar da base de dados ⌄", Exceções, Saiba mais, Apagar, Salvar. n/a
  for one person.
- Calcular: Nenhum, Contagem ›, Percentual › for every type; Número adds
  "Mais opções ›"; Data adds "Data ›".

### Words in English (the account switched language during the audit)

Types: Text, Number, Select, Multi-select, Status, Date, Person, Files &
media, Checkbox, URL, Phone, Email, Relation, Rollup, Formula, Button, ID,
Place, Created time, Last edited time, Created by, Last edited by;
"Skills": Description, Files; "AI Autofill": Summarize, Translate (Basic).
Column menu: Edit property, Property access, Change type, AI Autofill,
Filter, Sort, Group, Calculate, Freeze, Hide, Unwrap content, Insert
left, Insert right, Duplicate property, Delete property.

### Calculations (fourth level, photos `a7-deeper`)

- Count ›: "Exibir contagens grandes como 99+" (note: "Isso melhora o
  desempenho para bases de dados grandes."), Contar tudo, Contar
  valores, Contar valores únicos, Contagem de vazias, Contagem de não
  vazias. A checkbox counts: Contar tudo, Marcadas, Desmarcadas.
- Percent ›: % de vazias, % de não vazias (a checkbox: marked and
  unmarked).
- More options › (number): Soma, Média, Mediana, Mín., Máx., Intervalo.
- Date › (date): Data mais antiga, Data mais recente, Intervalo de datas.

### What the plain rows do

- Filter: adds a filter on the column; a filter bar appears under the
  view header (a rule above it), with a chip "Texto ⌄" and "+ Filtrar",
  and the chip's popover opens: "Texto contém ⌄", "…" (Mais ações:
  Excluir filtro, Adicionar ao filtro avançado), a focused field
  "Digite um valor…". Text conditions: É, Não é, Contém, Não contém,
  Começa com, Termina com, Está vazio, Não está vazio. The toolbar's
  filter button shows and hides the bar (tinted while it shows).
- Group: groups the view by the column; an empty grouped table shows
  only "Editar grupos" and "+ Adicionar página" buttons. The group
  panel: Agrupar por › Texto; Texto por › Exato; Ordenar › Alfabética;
  Ocultar grupos vazios; Grupos › Mostrar tudo; "Sem Texto"; Remover
  agrupamento; "Saiba mais sobre agrupamentos".
- Freeze: a stronger divider right of the column, running up through
  the header; the columns up to it stay while the rest scrolls.
- Insert left/right: opens the add-property menu ("Select type").
- Delete property: a dialog "Delete this property from New database? It
  will be removed from all views." with Delete (red) and Cancel.

### Cell editors (click a cell of a row, photos `a10-cell-editors`)

Each editor opens over the cell, starting at the cell's top left, at
least the cell's width; background #252525, radius 10, the outer shadow.

- Text, URL, Phone, Email, Number: the cell itself turns into an editing
  box a little wider than the cell (here 405 px), no menu.
- Select, Multi-select: a field "Search for an option…" at the top, then
  "Select an option or create one" and the options as chips; typing a
  new name offers to create it.
- Status: the current value as a chip at the top, then the groups
  To-do, In progress, Complete with their options as chips (colored
  dots), a rule, then "Edit property".
- Date: a field with the date selected ("Nov 13, 2026"); "Nov 2026",
  Today, ‹ ›; Su Mo Tu We Th Fr Sa; six weeks, days outside the month
  dimmed, today filled blue; End date switch; Date format › Full date;
  Include time switch; Remind › None; Clear; "Learn about reminders".
- Person: "Select as many as you like", then the people ("Jonathan
  (You)").
- Files & media: "+ Add a file or image" over a panel with tabs Upload |
  Link, a blue "Upload file" with a folder button, "or Ctrl+V to paste an
  image".
- Checkbox: the click ticks it; no editor.
- Place: "Current Location" (n/a in a browser without location).
- Created/Last edited time and by, ID, Button: nothing opens (read only;
  the button cell runs its action).
- Formula: the "Edit formula" panel, with "Preview with" set to the row.
- Rollup without settings: Relation "Select an existing relation…",
  Property "Select a property…", Calculate "Show original".
- Relation: a field "Link or create a page…" with "In ▣ New database"
  at its right; "Select a page" with "…"; the pages, each with a "+".

### Relação

- Choosing it opens "Relacionado a": "Fontes de dados existentes", each
  database with its page under it.
- Then a panel "Nova relação" docked at the view's right, with a close
  ×: the name field (focused, "Base de dados sem título relacionado"),
  Relacionado a › Esta base de dados, Limite › Sem limite (a dropdown:
  1 página, Sem limite ✓), "Adicionar propriedade relacionada" switch
  (on, a field "Nome da propriedade relacionada" appears), a blue
  "Adicionar relação", "Saiba mais sobre relações".
- Once added the panel becomes "Editar propriedade" with a back arrow:
  name with icon box and "i"; Tipo › Relação; Acesso à propriedade;
  Relacionado a (dimmed); Limite ›; Adicionar propriedade relacionada
  (Ativado); Encapsular conteúdo switch; Excluir propriedade; help. A
  relation to its own database adds two columns ("… relacionado",
  "Relacionado inversamente …").

## Views (audit of 2026-11-13, photos in `.captures/notion/b1…`)

### Add a view ("+" right of the database title)

A 270 px wide grid "Adicionar uma nova visualização": tiles of icon over
label, four per row: Tabela, Quadro, Galeria, Lista / Gráfico, Painel,
Cronograma, Feed / Mapa, Calendário, Formulário; a rule; "Nova fonte de
dados". Pointing a tile washes it. The title also gains "…" on hover.

### View settings (the sliders button in the view toolbar)

A panel docked at the view's right (about 290 px, radius 12, full
height of its rows, close ×), "Ver configurações":

- the view's icon in a box and a "Nome da visualização" field with "i";
- Layout › Tabela; Visibilidade da propriedade › 24; Filtrar ›;
  Ordenar ›; Agrupar ›; Cor condicional ›; Copiar link para a
  visualização;
- "Configurações da fonte de dados": Fonte · Nova base de dados
  (dimmed); Editar propriedades ›; Automações ›; Preenchedor Automático
  da IA ›; Transformar em ›; Eventos vinculados ›; Mais configurações ›;
- a rule; Gerenciar fontes de dados ›; Bloquear base de dados;
  Gerenciar no Notion Calendar ↗.

Each row replaces the panel with its own page, a back arrow and close ×
in its header:

- Layout: tiles three per row (chosen tile outlined blue, label blue):
  Tabela, Quadro, Cronograma / Calendário, Lista, Galeria / Gráfico,
  Feed, Mapa; then switches Mostrar título da fonte de dados (on),
  Mostrar linhas verticais (on), Exibir ícone da página (on), Envolver
  todo o conteúdo (off); Abrir páginas em › Modo lado a lado; Carregar
  › 50.
- Visibilidade da propriedade: a focused "Procurar uma propriedade…"
  field; "Mostradas na tabela" with a blue "Ocultar tudo"; each
  property a row with a grip, its type icon, name and an eye.
- Filtrar: "Novo filtro" list of the properties A–Z with icons, then
  "Adicionar filtro avançado". Ordenar: "Nova ordenação", the same list.
- Agrupar: "Agrupar por", Nenhum, then the groupable properties.
- Cor condicional: a note ("Personalize as cores da página para
  distinguir facilmente as categorias, destacar eventos atrasados…")
  and "Nova configuração de cor".
- Editar propriedades: "Propriedades" listing all with icons, "Nova
  propriedade", "Saiba mais sobre propriedades".
- Automações: an upgrade card (paid plan). n/a.
- Preenchedor Automático da IA: AI. n/a.
- Transformar em ›: Transformar em base de dados de Tarefas, de
  Reuniões, de habilidades.
- Eventos vinculados: "Conecte seu calendário". n/a.
- Mais configurações ›: Subitens, Dependências, Conexões, Personalizar
  layout de página.
- Gerenciar fontes de dados: Fonte · Nova base de dados · 1
  visualização; Adicionar fonte de dados; Vinculado; Vincular fonte de
  dados existente; "Saiba mais sobre fontes de dados".

### Each view type (created from "+", photos `b3-view-types`)

Creating a view adds a tab (icon and name; the active tab a filled pill,
radius 16) and opens a panel "Nova visualização" docked at the right: the
type's icon in a box and a focused "Nome da visualização" field, the
layout tiles three per row (Tabela, Quadro, Cronograma / Calendário,
Lista, Galeria / Gráfico, Feed, Mapa / Painel), the type's options, then
Fonte › Nova base de dados and a blue "Concluído". Tabs that do not fit
fold into "Mais N", whose list holds the views, "Nova visualização" and
"Nova fonte de dados"; with tabs the "+" shows only while pointed at.

- Quadro (board): grouped by Status at once (columns tinted per option,
  count beside the chip, "+ Nova página" in each column). Options:
  Mostrar títulos das fontes de dados, Exibir ícone da página,
  Encapsular todo o conteúdo (on), Agrupar por › Status, Colorir colunas
  (on), Abrir páginas em › Modo lado a lado, Carregar › 25, Visualização
  do cartão › Nenhum, Tamanho do cartão › Médio, "Layout do cartão" with
  two pictured tiles Compacto | Lista (Lista chosen).
- Galeria: cards with a cover area (empty grey) over the title, a dashed
  "+ Nova página" card. Options: the three switches, Abrir páginas em ›
  Modo centralizado, Carregar › 50, Visualização do cartão › Conteúdo,
  Tamanho do cartão › Médio, Ajustar mídia (off), Layout do cartão
  Compacto | Lista.
- Lista: rows of icon and title, a property (the creator's avatar "J")
  at the right end, "+ Nova página". Options: the switches, "Directly
  edit page name", Abrir páginas em › Modo lado a lado, Carregar › 50.
- Gráfico: a vertical bar chart (axis 0–4, one bar "Sem Selecionar" with
  its value over it), dotted grid lines. Options: Mostrar títulos das
  fontes de dados, Carregar › 50, Fonte, a blue "Editar gráfico", "Saiba
  mais sobre gráficos".
- Painel: an upgrade page "Visualize seu trabalho com painéis de
  controle" (Business plan). n/a.
- Cronograma: "novembro de 2026" with a "»" to open the table, "Gerenciar
  no Notion Calendar", Mês ⌄, ‹ Hoje ›; day numbers across, today a red
  dot and a red vertical line, weekends shaded, "+ Novo"; "Sem data (1)"
  in the toolbar. Options: Mostrar cronograma por › Data, Separar datas
  de início e fim (off), Mostrar tabela (off), Abrir páginas em ›,
  Carregar › 50.
- Feed: each page a card: avatar, author, "8min (editado)", the title in
  large type, a reaction button, "Adicionar um comentário…" with the
  avatar; a wide "+ Nova página". Options: Quebrar linhas nas
  propriedades (off), Mostrar assinatura do autor (on), Abrir páginas em
  › Modo centralizado, Carregar › 10.
- Mapa: "Sem local (1)"; options Mapear por › Local, Abrir páginas em,
  Carregar. n/a without maps.
- Calendário: "novembro de 2026", "Gerenciar no Notion Calendar", ‹ Hoje
  ›; weekday names (dom. seg. …), month grid with day numbers top right,
  "1 de nov." on the first, today in a red circle. Options: Ajustar
  títulos das páginas (off), Mostrar calendário por › Data, Mostrar
  calendário como › Mês, Exibir fins de semana (on), Abrir páginas em ›
  Modo centralizado.
- Formulário: the view becomes "Criador de formulário ⌄" with Prévia and
  a blue "Compartilhar formulário"; a dialog first asks "Criar
  automaticamente perguntas de formulário com base nas propriedades
  existentes?" ("Somente tipos de propriedades compatíveis criarão novas
  perguntas."), a blue "Criar 14 perguntas" and "Começar do zero"; below,
  the form: icon, cover, a note that only the workspace may answer
  (Alterar), the "Nome" question with "Resposta do participante" and a
  "+" to add one.

Notion also showed a second sidebar design mid-audit (workspace name at
the top, icons for home, chat, meetings, inbox and search, "Adicionar
agentes", Biblioteca, Ajuda, Lixeira, "Novo chat Ctrl+O"): an experiment
on the account, not a change to follow.

### View options' submenus (photos `b4-view-options`, `b5-layout-options`)

- Visualização do cartão: Nenhum, Capa, Propriedades da página, Conteúdo
  ("Usa o primeiro bloco na página").
- Tamanho do cartão: Pequeno, Médio, Grande.
- Abrir páginas em: Modo lado a lado ("Abra as páginas na lateral.
  Mantém a visualização de trás interativa.", marked "Padrão para
  Quadro"), Modo centralizado ("Abra as páginas em uma janela
  centralizada em destaque."), Página inteira ("Abra as páginas no modo
  tela inteira.").
- Carregar: 10, 25, 50, 100.
- Agrupar (a board's group panel): Agrupar por › Status; Status por ›
  Opção; Ordenar › Crescente; Ocultar grupos vazios; Colorir colunas;
  "Grupos" with Ocultar tudo, then each group with an eye; "Saiba mais
  sobre agrupamentos".
- Calendar: Mostrar calendário como: Mês, Semana; Mostrar calendário
  por: Criado em, Data, Última edição (the date properties). Timeline:
  Mostrar cronograma por: the same.
- Chart settings ("Editar gráfico" opens them in Ver configurações):
  Layout › Gráfico; "Tipo de gráfico": five icon tiles (vertical bars,
  horizontal bars, line, donut, number); "Eixo X": O que exibir ›
  Selecionar, Ordenar por › Manual, Omitir valores zerados; "Eixo Y": O
  que exibir › Contagem, Agrupar por › Nenhum, Intervalo › Auto, Linha de
  referência › 1 linha; "Estilo": Cor › Auto, Mais opções de estilo;
  Fonte, Filtrar; Salvar gráfico como…, Copiar link para a visualização,
  Gerenciar fontes de dados, Bloquear base de dados. On a free plan a
  second chart shows "Seu espaço de trabalho já usou seu gráfico
  grátis." and "Fazer upgrade agora".
- Choosing another layout tile changes the view itself (its tab takes
  the layout's name when unnamed).

### View tab menu (click the active tab)

Renomear; Exibir como › (Texto e ícone, Apenas texto, Apenas ícone,
"Válido apenas para você"); Editar visualização; Fonte › Nova base de
dados (the name in grey after the label); Copiar link para esta
visualização; Adicionar visualização à barra lateral; Abrir como página
inteira (↗); Ocultar títulos das fontes de dados (an eye, no switch);
Duplicar visualização; Excluir visualização; Gerenciar no Notion Calendar.
An earlier photo showed "Adicionar visualização à barra lateral" dimmed;
on 2026-11-13 (`n40-tab-source/04-source`) it was enabled.

"Adicionar visualização à barra lateral" (`n40-sidebar/04-add-sidebar`)
adds a sidebar section after Particular: the database's name as a grey
heading, a ⌄ after it, and while pointed at ↗ (open), + (new page) and
"…"; under it the view's pages, 5 by default. The "…" menu
(`n40-section-fix/02-more`): Renomear ›; Abrir em › Modo lado a lado
(Modo centralizado, Página inteira); Exibir › 5 (5, 10, 15, 20); Exibir
ícone da página (switch, on); Fonte › the database; Visualizar › the
database's views (Tabela); Modelo › Vazio; a rule; Mover para cima; Mover
para a guia ›; Remover seção; a rule; Personalizar barra lateral. The
menu item keeps its label after adding. Pagecraft builds all but Mover
para a guia (the sidebar's tabs are Notion's AI chat and Calendar).

"Personalizar barra lateral" (`n42-customize2`), at the sidebar's foot,
turns the sidebar into an edit mode: each shortcut (Nova página, Novo
chat, Biblioteca, Conexões, Agentes externos) and, under a rule, each
section (Próximos eventos, Recentes, Favoritos, Compartilhado,
Particular) is a row with a ⠿ grip, its icon and name, and while pointed
at a sliders button (shortcut: Mover para cima, Mover para baixo, Mover
para a guia; section: Exibir › 10, the same moves) and × "Remover da
barra lateral". "+ Adicionar atalho" opens "Buscar atalhos…" over Criar
(Nova página ›, Nova anotação de reunião, Nova base de dados) and Ir para
(Página ›, Thread de chat ›, Configurações, Anotações de reunião,
Habilidades, Notion Calendar); "+ Adicionar seção" opens "Pesquisar
seções…" over Páginas (Visualização da base de dados ›), Chats, Reuniões,
Apps and Avançado. A full-width blue "Concluído" ends the mode; a reload
ends it too. Pagecraft (`p27-customize`, `p27-customize-add`) builds the
mode for its own items — New page, New database, Settings and pinned
pages; Favorites (with Show), Private and kept views — and leaves out
the AI, calendar, meeting, sharing and integration rows (spec.md
Assumptions).

## Filters, sorts and groups by type (audit of 2026-11-13, photos `c1…c5`)

### Filter conditions

The filter popover's head reads "<Property> <condition> ⌄" with "…" (Mais
ações: Excluir filtro, Adicionar ao filtro avançado); below it the value:
a field, a list of options, or a calendar. A chip with a value is tinted
blue ("Data: Este(a) semana ⌄").

| Type | Conditions | Value |
| --- | --- | --- |
| Text, URL, Phone, Email | É, Não é, Contém, Não contém, Começa com, Termina com, Está vazio, Não está vazio | "Digite um valor…" |
| Number, ID | =, ≠, >, <, ≥, ≤, Está vazio, Não está vazio | a number field |
| Select | É, Não é, Está vazio, Não está vazio | "Selecione uma ou mais opções…" over the options ("Nenhum resultado" when none) |
| Multi-select, Person, Relation | Contém, Não contém, Está vazio, Não está vazio | the options, people or pages |
| Status | É, Não é | the options by group |
| Checkbox | É, Não é | marked / unmarked |
| Files & media | Está vazio, Não está vazio | none |
| Date, Created time, Last edited time | É, Está antes de, Está depois de, Está em ou antes de, Está em ou depois de, Está entre, É relativo a hoje, Está vazio, Não está vazio | see below |
| Rollup | Qualquer, Nenhuma, A cada, then the target's conditions | per target |

- A date filter starts as "Data de início ⌄ é relativo a hoje ⌄": two
  selects "Este(a) ⌄" (Últimos(as), Próximo(as), Este(a)) and "semana ⌄"
  (dia, semana, mês, ano), the month with the matched days washed blue
  (today in red), and "O filtro será atualizado com a data atual". A
  range date has "Data de início | Data de término" to choose which end.
- Advanced filter (view settings › Filtrar › Adicionar filtro avançado):
  a "1 regra" chip; its panel: "Onde · Nome ⌄ · Contém ⌄ · Valor · …";
  "+ Adicionar regra de filtro ⌄" (Adicionar regra de filtro, Adicionar
  grupo de filtros "Um grupo para aninhar mais filtros"); Excluir
  filtro. The settings' Filtrar page then lists "Filtros · 1 regra" and
  "Novo filtro".

### Sort directions (column menu › Ordenar)

Text, Person: Ordenar A → Z, Ordenar Z → A. Select, Status, Number:
Classificar em ordem crescente, Ordenar em ordem decrescente (number:
baixo → alto, alto → baixo). Date: Ordenar antigo → novo, novo → antigo.
Checkbox: não selecionado → selecionado, selecionado → não selecionado.

### Group options (view settings › Agrupar › a property)

- Date: "Data por" Relativo, Dia, Semana, Mês, Ano; Ordenar › Mais
  antigo primeiro.
- Number: "Número por" Únicos, Intervalo; Ordenar › Crescente.
- Text: "Texto por" Exato, Alfabética; Ordenar › Alfabética.
- Status: "Status por" Grupo, Opção; Ordenar › Crescente; groups listed
  with eyes.
- Checkbox: no "por"; the two groups.
- Every one: Ocultar grupos vazios, "Grupos" with Ocultar tudo and an eye
  per group (and "Sem <Property>"), Remover agrupamento, "Saiba mais
  sobre agrupamentos".

## Blocks and the editor (audit of 2026-11-13, photos `d2…d5`)

### Slash menu, as drawn now

Typing "/" on an empty line washes the line and shows "/Type to search"
in it; the menu opens under it, about 325 px wide and 320 px of list,
sections headed in small grey type ("Suggested": Transcribe, "HTML ·
Embeds" with a blue "New" badge; "Basic blocks"; "Media"; "Database";
… "Inline"; "Embeds": Embed, HTML New), rows 33 px with an icon, the
name and the markdown shortcut right-aligned in grey (#, ##, ###, ####,
-, 1., [], >, ", ---, ```), the first row washed; "Close menu esc" fixed
at the foot. The list loads more as it scrolls (about 5300 px in all).

### Blocks (measured)

Text 16 px / 400 / 24; Heading 2 24 px / 600 / 31.2 (block 67 px with
its margins); Heading 3 20 px / 600 / 26; Heading 4 18 px / 600 / 23.4.
Bulleted, numbered, to-do and toggle rows 30–35 px, their marker in a
24 px column. Quote: a 3 px bar left of 16 px text. Divider: a 1 px
rule. Callout: a rounded box (#2a2a2a), 💡 left of the text. Markdown
shortcuts at line start turn the line (#, ##, ###, ####, -, 1., [], >,
", ---). Enter after a toggle's title writes inside the toggle. A page
with headings shows its outline as short dashes at the right edge, one
per heading (a floating table of contents).

### Block menu (the ⋮⋮ handle, "Arraste para mover, clique para abrir o menu")

A search field "Pesquisar ações…" (focused), the block's type as a
heading ("Lista com marcadores"), Transformar em ›, Cor ›, Formato da
lista ›; rule; Link para o bloco Alt+⇧+L, Duplicar Ctrl+D, Mover para
Ctrl+⇧+P, Excluir Del; rule; Comentário Ctrl+⇧+M, Sugerir edições
Ctrl+⇧+Alt+X; rule; Peça à IA Ctrl+J, Habilidades ›; at the foot "Última
edição", the author with avatar, "hoje às 02:56", "2 palavras, 13
caracteres". The hovered block is washed blue while its menu is open.

- Transformar em: Texto, Título 1–4, Página, Lista com marcadores, Lista
  numerada, Lista de tarefas, Lista de alternantes, Código, Citação,
  Frase de destaque, Equação em bloco, Bloco sincronizado, Título
  alternante 1–4, 2/3/4/5 colunas.
- Cor: "Usada por último" (Fundo amarelo Ctrl+⇧+H); "Cor do texto": an
  "A" swatch for Texto padrão, cinza, marrom, laranja, amarelo, verde,
  azul, roxo, rosa, vermelho; "Cor de fundo": Fundo padrão … vermelho.

### Text selection toolbar (new design)

Not a horizontal strip any more: a panel under the selection.
- "Lista com marc… ›" (turn into);
- two rows of 32 px icon buttons: A (color), B, I, U, Tx (clear
  formatting) / link, strikethrough, </> code, √x equation, "…";
- "Comentário", an add-reaction button, a suggest-edit button;
- "Habilidades" (with a settings button): Melhorar escrita, Revisão,
  Explicar, Reformatar …;
- a field "Edite com a IA Alt+⇧+E".

The top bar meanwhile offered "Traduzir para Português ×" (the page's
words were English) and "Offline" when the connection dropped.

## Page, sharing and sidebar (audit of 2026-11-13, photos `e1-page`, `e2-sidebar`)

- Top bar: the page's breadcrumb ("Teste blocos"), a lock and "Particular
  ⌄" (opens "Sugerido": recent pages, and the workspace, to move the
  page), then at the right "Editada há …" (or a translate chip
  "Traduzir para Português ×" when the page's language differs, or
  "Offline"), "🔒 Compartilhar", Copiar link (chain icon), Marcar como
  Favorito (star), "…".
- "…" page menu, as drawn now: a focused "Pesquisar ações…"; Copiar link
  Ctrl+Alt+L; Copiar conteúdo da página; Duplicar Ctrl+D; Mover para
  Ctrl+⇧+P; Histórico de versão; Atualizações e métricas; rule; Aparência
  e layout ›; rule; Usar com a IA ›; rule; Sugerir edições; Receber
  notificações › Comentários; rule; Bloquear página (switch); Mover para a
  lixeira; rule; Mais ›; foot "Última edição", author, "hoje às 02:56",
  "23 palavras".
- Compartilhar: a panel with tabs Compartilhar | Publicar; an invite
  field; the owner "(Você)" with "Acesso completo"; "Acesso geral ·
  Somente pessoas convidadas"; Avançado; Copiar link; "Saiba mais sobre
  compartilhamento". n/a for one person, except Copiar link.
- Title hover: "Adicionar ícone", "Adicionar capa", "Adicionar
  comentário" in a row above the title (y 138 at 1440 px).
- Sidebar page row hover: a chevron "Abrir" over the icon, then at the
  row's right "…" ("Exclua, duplique e mais...") and "+" ("Adicione uma
  página").
- Workspace switcher (the workspace name): the name, "Plano Free - 1
  membro", Fazer upgrade, Configurações, Convidar membros; Adicionar
  conta; the account's workspaces; Novo espaço de trabalho; Sair.
- The sidebar came in two designs between loads (a test on the account):
  A, search field "Busque ou peça Ctrl+K", Página inicial with chat and
  calendar icons, Nova página, Novo chat, Biblioteca, Conexões, Agentes
  externos, sections Compartilhado and Particular, Personalizar barra
  lateral, a promo card, the workspace and help at the foot; B, the
  workspace name at the top, a row of icons (home, chat, meetings,
  inbox, search), Particular, then Adicionar agentes, Anotações IA,
  Biblioteca, Ajuda, Lixeira, "Novo chat Ctrl+O" and a new-page button
  at the foot. Pagecraft keeps design A.

## Gaps found by the audit (2026-11-13)

What the audit saw in Notion and Pagecraft does not have yet, in the
order it is being built. Not counted (n/a for a local app for one
person): AI (autofill, skills, "Ask AI", "Edit with AI", formula AI),
sharing and publishing, people and person properties, Created/Last
edited by, Place and the map view, the dashboard view (paid),
automations, linked events and calendars, property access, connections,
integrations, upgrade cards.

Items 1–4 and 16 were closed before `specs/001-notion-parity-gaps`;
items 5–24 trace to its tasks and requirements, as marked.

1. **done** Number property: "Casas decimais" (Default, 0–5).
2. **done** URL property: "Show full URL" switch.
3. **done** Sort directions named per type: A → Z / Z → A (text, person),
   antigo → novo / novo → antigo (dates), não selecionado → selecionado
   (checkbox), crescente / decrescente (select, status, number).
4. **done** Table layout switches: Mostrar linhas verticais, Exibir ícone da
   página, Envolver todo o conteúdo.
5. **done** [T020, T021 in specs/001-notion-parity-gaps/tasks.md] (`p13-tab-menu`) View tab "Exibir como": Texto e ícone, Apenas texto, Apenas ícone.
6. **done** [T009, T010 in specs/001-notion-parity-gaps/tasks.md] (`p6-date-filter`) Date filter "É relativo a hoje": Últimos(as) / Próximo(as) / Este(a)
   × dia / semana / mês / ano; and Data de início / Data de término for
   a range.
7. **done** [T014, T015 in specs/001-notion-parity-gaps/tasks.md] (`p9-group-by`) Group by text "Exato | Alfabética" (first letter) and number "Únicos |
   Intervalo".
8. **done** [T029 in specs/001-notion-parity-gaps/tasks.md] (`p19-properties/12-count`) Count calculations: "Exibir contagens grandes como 99+".
9. **done** [T012, T013 in specs/001-notion-parity-gaps/tasks.md] (`p8-probe/16-quantifier`) Rollup filter: Qualquer / Nenhuma / A cada.
10. **done** [T028 in specs/001-notion-parity-gaps/tasks.md] (`p19-properties/07-show-as`) Status "Exibir como": Caixa de seleção (done when in the last group).
11. **done** [T022–T026 in specs/001-notion-parity-gaps/tasks.md] (`p14-layouts`) Card layout "Compacto | Lista" (board, gallery); gallery "Ajustar
    mídia"; calendar "Ajustar títulos das páginas"; timeline "Separar
    datas de início e fim"; list "Directly edit page name"; feed
    "Quebrar linhas nas propriedades".
12. **done** [T030–T033 in specs/001-notion-parity-gaps/tasks.md] (`p22-conditional-color`) Conditional color (Cor condicional): rules that tint a view's pages.
13. **done** [T019 in specs/001-notion-parity-gaps/tasks.md] (`p12-outline`) Floating outline: dashes at the page's right edge, one per heading.
14. **done** [T016, T017 in specs/001-notion-parity-gaps/tasks.md] (`p10-selection-panel`) Selection toolbar in Notion's new panel form (turn into, two rows of
    formatting buttons, comment).
15. **done** [T018 in specs/001-notion-parity-gaps/tasks.md] (`p11-slash-line`) Slash menu: the line washed with "/Type to search" while the menu is
    open.
16. **done** Text, URL, email and phone filters: Is, Is not, Contains,
    Does not contain, Starts with, Ends with, Is empty, Is not empty;
    a new one starts with Contains.
17. **done** [T011 in specs/001-notion-parity-gaps/tasks.md] (`p6-date-filter`) The filter popover in Notion's simple form ("<Property> <condition> ⌄
    …" over the value) where Pagecraft shows the advanced "Where" rows.
18. **done** [T027 in specs/001-notion-parity-gaps/tasks.md] (`p19-properties/03-ring`) Number "Show as" as three pictured tiles (42 Number, Bar, Ring).

Left open after the 2026-11-13 work, each a Notion feature outside the
items above, found while photographing them:

19. **done** [T041, FR-020 in specs/001-notion-parity-gaps/tasks.md] (`p24-between`) Date filter "Is between" (two days, both
    included), beside Is on or before and Is on or after.
20. **done** [T042, FR-021 in specs/001-notion-parity-gaps/tasks.md] (`p8-rollup-default`) A new rollup works out from the
    relation and property its settings show, before one is chosen.
21. **done** [T057–T060, FR-026 in specs/001-notion-parity-gaps/tasks.md]
    (`p28-reaction`, `p28-feed-reaction`; Notion `n43-reaction`,
    `n43-reaction2`, `n43-suggest`) The selection panel's "Add reaction"
    (a smiley with +, beside Comentário) opens Notion's emoji picker
    ("Filtrar…", Pessoas…) and marks the text as a discussion: built, with
    reactions on comments (chips, "Add reaction" while pointed at) and on
    feed cards. Its suggest-edit button turns the page to "Sugerindo"
    ("Você está sugerindo", a blue "Sugerindo ×" in the top bar; a reload
    turns it off) and its AI skills (Melhorar escrita, Revisão, Explicar,
    Reformatar, Editar com IA) stay out (spec.md Assumptions: people, AI).
22. **done** [T046, T047, T049, FR-023, FR-024 in specs/001-notion-parity-gaps/tasks.md] (`p25-tab-source`, `p25-section`; Notion `n40-tab-source`,
    `n40-sidebar`, `n40-section-fix`) The view tab menu's Source (the
    database's name in grey, a submenu), Add view to sidebar (enabled in
    the 2026-11-13 photo: it adds a sidebar section) and Hide data source
    titles (an action with an eye, no switch) are built, and the sidebar
    section's menu with Template (`p26-section-reload`, kept after a
    reload) and "Customize sidebar" (T053–T056, `p27-customize`); Manage
    in Notion Calendar and Move to tab stay out (spec.md Assumptions).
23. **done** [T043, FR-022 in specs/001-notion-parity-gaps/tasks.md] (`p24-converge/14-by-name`) Grouping by the title column (Notion's "Agrupar por › Nome") is not
    offered — now offered first, as Notion's list.
24. **done** [T044, FR-022 in specs/001-notion-parity-gaps/tasks.md] With text grouped by its exact value and sorted Alphabetical, Notion
    lists the "Sem Nome" group last; Pagecraft lists the empty group
    first (as Notion does for numbers: "Sem Número" first) — now text
    lists it last and numbers and options first.

25. **done** [T061–T066, FR-027, FR-028] Database templates, as Notion's
    (`n48-template-probe`, `n48-template-measure`, `n48-repeat-probe`):
    - "Novo modelo" opens the template in a center peek (the row peek's
      center frame, 975 wide, only Expand at its top left), not as a full
      page.
    - Under the peek's bar, a strip edge to edge, 44 high, rgb(80,68,37) on
      the dark theme: "You're editing a template in" ▤ <database name>
      (an underlined link to the database, rgb(203,148,52)), a "?" help
      icon, then a "Repeat…" button (28 high, radius 6, a gold border
      rgba(255,188,53,0.46)) with a chevron. Words and link in gold.
    - Repeat lists Day, Weekday, Week, 2 weeks, Month, 3 months, 6 months,
      Year. Choosing one opens "Edit cadence" with Save: "Every [1]
      [week ⌄]", the weekday chips Mon–Sun (one ticked, blue) for weeks,
      At "Around midnight" ›, Start "tomorrow" ›, Ending "Never" ›, Time
      zone ›, "Cancel recurrence", and "Next occurrence: next Mon between
      0h and 3h". Escape leaves without saving: with a change it asks
      "Discard unsaved changes?" (a trash mark, a red Discard, Cancel).
      The unit lists day, week, month, year; At lists "Around midnight"
      (0h–3h), then 3:15 to 23:45 every quarter hour; Start opens a month
      calendar; Ending lists Never, Number of runs, Specific date
      (`n49-cadence`).
    - A template's "…" lists Repeat… (Off ⌄), Set as default, Edit,
      Duplicate, Delete. Delete asks first in the window's middle over a
      dimmed page: "Delete this template?", a red Delete filling the
      width, an outlined Cancel under it (~325 wide).
    - With no template, the menu shows "Templates for <name>", the line
      "Create a reusable page template for this database." and New
      template; "Empty · Default" shows only beside a template.
    Each probe's template was deleted after (`n48-template-check`: the
    menu back to its line and New template).

26. **done** [T067, FR-029] Files cell (`n50-files-probe`): the cell turns
    to "+ Add file or image" and a 300-wide popover opens with the tabs
    Upload and Link (the chosen one underlined); Upload is a blue "Upload
    file" button filling the width (a folder mark beside it) over "or
    Ctrl+V to paste an image"; Link is a "Paste https://…" field, focused,
    over a blue "Link" button. Pagecraft drew the browser's own file
    field ("Escolher arquivo"), now the tabs; a press on a button cell
    presses it at once, and a button's cell has no comment/copy bar.
27. **done** [T068–T071, FR-030] Button property (`n51-button`): its
    column menu is Edit automation, Property access, Change type,
    Freeze, Hide, Insert left, Insert right, Duplicate property, Delete
    property (no filter, sort, calculation, wrap or move). Edit
    automation opens a dialog in the window's middle titled with the
    button's name: "When: The button is clicked", a connecting line,
    "Do: + New action", a blue Save filling the width, a close ×. New
    action lists Edit property…, Add page to…, Edit pages in…, Send
    notification to… (people, out), Show confirmation, Open page, form
    or URL, Send message to agent (AI, out), Define variables, and
    "Available on Plus": Send email…, Send webhook, Send Slack
    notification to… (out). Nothing was saved (Escape, then the menu).

28. **done** [T072–T075, FR-031, photo `u18-suggest`] Suggesting (`n52-suggest`, `n52-card`):
    the selection panel's suggest-edit button turns the page to
    Suggesting ("You're suggesting", a blue "Suggesting ×" in the top
    bar, off after a reload). Text typed then shows blue on a light blue
    wash with a blue underline (rgba(35,131,226,.054) background, a 2 px
    rgba(35,131,226,.15) underline), and a discussion card in the margin
    reads the author, the time and "Add: “ zz”" in blue, with a reply
    field; pointed at, the card shows Accept, Reject, Add reaction and
    More actions. Reject took the text away; deleted text shows struck
    through until accepted. The probe's text was rejected and a stray
    " zz" removed by hand (`n52-cleanup`: "/# Heading one", "Bulleted
    item").
29. **done** [T076–T078, FR-032, photo `u19-tabs`] Sidebar tabs and Move to tab: the
    sidebar's top row holds tabs (Home, chat, calendar); a section's menu
    and Customize sidebar offer "Move to tab", which moves the section
    under another tab.
30. **done** [T079–T080, FR-033, photo `u19-tabs`] "Manage in Notion Calendar" in a date
    view's menus and toolbars: Pagecraft has no calendar product of its
    own, so its equivalent shows the view's dated pages in the sidebar's
    calendar tab ("Upcoming").

31. **done** [T081–T085] The differences left after the photos of items
    26–28 closed: a forward Delete in Suggesting strikes on with the caret
    past it; a suggestion's card shows "You · now" before "Add: “…”"; a
    files cell reads "+ Add file or image" with no bar over it; the
    automation dialog's title is quiet over a line; a lone chart column
    keeps a bar's width; a form's date question is an English text field
    ("Select a date") instead of the browser's own.
32. **done** [T093, FR-022, photos `p9-group-title`, `p9-title-icon`
    against `n39-groups/03-group-by`] "Agrupar por" lists "Nenhum" first,
    flush with the icons' edge and no icon, then the title column with
    its "Aa" icon (as its header), then the other properties by name in
    character order ("URL" before "Última edição"). The title's "Aa" also
    leads it in the filter, sort and sub-group lists.
33. **done** [T099, FR-026, `n54-emoji-list`, `n54-emoji-measure`] Notion's emoji
    picker for a reaction, measured: 408 × 356 px; "Filtrar…" (Filter…)
    in a 356 × 28 px field, radius 6, with a magnifier; a ✋ skin tone
    button 28 × 28 px; group names 12 px, weight 500, grey; emoji 24 px in
    32 px cells, twelve to a row; at its foot "Jump to category" buttons
    32 px: recent, People & Body, Animals & Nature, Food & Drink,
    Activities, Travel & Places, Objects, Symbols, Flags, custom, add. Its
    eight groups hold 518, 144, 132, 86, 218, 255, 221 and 269 emoji in
    the Unicode order; Pagecraft's list is read from it. "custom" and
    "add" (a workspace's own emoji) stay out: uploads of one's own emoji.
34. **done** [T100, FR-032, `n53-tabs`] The sidebar's tab row draws its icons
    filled (house, bubble, calendar); the calendar tab's section reads
    "Próximos eventos" (Upcoming events). Notion names that tab
    "Reuniões" (Meetings) for its AI meeting notes; Pagecraft's tab holds
    the dated pages alone and keeps the name "Calendar".
35. **done** [T101, FR-020] "Is between" read in the app's own date words
    ("Nov 10, 2026"), not the browser's date field, whose day order
    follows the system's language.
36. **done** [T103, FR-015, FR-016, `n56-color-rule`, `n56-bg`, `n56-apply`,
    `n56-value`] A conditional color rule, read in Notion (a rule made on
    the test database and deleted at once): "Nova configuração de cor"
    first asks "Procurar uma propriedade..." (the title first, then the
    properties A–Z); the rule then reads "<property> é ⌄" in grey with a
    trash ("Excluir regra de cor condicional"), a value field
    ("Selecione..."; a checkbox's Marcadas / Desmarcadas), "Plano de
    fundo da página" with a swatch and "Verde" ›, ten swatches in two rows
    of five, no names; "Aplicar a" › Linha inteira, Esta propriedade; and
    "+ Adicionar outro" under the rule. A new rule is green; with no value
    it colors no row.
37. **done** [T104, FR-032, `n53-tabs/05-home-tab`] Under the Home tab the
    sidebar lists New page first: no Home row repeats the tab.
38. **done** [T105, FR-017, `n55-words2`, `n55-words4`] Notion's English words,
    looked up among the strings of Notion's own code loaded on the test
    page (its menus opened and closed first): found as Pagecraft writes
    them: Show as, Display as, Source, Card layout, Compact, Fit media,
    Wrap page titles, Separate start and end dates, Directly edit page
    name, Wrap properties, Card preview, Card size, Color columns, Show
    calendar by, Show weekends, Show timeline by, Show table, Start date,
    End date, Text by, Number by, Exact, Alphabetical, Unique, Group by,
    Hide empty groups, Remove grouping, Conditional color, New color
    setting, Page background, Apply to, Add another, This property,
    Checkbox, Number, Bar, Ring, Changes apply to all views showing this
    property., Divide by, Show number, Set as default, Empty page,
    Upload, Embed link, Edit automation, Edit property, Suggest edits,
    Suggesting, Add reaction, Accept, Reject, Upcoming events, Filter…,
    the eight emoji groups. Corrected: "Whole row" → "Entire row",
    "Search for a property" → "Search for a property…". Not in the code
    loaded (their menus load apart), so kept as the audit read them: the
    date conditions, Show large counts as 99+, the cadence words, the
    button's actions, Move to tab, Manage in Notion Calendar.

Test data left as found (2026-11-13): "Linha teste"'s "Caixa de
seleção" was ticked when the row was made (its "Atualizações" panel,
`n45-history/04-updates`: "Há 4 horas", ID 1, Nome, the box ticked). A
cleanup here unticked it by mistake; it was ticked again
(`n45-retick/03-tick`). The sidebar sections, the stray empty row, the
"Customize sidebar" mode and the "Sugerindo" mode opened while probing
were all removed or left; a read afterwards (`n44-state`) showed one row,
no section, no discussion mark, neither mode on.

### Sample database (2026-11-13, SC-002)

The same rows were built in Notion's test workspace (in Teste blocos'
database, then moved to the trash) and in Pagecraft
(`src/features/database/notion-sample.test.ts`), with today 2026-11-13,
a Friday, weeks from Sunday:

| Row | Number | Date |
| --- | --- | --- |
| Linha teste | | |
| Ana | 5 | Nov 8 |
| álvaro | -5 | Nov 10 |
| Bia | 0 | Nov 12 |
| 3D | 9 | Nov 13 |
| Carlos | 10 | Nov 14 |
| Zeca | 12 | Nov 16 |
| Ébano | 19 | Nov 18 |
| Duda | 20 | Nov 20 |
| Marta | 30 | Nov 2 |
| Nina | 35 | Dec 1 |

Rows kept by "is relative to today", Notion and Pagecraft alike:

| Period | Rows |
| --- | --- |
| This week | Ana, álvaro, Bia, 3D, Carlos |
| Past week | Ana, álvaro, Bia, 3D |
| Next week | 3D, Carlos, Zeca, Ébano, Duda |
| This month | Ana, álvaro, Bia, 3D, Carlos, Zeca, Ébano, Duda, Marta |
| Next month | 3D, Carlos, Zeca, Ébano, Duda, Nina |
| Past month | Ana, álvaro, Bia, 3D, Marta |
| This day | 3D |
| Past day | Bia, 3D |
| Next day | 3D, Carlos |

Groups, Notion and Pagecraft alike (Pagecraft changed to match):

- Text by Alphabetical: 3 (3D), A (Ana), B, C, D, L, M, N, Z, then
  "Outro" / Other (álvaro, Ébano): a digit is its own group, only A–Z
  are letters, accented letters fall in Other, after the letters.
- Number by Interval: Notion's range is 0 to 1000 and its size 100 by
  default ("Agrupar por intervalo 0 – 1000", "Agrupar a cada 100");
  with size 10: Sem Número (Linha teste), 0 a 10 (Ana, Bia, 3D), 10 a
  20 (Carlos, Zeca, Ébano), 20 a 30 (Duda), 30 a 40 (Marta, Nina), Fora
  do intervalo (álvaro).
- The rollup quantifier was compared by its words (Any, None, Every and
  the target's conditions); the related-rows results are covered by
  `rollup-filters.test.ts`.

## Controls

**Now** says what the control is today: "native" (a browser `<select>`
or checkbox), "custom" (our own, not yet measured against Notion) or
"Notion" (matches the reference).

### Database view

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| View settings | `view-settings/` | Notion | menu with rows: name, Layout, Property visibility, Filter, Sort, Group, then the view's actions; each row opens a panel |
| Sorts | `view-settings/sort-panel.view.ts` | Notion | with none, New sort: a searchable list of properties; with some, a row per sort (grip, property, direction, remove), Add sort, Delete sort |
| Layout choice | `view-settings/layout-panel.view.ts` | Notion | tiles in the Layout panel, then the layout's options |
| Group by | `view-settings/group-panel.ts` | Notion | searchable option list with property icons, check on the chosen one |
| Group sort, date step | `view-settings/choice-panels.ts` | Notion | rows with value and chevron, each opening an option list |
| Hide empty groups | `view-settings/group-panel.ts` | Notion | switch row |
| Card preview, card size | `view-settings/layout-panel.view.ts` | Notion | rows with value and chevron in the Layout panel |
| Color columns | `view-settings/layout-panel.view.ts` | Notion | switch row |
| Calendar date property | `view-settings/choice-panels.ts` | Notion | row with value and chevron |
| Property visibility | `view-settings/choice-panels.ts` | Notion | list with type icons and an eye toggle per property |
| Filter, none yet | `filter-start.view.ts` | Notion | "Filter by…": a searchable list of properties; choosing one adds its condition |
| Filter conjunction | `view-filters.view.ts` | Notion | small select: "And" or "Or" |
| Filter property, condition, value | `filter-row.view.ts` | Notion | select buttons opening option lists; options of a select property as chips |
| Calculation | `table-footer.view.ts` | Notion | "Calculate" with a chevron opening the grouped menu of calculations |
| Set property on ticked rows | `table-bulk.view.ts` | Notion | a button per property in the bar |
| Linked view source | `linked-view.view.ts` | Notion | searchable list of databases |
| Row properties on a row page | `row-properties.view.ts`, `row-value.view.ts` | Notion | 34 px rows: the type's icon and name in a 160 px column, then the value drawn as its cell; options, tags and dates open their editors |
| Column menu | `column-menu.view.ts` | Notion | name with its type's icon in a box; Edit property ›, Change type ›, Filter, Sort ›, Group, Calculate ›, Freeze, Hide, Wrap, Insert left and right, Duplicate, Delete; submenus open on hover beside the row |
| Change type | `property-edit-menu.ts` | Notion | list of types with icons, the current one checked; values carry over |
| Calculate | `column-menu-items.ts` | Notion | None, then Count ›, Percent ›, More options › |
| Board column menu | `board-column-menu.view.ts`, `group-menu-entries.ts` | Notion (and Move left and right, the keyboard's way to drag) | the group menu: the option's name, Hide, Delete, its colors |
| Row tick box | `table-gutter.view.ts` | Notion | Notion checkbox |
| Group header | `group-header.view.ts`, `group-menu.view.ts` | Notion | caret, chip, count; hover shows "…" (the group's menu: name, Hide, Delete, Colors for an option's group) and "+" (a new row in the group) |

| Row peek | `features/row-peek/` | Notion (no Share: one person, no sharing) | side or center peek with Close, Open as full page, mode switch, Previous and Next, then Comment, Copy link, the favorite star and page actions; the side peek's edge drags it wider (kept), arrows by keyboard; the peek is in the address, so a link opens it and Back closes it; Escape closes, K and J step |
| Open pages in | `view-settings/choice-panels.ts` | Notion | row in the Layout panel opening Side peek, Center peek, Full page |
| New and its templates | `database.view.ts`, `templates-menu.view.ts` | Notion (a repeat has no time of day) | split blue button; the arrow lists "Templates for …", each template with "…" (Set as default › For all views / For this view, Repeat › Off, Daily, Weekly, Monthly, Yearly, Edit, Duplicate, Delete), Empty page, New template; Default marks the one the view's new rows start from |
| Template note | `template-banner.view.ts` | Notion | a strip over a template's page: "You're editing a template in …" |
| Import | `features/sidebar/sidebar.view.ts`, `csv-file.view.ts`, `features/markdown-import/` | Notion (CSV and Markdown files; no ZIP or other apps) | Import in the sidebar's foot takes several files: a CSV becomes a database named as the file, its columns typed; a Markdown file a page named by its first heading or the file, its blocks nested as written |
| Export and print | `features/markdown-export/`, `features/page-menu/` | Notion | Export as Markdown saves the page, or with subpages a ZIP of Markdown files in folders as they nest; Export as HTML saves the page as one HTML file; "Print or save as PDF" prints the page alone |
| Export as CSV | `view-settings/root-panel.view.ts` | Notion (the view only, no Markdown pages) | the view's columns and rows as a UTF-8 CSV file |
| Lock page, Lock database | `features/page-menu/page-menu.view.ts` | Notion | a switch in the page's menu; a locked page shows "Locked" in the top bar, which unlocks it; typing does nothing and says why |
| Lock view | `view-settings/root-panel.view.ts` | Notion | a switch in the view settings; filters, sorts and layout stay as they are |
| Backlinks | `features/backlinks/`, `features/page-menu/page-menu-style.view.ts` | Notion (kept: Notion no longer lists Backlinks in its page menu; ours sits in Appearance and layout) | "↗ N backlinks" under the title opening the linking pages |
| Comments | `features/comments/`, `format-toolbar.view.ts`, `editor-block-menu.view.ts` | Notion (one author, "You"; no mentions in comments) | "Add comment" over the title and the page's discussions under it; "Comment" in the text toolbar, the block menu and Ctrl+Shift+M; commented text washed and underlined in yellow; a speech bubble and count by the block opening its discussions with the quote, each comment's initial, name, time and text, Reply, Resolve, Delete; "Resolved comments" in the page's actions, with their count, lists them to read or Reopen; a value cell's bar comments on the value, counted by its property on the row's page; Delete asks "Delete this comment?" |
| Inbox and reminders | `features/inbox/`, `features/mention-menu/`, `app/reminder-notices.ts` | Notion (reminders only; no mentions or comment notices from others, one person) | "@remind" offers Remind me today, tomorrow, next week, a ⏰ date mention; Inbox under Home with a red count; the due reminders with a bell, page and day, a blue dot until read, Mark all as read; a browser notice from 9:00 on the day while the app is open |
| Version history | `features/page-history/`, `features/page-menu/page-menu-entries.ts` | Notion (no "Group by", no authors) | page menu › Version history fills the window: the versions in a 320 px column on the left, Restore, the version beside them with what it wrote marked in blue |
| Template gallery | `features/templates/` | Notion (built-in page templates, grouped by kind) | Templates in the sidebar's foot opens a wide dialog: the templates by kind down the side, the chosen one previewed, "Use this template" |
| Trash | `features/trash/` | Notion (no Last edited by or Teamspaces filters: one person) | a 414 × 453 panel by the sidebar's foot: a search, an "In" filter, rows with icon, title and place, Restore and Delete, "No results", the 30-day note at its foot |
| Search (Ctrl+K, Ctrl+P) | `features/command-palette/` | Notion (no Created by: one person; no Ask AI; no grouping of recents by day) | wide dialog 1006 × 676 px, radius 20; the field, chips Title only, In page, Filter › Date; Recent pages or Best matches with each page's place and the text around a match; the active page's preview beside the list |
| Sub-group | `view-settings/sub-group-panel.ts`, `layouts/board/board-lanes.view.ts` | Notion | Sub-group row in a board's Group panel; once chosen, Sub-group by, Sort, Hide empty groups, Remove sub-grouping; lanes with a toggle, chip and count |
| Date cell and date value | `ui/date-picker/`, `date-menu.ts`, `cell-date.view.ts` | Notion (no time zone: days have none) | the chosen days in fields that take a typed day ("Dec 3", "12/3/2026", "tomorrow"), the month with Today and arrows, six weeks of days; End date, Date format › (date and time formats), Include time, Remind › (none, on the day, 1 or 2 days or a week before; due reminders reach the inbox), Clear |

### Property settings

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| Number format | `number-config.view.ts` | Notion | row with value opening an option list beside it |
| Date and time formats | `date-config.view.ts` | Notion | rows with values opening option lists beside them |
| Relation database | `relation-config.view.ts` | Notion | searchable list of databases |
| Rollup relation, property, calculation | `rollup-config.view.ts` | Notion | rows with values opening option lists beside them |
| Button property action | `button-property-config.view.ts` | Notion | rows with values opening option lists; opening the row a switch row |
| Options and their colors | `option-list.view.ts`, `option-menu-parts.ts` | Notion | each option a row with a grip and its chip, opening its submenu: name, Delete, colors as swatches with a check |

### Blocks

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| Code language | `code.view.ts` | Notion | searchable language list |
| Button block action | `button-config.view.ts` | Notion | option list |
| To-do box | `to-do.view.ts` | Notion | Notion checkbox |

### Menus already custom

Slash menu, block menu, color menu, page menu, simple table menu,
mention menu, emoji picker, icon and cover pickers, link editor,
equation editor, format toolbar, tone picker: each opened and compared
against the reference on every run.

## Owners

- `src/ui/menu/`: every menu and option list — panel, rows, sections,
  header, search, switch rows. No feature draws its own panel.
- `src/ui/select/`: the button that shows a current choice and opens an
  option list. It replaces every native `<select>`.
- `src/ui/checkbox/`: the tick box of to-dos, rows and settings.
- `src/ui/overlay/`: which overlay is open, its position and light
  dismiss. One overlay at a time, kept in `ui.overlay`.

## Last run

2026-11-11, review server, 820 × 640, dark theme.

- Column menu: opened every submenu by click and by hover (Edit
  property, its date and time format lists, Change type, Sort,
  Calculate); duplicated a column, inserted one left, renamed it,
  changed it to Select, added two options and opened one's submenu.
- Blocks: added a code block through the slash menu, opened its
  language list, searched "py" and chose Python with Enter.
- View settings: Sort (New sort, sort list, direction list), Filter by.
- Group header: "…" and "+" on hover, the group menu.
- Filter popover: with no filter it was 151 px wide and wrapped "Add
  filter group"; it now opens Notion's "Filter by…" list, and the editor
  is at least a menu wide. Conditions' lists open under their control.
- Found and fixed: a choice in a nested list sent focus to the menu's
  name (a shared ref callback ran again); a tall submenu covered its
  menu (now centered on its row and moved to fit, as Notion's).

- Opened and photographed: the view settings and every panel (Layout,
  Group, Sort, Property visibility); the filter popover with its
  property, condition, value and join lists; the footer's calculation
  list; a date property's settings and its format list; the column
  menu.
- Found and fixed: a condition without its value filtered out every row;
  a property's settings opened in the window's corner; options showed
  their value beside their label; menus kept fading in whenever their
  anchor moved.
- While the browser pane is hidden the page runs as a background page:
  transitions and animations stay at their start, so a screenshot shows
  a half-faded menu or an unticked box. Show the pane, or, for the
  capture only, finish the running animations first
  (`element.getAnimations({ subtree: true })`, then `finish()`).

## Open

- Light theme measurements of the menu reference.
- A board in Notion to measure its columns and cards with a real pointer
  (the test workspace has none).
