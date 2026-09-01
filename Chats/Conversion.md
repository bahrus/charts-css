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

## Bruce's Response I

To address Gap 1, I've started adding a new custom element feature - h2o-table, which stands for HTML 2 Object Table. I created the [H2OTable.js](../el-maker/h2o-table/H2OTable.js) and a [type file](../el-maker/h2o-table/types/h2o-table/types.d.ts) file.  Can you please fill out the types file, and edit H2OTable.js so as much typing is applied, and the existing code is typed correctly?

### AI Response II

Done — `tsc --checkJs --strict` is clean for `H2OTable.js`, `extractData.js`, and the types file.

- **[`types/h2o-table/types.d.ts`](../el-maker/h2o-table/types/h2o-table/types.d.ts)** — re-exports `FeatureSpawnContext` from `../assign-gingerly/types` (same as `id-referencer`); adds `DataRecord` (`Record<string, any>` — one scraped row), `IH2OTable` (`readonly data: DataRecord[]`), `H2OTableProps`, `AllProps` (`hostRef` + `itemprops`), `AP` / `PAP`. `CustomData` kept as `{ itemprops: string[] }`.
- **[`H2OTable.js`](../el-maker/h2o-table/H2OTable.js)** — added the `/** @import … */` line (this is what fixed the `Cannot find name 'FeatureSpawnContext' / 'H2OTableProps'` errors); `@implements {IH2OTable}`; typed `hostElement` (`@returns {HTMLElement}` + `@throws {number} 404`), `data` (`@returns {DataRecord[]}`), and `#itemprops`. Constructor now reads config defensively — `const customData = ctx?.injection?.customData ?? {}` typed as `CustomData`, `this.#itemprops = customData.itemprops ?? []` — matching the `IdRefs` idiom (the old `const {itemprops} = customData` threw when `customData` was absent). `initVals` renamed `_initVals` (feature has no writable state; silences unused-param).
- **[`extractData.js`](../el-maker/h2o-table/extractData.js)** — typed `@returns {DataRecord[]}`, annotated the `data` / `item` locals, and cast the `.enh` access (`assign-gingerly/object-extension.js` adds `.enh` at runtime but publishes no `Element` augmentation).

**Still open (not in scope of this ask, flagging for wiring):**

1. `h2o-table` only does the *HTML → objects* half. The legacy `extractData` also computed `scaledVal` / `start` / `end` per `chartType` (`Math.max`, cumulative sums). `css-charts` still needs that scaling somewhere — a second feature, a `calc()`-based charts.css approach, or a small host method.
2. `css-charts`'s [`el-maker.mjs`](../el-maker.mjs) isn't wired to the feature yet — needs `assignFeatures.h2oTable: { customData: { itemprops: ['key','value'] } }` plus a merge/positraction that pushes `el.h2oTable.data` (recomputed on `slotChangeCount`) into the `data` prop that merge #4 consumes.
3. `H2OTable` reads on demand (`get data()` re-scrapes) but emits no change signal — roundabout needs something to react to. Either the host re-pulls on `slotchange`, or the feature should fire a propagator event.

## Bruce's Response II

Good point about h2o-table only doing half of what is needed.

Let me ask your opinion on what I'm thinking we do to implement the rest of what he legacy extractData does:

"Pencil in" a dependency injection of a more feature rich h2o-table that is defined within this package, that:

1.  Inherits from the more limited but generic el-maker/h2o-table/H2OTable.js.
2.  Computes `scaledVal` / `start` / `end` per `chartType` (`Math.max`, cumulative sums). 

By "Penciled in" I mean that el-maker.mjs looks like:

```JS
/** @type {ElMakerConfig<AP>} */
const features = {
    assignFeatures: {
        roundabout: {
            customData: { raConfig },
            withAttrs,
        },
        templateMaker: {},
        h2oTable: {
            spawn: 'css-charts/H2OTable.js',
            customData: {
                itemprops: ['key', 'value']
            }
        }

    },
};
```

Ideally, the superclass H2OTable.js would only override public API  properties /  methods consumed by the wiring of css-chart's el-maker.mjs, but this isn't a hard and fast rule.

Do you think this could work?

### AI Response III

Yes — the mechanism is sound and I verified it against the installed `assign-gingerly@0.0.91` / `el-maker@0.0.26`. Five notes:

