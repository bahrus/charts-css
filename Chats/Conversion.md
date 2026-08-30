# Conversion

## Bruce's Ask

Can you work on converting this web component to the new tech stack, [as instructed here](../types/NewCustomElement.md).  I think it should be HTML-first.  The instructions may indicate out of date point versions of dependencies.  Make sure to update to the latest.

The current logic found in legacy is built heavily with [trans-render](https://github.com/bahrus/trans-render/wiki/V.--Mount%E2%80%90observing-transforms), which we want to replace with assign-gingerly.

Note frequent use of syntax like:

```JS
{sa: '.show-primary-axis', o:'showPrimaryAxis'},
```

This is saying "if showPrimaryAxis is true, add class "show-primary-axis" otherwise remove the class.

In preparation for this, assign-gingerly was just updated to support this logic:

https://github.com/bahrus/assign-gingerly/blob/baseline/docs/multi-invoke.md

We should probably update the instructions with this common use case.

As with previous conversions, if something isn't clear how to orchestrate with assign-gingerly, or existing features just flag it, and I'll look into updating the dependencies to support whatever we need.

Please add your implementation notes / gaps below.

---

## AI Implementation Notes

### What landed

HTML‑first conversion, modelled on `plus-minus` / `side-burger` / `scratch-box`. The
old trans‑render implementation is untouched under [`legacy/`](../legacy/).

| File | Role |
|------|------|
| [`root.html`](../root.html) | Declarative shadow DOM: host styles + **charts.css 1.2.0 inlined** into `<style adopt>`, a `<template id=css-charts-row>` for repeated rows, and `<main><slot><table class="charts-css …"><tbody itemprop=data>`. |
| [`el-maker.mjs`](../el-maker.mjs) → [`el-maker.json`](../el-maker.json) | Type‑checked `roundabout` + `templateMaker` config generator (`npm run build-el-maker`). |
| [`types.d.ts`](../types.d.ts) | `EndUserProps` / `AllProps` / `DataItem` / `Actions`, plus the `wc-info` doc class. |
| [`imports.html`](../imports.html) | Import map (assign‑gingerly, el‑maker, imp‑h, mount‑observer, be‑hive, roundabout‑lib, charts.css). |
| [`package.json`](../package.json) | Deps bumped to latest: `assign-gingerly@0.0.91`, `el-maker@0.0.26`, `charts.css@1.2.0`, `imp-h@0.0.6`, `mount-observer@0.1.53`, `be-hive@0.1.18`; dev `@playwright/test@1.62.1`, `spa-ssi@0.0.27`, `wc-info@0.0.186`. |
| [`demo/*.html`](../demo/) | Rewritten to the `imp-h="css-charts/root.html"` + `<script type=precede data-extends=el-maker src="css-charts/el-maker.json">` pattern. New `demo/dev.html`. |
| [`doc.mjs`](../doc.mjs) | `wc-info` manifest generator. |

### Legacy → new mapping

| Legacy (`config.js`) | New |
|---|---|
| `xform.table` — `{sa:'.show-primary-axis', o:'showPrimaryAxis'}` ×10 | **merge #3**: one multi‑invoke key `'?.tableEl?.classList?.toggle =*': [['show-primary-axis','!!?.showPrimaryAxis'], …]`. This is the pattern the ask flagged — it works as documented in [multi-invoke.md](https://github.com/bahrus/assign-gingerly/blob/baseline/docs/multi-invoke.md). |
| `classify` action (`isBar = chartType==='bar'` …) | **merge #2**: `set($.isBar.QMEq).to([[$.chartType,'bar'], true, false])` (equality‑ternary `?=`). No action method needed. |
| `xform.slot` — capture `$slot`, `slotChangeCount` on load, `++` on `slotchange` | **merge #1** captures `slotEl` from `clone`; **merge #1b** primes `slotChangeCount=1`; **compact** `on_slotchange_of_slotEl_inc_slotChangeCount_by: 1`. |
| `propInfo` + `attrName`/`parse` | `withAttrs` (`chart-type`, `show-labels`, …) via the `roundabout` feature. |
| `mainTemplate` / `styles` strings | `root.html` `<template shadowrootmode=open>`. |
| `extractData` action | **Not converted — see GAP 1.** |
| `xform['$ data']` — repeat `<template blow-dry>`, set `--size/--start/--end` | **merge #4**, best‑effort via `builtIns.manageTemplateList` — **see GAP 2 / 3.** |

### Verified working (Playwright smoke test against `demo/dev.html`)

- Both instances upgrade; first imports the template + registers, second is a bare tag.
- `withAttrs` parsing → `chartType`, `showLabels`, … land on the element.
- merge #2 → `isColumn`/`isBar` derived correctly from `chart-type`.
- merge #3 → inner `<table class="charts-css data-spacing-10 column show-labels show-primary-axis show-data-axes">`. Exactly the legacy class set.
- merge #1 → `slotEl` / `tableEl` / `tbodyEl` / `rowTemplate` / `clone` all captured.
- compact → a runtime `appendChild` of a `<table>` bumps `slotChangeCount`.
- No console / page errors.

Net: everything that was declarative in the legacy config is now declarative in
`el-maker.json`. What's left is the imperative core.

---

## Gaps — need your input / a dependency update

### GAP 1 — `extractData` has no home in the code‑free model  ⭐ main blocker

`extractData(self)` is genuinely imperative and can't be a merge:

- reads `slotEl.assignedElements().filter(x => x instanceof HTMLTableElement)`
- pulls `{key, value}` rows out of each table (legacy used `trans-render/asmr/extractData/fromList.js`)
- then per `chartType`:
  - **bar / column**: `max = Math.max(...values)`; `item.scaledVal = value / max`
  - **line / area**: `max = Math.max(...values)`; `item.start = value/max`, `item.end = next.value/max` (last `end = 1`)
  - **pie**: `sum = Σ values`; cumulative `item.start` / `item.end` as fractions of `sum`

`Math.max`, `reduce`, and the running cumulative loop aren't expressible with
assign‑gingerly paths/merges. Options, roughly in order of preference:

1. **New reusable el‑maker feature** — e.g. `tabularDataSource` / `chartScaler`:
   config like `{ from: 'slot', columns: ['key','value'], scale: 'chartType' }`,
   output written to a `data` prop. "Scrape a slotted `<table>` into an array of
   records" is broadly reusable; the per‑chart‑type scaling maybe less so (could
   be a second `computed`‑style feature, or just left to CSS — see GAP 3).
