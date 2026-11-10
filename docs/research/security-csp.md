# Research: CSP, Trusted Types, link schemes, paste sanitization

Checked 2026-11-10. Current releases: lit-html 3.3.3, Vite 8.3.7. Targets: Chrome/Edge 155-156, Firefox 158-159, Safari 27.1-27.2.
Items marked (unverified) were not re-confirmed against a primary source in this pass.

## Findings

- **Policy for the production build** (static files, one module script, one stylesheet, no network use):

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:;
font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none';
frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types lit-html pagecraft-paste
```

- **Nonce/hash vs `'self'`.** MDN calls nonce- or hash-based policies "strict CSP" and says nonces need a per-response value, otherwise use hashes. A static host cannot produce nonces; with zero inline scripts and same-origin hashed bundles, `script-src 'self'` with `default-src 'none'`, `base-uri 'none'` and no third-party origins gives the same result. Do not set Vite's `html.cspNonce` to a build-time constant: Vite documents it as a placeholder to be replaced "with a unique value for each request".
- **Meta vs header.** `<meta http-equiv="Content-Security-Policy">` works on any static host and is the only option when headers cannot be configured, but it "does not support all CSP features" (MDN): report-only policies cannot be delivered by meta, and `frame-ancestors`, `sandbox` and reporting directives are ignored there (CSP3, unverified in this pass). It must be the first child of `<head>`. Decision: ship the meta tag (works everywhere, including opening the build from any static server) and document the same policy as a header for hosts that support it, to add `frame-ancestors`.
- **Vite dev server.** In dev, Vite injects CSS as `<style>` elements and uses a WebSocket for HMR, so the production policy breaks hot reload (`style-src 'self'`, `connect-src 'self'`). Vite's nonce support covers its own tags but needs a server to substitute the nonce. Decision: inject the meta tag only in the build (`transformIndexHtml` plugin with `apply: "build"`), and test the real policy with `vite preview` in the end-to-end run. Keep `build.assetsInlineLimit` in mind: inlined assets are `data:` URIs, hence `img-src data:`; never allow `data:` in `script-src`.
- **lit-html and `style-src`.** What CSP blocks without `'unsafe-inline'` (MDN `style-src-attr`): `style="..."` in markup, `setAttribute("style", ...)`, and `style.cssText = ...`. What it allows: individual CSSOM writes, `el.style.width = ...` / `el.style.setProperty(...)`.
  - A lit attribute binding `style=${string}` commits through `setAttribute` (lit-html.ts `_commitValue`): blocked.
  - `styleMap`: source confirms that on the FIRST render `update()` returns `this.render(styleInfo)`, a string that is committed with `setAttribute("style", ...)`; only later renders use `style.setProperty`/`style[name]`. So `styleMap` violates the policy once per element (lit/rfcs#13, open, repo archived 2026-07-21; Firefox patched its own copy in bug 1808741).
  - Static `style="..."` inside an `html` template is parsed through `innerHTML` of a `<template>`; treat it as blocked as well (unverified, avoid it).
- **How to avoid `'unsafe-inline'` for styles.** Dynamic values in this app are few (sidebar width, column widths, indent depth, drop marker position). Options, best first: (1) classes and `data-*` attributes with tokenized CSS for anything enumerable (indent depth); (2) a small own lit directive (about 15 lines, `directive` from `lit-html/directive.js`) whose `update()` calls `element.style.setProperty("--x", value)` and returns `noChange`, never a string; (3) a constructable stylesheet (`document.adoptedStyleSheets`) for per-column widths. Fallback if none is acceptable: `style-src-attr 'unsafe-inline'` while keeping `style-src-elem 'self'` (both directives exist in all targets; Safari got `style-src-elem` in 26.2).
- **Trusted Types.** Supported in all targets (Chrome 83, Safari 26, Firefox 148; Baseline newly 2026-02-24). lit-html creates one policy named `lit-html` (`trustedTypes.createPolicy('lit-html', { createHTML: (s) => s })`) used only for developer-authored template strings; bindings are set as text or attributes, never parsed as HTML. So `require-trusted-types-for 'script'; trusted-types lit-html` works as long as `unsafeHTML`/`unsafeSVG` are never imported (lint ban).
- **Link scheme allow-list.** Parse with the URL parser, never a regex: `const url = URL.parse(input)` (Chrome 126, Firefox 126, Safari 18; returns `null` instead of throwing), accept only when `url.protocol` is in `{"http:", "https:", "mailto:"}`, and store `url.href`. The parser lower-cases the scheme and strips leading/trailing whitespace and embedded tab/newline, which defeats `JaVa\nScript:` tricks. No base URL is passed, so relative input is rejected; the UI may retry once with `https://` prefixed. Check in two places: the Valibot schema in `src/model/` (import and storage boundary) and again where the `<a>` is rendered (render nothing clickable on failure). Rendered links get `rel="noopener noreferrer"`.
- **Paste.** Take data from the `beforeinput` `insertFromPaste` `dataTransfer` (spec: holds `text/html` and `text/plain`), or from the `paste` event's `clipboardData`. If `text/html` exists, parse it into an inert document and walk it; else use `text/plain`.
  - `new DOMParser().parseFromString(html, "text/html")`: MDN: "`<script>` elements are marked as non-executable, events are not fired, and event handlers aren't called", the document is "essentially inert", though it "can download resources specified in `<iframe>` and `<img>`" (blocked here by `default-src 'none'`).
  - Under Trusted Types `parseFromString` is an injection sink: a plain string throws `TypeError`. Hence the second policy, `pagecraft-paste`, created and used only inside the paste parser, with an identity `createHTML`. This is safe only because the result is never inserted: the walker reads it and emits `RichText`.
  - Walk with a `TreeWalker`: text nodes become span text; ancestors map to marks: `b`/`strong` -> bold, `i`/`em` -> italic, `code`/`tt`/`kbd` -> code, `a[href]` -> link after the scheme check; `br` and block elements (`p`, `div`, `li`, `h1`-`h6`, `tr`) -> block or line breaks; skip `script`, `style`, `template`, `head`, `title`, `noscript`, `svg`, `math`. Everything else contributes text only. Output goes through the same RichText schema as any other input.
  - `Document.parseHTML()` / `setHTML()` (Sanitizer API) would remove the need for the policy but are missing in Safari (Chrome 146, Firefox 148): not usable as the only path. DOMPurify is unnecessary because no HTML is ever inserted, and it would be a sixth runtime dependency.

