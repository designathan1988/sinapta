# Test script: sign-in

Part `features/sign-in`, 2026-11-14, by the `feature-test-scripts` skill.

- Inventory (`npm run inventory -- sign-in`): 12 controls (2 inputs,
  Continue, the link buttons, 4 forms by step, the separator, 6 provider
  buttons, Terms and Privacy links), 0 menus, 0 own keys (the global
  shortcuts do not apply before sign-in), 0 drags, 3 commands
  (`account.chooseProvider`, `account.request`, `account.setStep`), the
  server paths of `persistence/account-client.ts` (`/api/account/lookup`,
  `sign-in`, `code`, `code/verify`, `sign-up`, `me`) and of
  `passkey-client.ts`; the error line is a `role=alert` announcement.
- Files read: `sign-in.view.ts`, `sign-in-forms.view.ts`,
  `ui/copy/account-text.ts`, `server/account-routes.ts`,
  `state/account.commands.ts`. In scope: the four steps (email, password,
  code, profile), the providers, the terms. Out of scope: sign-out and
  passkey registration (Settings › My account, tested with settings).
- States in the views: step email | password | code | profile; error
  null | each of 8 kinds; request pending (Continue disabled, aria-busy);
  providers configured on the server or not.
- Plans: `.captures/plans/ts-sign-in-01` … `-10` (human hand, seed 31,
  cursor, trail and keys drawn), `gen-sign-in.mjs` writes them; Notion:
  `.captures/plans/n132-sign-in.json` (signed out, a clean context).
- Accounts made: `script-hand@pagecraft.test`, `script-emoji2@pagecraft.test`
  (local review server only).

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |
| S1 | Email step at rest | open | logo, headline, Email field focused | **pass**: field focused with the blue border (its focus mark), all text legible | 01/00 |
| S2 | Continue pointed at | hover | wash, pointer cursor | **pass**: cursor pointer, slightly darker blue | 01/01, 01/01.1 |
| S3 | Continue pressed | down | pressed state | **pass**: pressed, focus moves to the button | 01/02 |
| S4 | Continue with nothing typed | up | told what is missing | **finding** (interface, Notion difference): the browser's own bubble "Preencha este campo." in the browser's language on an English page; Notion shows its own red line "Endereço de e-mail inválido" under Continue and nothing in the browser's language. `sign-in-forms.view.ts` | 01/03; n132/02 |
| S5 | Invalid address `abc`, Enter | type, Enter | told why | **finding**: same browser bubble ("Inclua um @…"); Notion's own red line, and a × to clear the field | 01/05; n132/04 |
| S6 | Existing address, Enter | type, Enter | password step, password focused | **pass**: email shown read-only, password focused | 01/08, 01/08.1 |
| S7 | Wrong password | type, Enter | error said and announced | **pass with a finding** (interface): "Incorrect password. Please try again." announced; it sits under the two links, three lines below the field it is about, and the wrong password stays in the field | 01/09 |
| S8 | Right password | select all, type, Enter | signed in | **finding** (UX): signed in, but the main area is blank "Select a page, or create one, to start writing." with the focus on the page body; Notion opens Home or the last page. Owner: `app/router.ts` | 01/11 |
| S9 | Email me a login code | hover, click | code step, hint, code focused | **pass**: "We just sent you a temporary login code… This server writes its codes to its own log." | 02/02, 02/03 |
| S10 | Wrong code | type, Enter | error | **pass**: "Invalid login code. Please try again." announced | 02/04 |
| S11 | Right code | – | signed in | **not run**: the code is written to the server's log, which the capture cannot read | – |
| S12 | Use a different email | click | email step again, focused | **pass** | 02/05 |
| S13–S16 | Google, ChatGPT, Apple, Microsoft | hover, click each | told it is not set up | **pass with a finding** (copy): each says "<Name> sign-in is not set up on this server: its owner registers the server with that company and sets the client it gives." — three lines, server-admin words in front of a person signing in | 03/01–08 |
| S17 | Passkey | click | the browser's passkey prompt, then the result | **finding** (missing feedback): 1.5 s and more with nothing visible (the request is pending, aria-busy only on Continue); then "The passkey was not used…" | 03/10, 03/12 |
| S18 | SSO while the passkey is pending | click | SSO's own answer | **finding** (front end): the click is lost; the passkey's error arrives instead | 03/12 |
| S19 | Provider buttons pointed at | hover each | wash | **pass**: border and wash | 03/01, 03 odd |
| S20 | New address | type, Enter | profile step, name focused | **pass** | 04/01 |
| S21 | Name with accents and emoji | type `Café 🎉 Hand` | kept whole | **pass**: "Café 🎉 Hand's Pagecraft" (first run showed `��`: a capture-hand fault, fixed in `scripts/capture-typing.ts`) | 10/02, 10/03 |
| S22 | Account made | password, Enter | signed in, first page | **pass**: Getting started opens, sidebar lists it and Tasks | 04/04, 10/03 |
| S23 | "New user? Sign up" | look | a link | **finding** (Notion difference): plain text; Notion's "Cadastre-se" is a link to its sign-up page | 01/00; n132/00 |
| S24 | Tab through the page | Tab ×10 | ring on each stop, sensible order | **pass**: email → Continue → 6 providers → Terms → Privacy, each with a 2 px ring | 05/01–10 |
| S25 | Terms & Conditions | click | the terms | **finding** (UX): goes to `#terms`, the page stays the same; same for Privacy Policy. Notion opens its pages | 05/11, 05/12 |
| S26 | Language | look | a language choice | **finding** (Notion difference): static "Language: English"; Notion has a language menu | 01/00; n132/00 |
| S27 | Offline lookup | offline, Enter | told it is offline, nothing lost | **finding** (UX): "Something went wrong. Please try again." — does not say the connection is down; the address is kept | 06/02 |
| S28 | Back online, Continue | online, click | goes on | **pass**: password step | 06/03 |
| S29 | Reload on the password step | reload | a sensible place | **pass**: email step again (as Notion) | 06/04 |
| S30 | Dark theme | theme dark | legible, contrasts | **pass** (the default context is dark) | 07/00–02 |
| S31 | Light theme | theme light | legible | **pass**: dark logo tile, red error legible | 09/00–02 |
| S32 | Typing with slips | typos 0.08 | the address right in the end | **pass**: slips (`ps`, `psg`) fixed by Backspace, final `review@pagecraft.test` | 08/01 |
| S33 | Busy Continue | – | disabled while pending | **pass** (seen on S17: `aria-busy=true`) | 03/10 |
| S34 | Many wrong passwords | – | slowed or locked after a few | **finding** (server, security): `server/account-routes.ts` has no limit or delay on wrong passwords or codes: a password can be guessed without end | – |

Photos are in `.captures/pagecraft/ts-sign-in-NN/` (`NN/step`).

## Summary

34 cases: 21 pass, 12 findings (S4–S5 count as one), 1 not run.

Findings, most serious first:

1. S34 — no limit on wrong passwords or codes (server, security).
2. S8 — after signing in the main area is blank instead of Home or the
   last page (UX).
3. S17, S18 — a pending passkey shows nothing, and other buttons are lost
   meanwhile (feedback, front end).
4. S4, S5 — the browser's validation bubble in the browser's language
   instead of the page's own line (interface).
5. S27 — offline is told as "Something went wrong" (UX).
6. S25 — Terms and Privacy lead nowhere (UX).
7. S13–S16 — provider error words meant for the server's owner (copy).
8. S7 — the error is three lines below the field; the wrong password stays.
9. S23, S26 — Sign up is not a link; no language menu (Notion differences).