**1. String `spawn` + override — confirmed.** `assignFeatures.js` uses `featureConfig.spawn` when present and only falls back to `supportedFeatures.h2oTable.fallbackSpawn` when `spawn === undefined`, so your injection wins. A string spawn is resolved by `findClassPrototypeInPath()`, which `import()`s the module (bare specifier → the page's import map, so `'css-charts/H2OTable.js'` → `/H2OTable.js`) and returns `module.default` first, then the first class-valued named export. `el-maker.json` stays pure JSON (just the string). `scratch-box`'s `features.mjs` already pencils in the identical shape (`//spawn: 'font-face-feature/FontFaceFeature.js'`).
  - Use `export default class extends H2OTable { … }` — default is checked first, so no export-name ambiguity.
  - String spawns pass through an allow-policy (`isAllowedImportPath`). Worth a quick check that the resolved `/H2OTable.js` is allowed (same-origin + import-map specifiers normally are).

**2. Subclassing works, but the base's `#hostRef` / `#itemprops` are `#private`** — invisible to a subclass. That's fine for the scaling job, which only needs the two public getters:

```js
export default class CSSChartsH2OTable extends H2OTable {
    get data() {
        const rows = super.data;                        // [{key, value}, …]
        const { chartType } = /** @type {any} */ (this.hostElement);
        return scale(rows, chartType);                   // + scaledVal / start / end
    }
}
```

No constructor needed (it inherits `(host, ctx, initVals)` and reads `customData.itemprops`). If the subclass ever needs `itemprops`, add a `get itemprops()` to the base — that makes "override only the public API" actually hold.

**3. This fixes *correctness*, not *reactivity*.** `get data()` re-scrapes per read but emits no signal. `css-charts`'s `el-maker.mjs` still needs a merge that pulls it (note `chartType` in the gate — the scaling depends on it):

```js
{ ifKeyIn: ['slotChangeCount', 'chartType'], ifAllOf: ['slotEl'],
  assign: { data: '?.h2oTable?.data' } }   // el.h2oTable is the feature instance on the host
```

Then merge #4 renders off `data` as designed.

**4. Packaging.** Published `el-maker@0.0.26` doesn't ship `h2o-table/` and its `exports` only expose `def.js` + `ElementMaker.js`; the `h2oTable` catalog entry and folder exist only in your local `el-maker/` clone. It resolves today purely because `imports.html` maps `el-maker/ → /el-maker/`. For a release the base has to land where consumers can import it — `h2o-table` as its own package (its `package.json` `name` says that's the intent): `import { H2OTable } from 'h2o-table/H2OTable.js'` + a `h2o-table` dependency. Fine to pencil in now; the specifier will change.

**5. Typing is clean.** The subclass `get data()` can return `css-charts`'s stricter `DataItem[]`; the base's `DataRecord[]` (`Record<string, any>[]`) accepts it and TS permits a getter override to narrow. Keep `scale()` in its own file; leave `extractData.js` generic.

Bottom line: DI-by-string-path + a thin subclass is exactly what `spawn` is for, and it keeps `el-maker.json` serializable. The only real new code is `scale()` and that one pull-merge.

## Bruce's Response III

A few comments:

It is fully understood that once we finish this exercise, I will move the local el-maker folder out of this project, and publish it, and update the dependency in css-charts and revert the imports.html to point to node_modules.

I like your suggestion about exposing a get itemprops() if needed.

If it makes sense for the get data() in the base class to call out to an empty method like "massageData()" that css-chart's H2OTable implements / overrides, by all means go ahead and do so.