2. **Fall back to a class** (`base.js` extending the resolved `ElementMaker`) that
   supplies `extractData` as a `roundabout` action. `NewCustomElement.md` explicitly
   allows this ("When you need custom runtime behavior beyond the shared features,
   fall back to the class‑based pattern"). Least new infrastructure, but no longer
   "code‑free".
3. **Push scaling into charts.css / CSS** and only extract raw values (see GAP 3).

The `actions:` block is left commented in `el-maker.mjs` as the exact spec of what
still needs wiring. `data` is never populated today, so merge #4 never fires and
no bars render — the table shell + classes are correct but empty.

### GAP 2 — row rendering via `builtIns.manageTemplateList` is unverified

merge #4 wires `'?.tbodyEl =>': { do: 'builtIns.manageTemplateList', … }` per
[manage-template-list.md](https://github.com/bahrus/assign-gingerly/blob/baseline/docs/manage-template-list.md).
Open questions:

- **`instantiate` from a resolved path.** The doc only shows `instantiate:
  'globalThis://templateId'` with a `protocols` resolver. Our `<template
  id=css-charts-row>` lives in the shadow root, not on `globalThis`, so I used
  `instantiate: '?.rowTemplate'` (the captured ref). Does the handler accept an
  already‑resolved `HTMLTemplateElement` there? If not, what's the blessed way to
  point it at a shadow‑DOM template? (`three-peat` sidesteps this but it's an
  enhancement, not an el‑maker feature — would need `<be-hive>` + the host being
  iterable / `🔁-listProp`.)
- **Does a merge's `=>` handler run against `tbodyEl`?** roundabout calls
  `assignFrom(vm, merge.assign, {from: vm})` with `target = vm`. The doc's target
  is the `<tbody>` itself. I'm assuming `'?.tbodyEl =>'` resolves the LHS to the
  element first — needs confirming.

### GAP 3 — setting CSS custom properties (`--size` / `--start` / `--end`)

Legacy set these via trans‑render `ss: '--size'` (inline `style.setProperty`).
In merge #4 I wrote `'?.querySelector?.td?.style?.setProperty?.--size': '?.scaledVal'`
with `withMethods: ['setProperty']`, i.e. "call `td.style.setProperty('--size', …)`".
Unverified — custom properties aren't real `CSSStyleDeclaration` members, so a
plain `'?.style?.--size'` path won't work. If the `setProperty`‑as‑path form isn't
supported, this needs either:

- a small assign‑gingerly helper/handler for CSS custom props, or
- charts.css consuming a regular attribute we *can* set (it doesn't today), or
- moving the value→geometry math into CSS `calc()` and only feeding raw values.

### GAP 4 — initial `slotchange` timing

By the time `templateMaker` hands over `clone`, the declarative shadow DOM's
`<slot>` has usually already fired its first `slotchange`, so the compact misses
it. Worked around with merge #1b (`slotChangeCount = 1` when `slotEl` appears).
If `extractData` instead gates on `ifAllOf: ['slotEl', 'clone']` + one of the
chart‑type flags, `slotChangeCount` can go back to being a pure change‑counter.
Flagging in case there's a canonical el‑maker idiom for "slot ready".

### GAP 5 — is `<tbody itemprop=data>` + an itemscope manager the intended path?

`root.html` keeps `<tbody itemscope itemprop=data>` from the legacy template.
With the new stack, is the expectation that `data` flows through an **itemscope
manager** / `infer: { byItemprop: true }` rather than an explicit
`manageTemplateList` merge? If there's a preferred el‑maker‑native list‑render
story, merge #4 should be rewritten to it.

### GAP 6 — charts.css is inlined (~60 KB) into `root.html`

Matches what `legacy/config.js` did (whole library in the `styles` string) and
keeps the element self‑contained for bare‑import consumers. But it's bulky and
now version‑drifts from the `charts.css` dependency. Would you rather:
`<link rel=stylesheet href="…/node_modules/charts.css/…">` in the shadow root
(needs a resolvable path at the consumer), or a build step that re‑inlines
`node_modules/charts.css/dist/charts.min.css` into `root.html`
(à la `plus-minus`'s `build.mjs`)?

### GAP 7 — `package.json` entry points for a code‑free element

Set `main`/`module`/`exports "."` → `el-maker.json` (that's what consumers load
via the `precede` script). `scratch-box` uses `main: root.mjs` because it
*generates* `root.html`; we hand‑authored `root.html`, so there's no `root.mjs`.
Say the word if you want the generator instead.

### Minor

- `-o="scaledVal start end"` on the legacy `<td>` (trans‑render "observe") has no
  equivalent and isn't needed — reactivity is roundabout's job now.
- `<template blow-dry>` nesting is gone; the row template is a top‑level
  `<template id=css-charts-row>` in the shadow root.
- Left `charts.css` in `dependencies` (not just dev) so the inlined CSS has a
  tracked source of truth even though nothing imports it at runtime.

### Doc suggestion (per the ask)

The `{sa, o}` → multi‑invoke translation is clean and worth adding to
`NewHTMLFirstCustomElement.md`. Minimal recipe that verified here:

```js
// el-maker.mjs — reflect boolean props onto a child as classes
{
  ifAllOf: ['tableEl'],
  ifKeyIn: ['tableEl', 'isBar', 'showLabels', /* … */],
  assign: {
    '?.tableEl?.classList?.toggle =*': [
      ['bar',         '!!?.isBar'],
      ['show-labels', '!!?.showLabels'],
    ],
  },
}
// raConfig.assignOptions.withMethods must include 'toggle'
```