## Pitfalls

- Google Docs wraps clipboard HTML in `<b style="font-weight:normal" id="docs-internal-guid-...">`, and Word emits `mso-` styled spans: a naive `b` -> bold rule makes the whole paste bold. Ignore `b` with an id starting `docs-internal-guid` and, where cheap, respect `font-weight: normal` (unverified here; cover with fixture tests).
- Never move nodes from the parsed document into the page and never assign pasted strings to `innerHTML`; MDN: scripts and handlers "will be able to run if they are inserted into the visible DOM".
- A `default` Trusted Types policy would silently bless every sink: do not create one.
- `trusted-types` without the `'allow-duplicates'` keyword makes a second `createPolicy('lit-html')` throw: lit-html must be bundled exactly once (unverified; watch for it in tests with module resets).
- `mailto:` URLs have no host; do not add checks that assume `url.hostname`.
- CSP in a meta tag does not apply to content before it; keep it first in `<head>`, before the stylesheet link.

## Decision it supports

Ship a build-only meta CSP: `default-src 'none'`, `script-src 'self'`, `style-src 'self'`, Trusted Types enforced with two named policies (`lit-html`, `pagecraft-paste`). Do not use lit's `styleMap` or any `style=` binding; set dynamic sizes through a CSSOM-only directive or custom properties. Validate links with `URL.parse` + protocol set at the model boundary and at render. Paste = DOMParser inert document + tree walk to RichText, plain-text fallback.

## Sources

- MDN CSP guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
- MDN `style-src-attr`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr
- CSP Level 3, meta element: https://www.w3.org/TR/CSP3/#meta-element
- Vite, Content Security Policy: https://vite.dev/guide/features
- lit-html source (policy `lit-html`, attribute commit): https://github.com/lit/lit/blob/main/packages/lit-html/src/lit-html.ts
- lit `styleMap` source: https://github.com/lit/lit/blob/main/packages/lit-html/src/directives/style-map.ts ; issue: https://github.com/lit/rfcs/issues/13 ; Firefox patch: https://bugzilla.mozilla.org/show_bug.cgi?id=1808741
- lit directives docs: https://lit.dev/docs/templates/directives/
- MDN DOMParser.parseFromString: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
- MDN `trusted-types` directive: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types
- Modern Web Guidance (trusted-types, sanitize-untrusted-html): https://developer.chrome.com/docs/modern-web-guidance/guides/security/trusted-types
- Input Events Level 2 (paste `dataTransfer`): https://www.w3.org/TR/input-events-2/
- MDN browser-compat-data 8.1.8: https://github.com/mdn/browser-compat-data