Please proceed with implementing this to the best of your abilities, and if you get stuck somewhere, just flag how far you got and I will think further about next steps (this is pioneer new things we haven't done yet).  Add your implementation notes / remaining gaps below.

### AI Response IV

**It's fully working.** All five chart types render end-to-end from a Playwright smoke test of `demo/{dev,bar,column,line,area,pie}.html` — 5 rows each, correct charts.css classes, correct geometry, zero console/page errors. The whole pipeline is now declarative + feature-driven:

```
attributes → withAttrs → merge#2 classify → merge#3 class-toggle
slotted <table> → h2oTable feature (spawn: 'css-charts/H2OTable.js')
              → CSSChartsH2OTable.massageData()  (Math.max / cumulative sums per chartType)
              → merge#3b pulls  data ⇐ '?.h2oTable?.data'
              → merge#4 manageTemplateList → <tr> per row, <td style="--size:…;--start:…;--end:…">
```

Verified numbers match legacy exactly: bar/column `scaledVal = value/max` (0.2…1); line/area `start=value/max`, `end=next/max`, last `end=1`; pie cumulative fractions of sum (0→0.0667→0.2→0.4→0.667→1).

#### What I implemented

| File | Change |
|---|---|
| [`el-maker/h2o-table/H2OTable.js`](../el-maker/h2o-table/H2OTable.js) | Added `get itemprops()` and the `massageData(data)` identity hook; `get data()` now returns `this.massageData(extractData(…))`. Fully typed. |
| [`el-maker/h2o-table/extractData.js`](../el-maker/h2o-table/extractData.js) | **Bug fix** — it read `inferencer.value` (an `Infer` *write* slot, always `undefined`), so every row came back `{}`. Switched to `itemProp[inferValueProperty(itemProp)]`, which actually reads `textContent` / `value` / `dateTime` / … Dropped the now-unneeded `object-extension.js` + `.enh` dance. |
| [`el-maker/h2o-table/types/h2o-table/types.d.ts`](../el-maker/h2o-table/types/h2o-table/types.d.ts) | `IH2OTable` gains `readonly itemprops` + `massageData(data): DataRecord[]`. |
| [`H2OTable.js`](../H2OTable.js) *(new, package root)* | `export default class CSSChartsH2OTable extends H2OTable` — overrides `massageData` with the per-`chartType` scaling ported from `legacy/css-charts.js`. Reads `chartType` off `this.hostElement`. Coerces `value` with `Number()`, guards `max`/`sum` of 0. Typed against `./types` + the base's `DataRecord`. |
| [`el-maker.mjs`](../el-maker.mjs) | `assignFeatures.h2oTable: { spawn: 'css-charts/H2OTable.js', customData: { itemprops: ['key','value'] } }`; new **merge 3b** (`data ⇐ '?.h2oTable?.data'`, gated `ifKeyIn: ['slotChangeCount','chartType']`); merge 4 rewritten (see bugs below); `props` map + `assignOptions.handlers` added. |
| [`types.d.ts`](../types.d.ts) | `AllProps.h2oTable: IH2OTable`; `Actions` now empty; doc-comment refresh. |
| [`types/el-maker/types.d.ts`](../types/el-maker/types.d.ts) | Added `h2oTable?` to `ElMakerConfig.assignFeatures`. |
| [`types/assign-gingerly/types.d.ts`](../types/assign-gingerly/types.d.ts) | Added `handlers?` to `IAssignGingerlyOptions` (roundabout forwards `assignOptions` into `assignFrom`, which honors it). |

`tsc --checkJs --strict` is clean on all of the above.

#### Two upstream `assign-gingerly@0.0.91` bugs found + worked around

1. **`do: 'builtIns.manageTemplateList'` is unloadable.** `processHandlerCommands.js`'s `BUILT_IN_MAP` uses paths relative to *that* file (`'./handlers/manageTemplateList.js'`), but the actual `import()` runs inside `utils/findClassPrototypeInPath.js`, so it resolves to `…/assign-gingerly/utils/handlers/manageTemplateList.js` → **404**. Every `builtIns.*` handler is affected the same way. **Workaround:** register it by bare specifier in `assignOptions.handlers` (`{ manageTemplateList: 'assign-gingerly/handlers/manageTemplateList.js' }`) and reference `do: 'manageTemplateList'` — the bare specifier goes through the import map, no `utils/` rebasing. Real fix belongs in assign-gingerly (make `BUILT_IN_MAP` paths absolute, or `import.meta.resolve` them from `processHandlerCommands.js`).

2. **CSS custom properties can't be set via a `style.setProperty` path.** `'?.…?.style?.setProperty?.--size': '?.scaledVal'` calls `setProperty('--size')` with **one** arg (the RHS value isn't threaded in as arg 2) → `TypeError: 2 arguments required`. **Workaround:** write the whole declaration through `style.cssText` with the `=&` join op:
   `'?.querySelector?.td?.style?.cssText =&': { join: ['--size:', '?.scaledVal', ';--start:', '?.start', ';--end:', '?.end'] }`.
   Works, but clobbers any pre-existing inline style on the `<td>` (none in our template). A first-class "set CSS var" path form or handler would be nicer.

#### Confirmed working (were open questions in GAP 2 / 3)

- **String `spawn` to a package-local file** resolves and overrides the catalog `fallbackSpawn` — exactly as predicted. `el.h2oTable` is a `CSSChartsH2OTable`.
- **`instantiate: '?.rowTemplate'`** (a captured shadow-DOM `<template>` ref, not a `globalThis://` protocol string) works fine with `manageTemplateList`.
- **`'?.tbodyEl =>'`** — a merge `=>` handler key does resolve its LHS to the element before running.
- **merge `=&` join op** works inside `manageTemplateList`'s per-item `assignFrom`.

#### Remaining gaps / notes

- **Reactivity on `chart-type` change.** merge 3b is gated `ifKeyIn: ['slotChangeCount','chartType']`, so flipping `chart-type` at runtime re-pulls + re-scales `data`, and `manageTemplateList` reconciles in place (keyed by `?.key`). Not stress-tested beyond the initial render + the earlier `appendChild` slotchange test — worth a dedicated test.
- **`h2oTable.data` fires no change event.** Still true; we sidestep it by having merge 3b re-pull on `slotChangeCount` / `chartType`. If some *other* light-DOM mutation (e.g. editing a `<data value>` in place) needs to reflect, there's no trigger. A propagator event from the feature, or a `MutationObserver`, would close that.
- **`extractData.js` reads string values.** `<data value="20">.value` is `"20"`; `CSSChartsH2OTable` does `Number(...)`. If h2o-table is meant to return typed values, the coercion belongs in the base (the inferencer knows `valueAsNumber` for `<input type=number>` but `<data>` only exposes string `value`).
- **Packaging** (unchanged from Response III): `H2OTable.js` imports the base via `./el-maker/h2o-table/H2OTable.js` (local clone, dev-only). Becomes a bare `h2o-table/…` specifier on publish.
- **Submodule edits.** `types/el-maker/types.d.ts`, `types/assign-gingerly/types.d.ts`, and everything under `el-maker/h2o-table/` are modifications inside submodules — they'll need committing in their own repos.
- charts.css inlining (GAP 6) and `package.json` entry points (GAP 7) still open — cosmetic, your call.

