//@ts-check

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { akaMethods as m } from 'assign-gingerly/DX/emojis.js';
import { paths, doAssign, set, smoothOver } from 'assign-gingerly/DX/paths.js';

/** @import { EndUserProps, AP, Actions, RuntimeProps } from './types'; */
/** @import { RoundaboutOptions, Merges } from './types/roundabout/types' */
/** @import { ElMakerConfig } from './types/el-maker/types' */
/** @import { AttrPatterns } from './types/assign-gingerly/types.js' */

// querySelector — used to pluck live nodes out of the cloned shadow fragment.
const withMethods = [m['🔍']];

/**
 * Centralised property-name map so a rename is a one-line change and stays
 * type-checked against AP.
 * @type {{ [K in keyof AP]: K }}
 */
const props = {
    chartType: 'chartType',
    showLabels: 'showLabels',
    showPrimaryAxis: 'showPrimaryAxis',
    showDataAxes: 'showDataAxes',
    hideData: 'hideData',
    show2SecondaryAxes: 'show2SecondaryAxes',
    clone: 'clone',
    slotEl: 'slotEl',
    tableEl: 'tableEl',
    tbodyEl: 'tbodyEl',
    rowTemplate: 'rowTemplate',
    slotChangeCount: 'slotChangeCount',
    data: 'data',
    h2oTable: 'h2oTable',
    isArea: 'isArea',
    isBar: 'isBar',
    isColumn: 'isColumn',
    isLine: 'isLine',
    isPie: 'isPie',
};

const $ = (/** @type {typeof paths<RuntimeProps>} */ (/** @type {any} */(paths)))({ withMethods });

// Kept separate from smoothOver() so the proxy chains stay type-checked.
/** @type {Merges<AP>} */
const merges = [
    // 1. Capture live references to shadow-DOM nodes from the cloned template
    //    (the `clone` prop is supplied by the templateMaker feature).
    {
        ifAllOf: [props.clone],
        ...doAssign(
            set($.slotEl).to($.clone.querySelector('slot')),
            set($.tableEl).to($.clone.querySelector('table')),
            set($.tbodyEl).to($.clone.querySelector('tbody')),
            set($.rowTemplate).to($.clone.querySelector('#css-charts-row')),
        ),
    },

    // 1b. Prime the slot-change counter once the <slot> reference exists.
    //     The declarative shadow DOM is already populated by the time
    //     templateMaker hands us `clone`, so the initial `slotchange` has
    //     usually already fired — mirrors the legacy `{on:'load', s:'slotChangeCount', to:1}`.
    {
        ifKeyIn: [props.slotEl],
        assign: {
            [props.slotChangeCount]: 1,
        },
    },

    // 2. classify(): derive the per-chart-type booleans from `chartType`.
    //    Replaces the legacy `classify` action with equality-ternary assigns.
    {
        ifKeyIn: [props.chartType],
        ...doAssign(
            set($.isArea.QMEq).to([[$.chartType, 'area'], true, false]),
            set($.isBar.QMEq).to([[$.chartType, 'bar'], true, false]),
            set($.isColumn.QMEq).to([[$.chartType, 'column'], true, false]),
            set($.isLine.QMEq).to([[$.chartType, 'line'], true, false]),
            set($.isPie.QMEq).to([[$.chartType, 'pie'], true, false]),
        ),
    },

    // 3. Reflect boolean state onto the inner <table> as charts.css classes.
    //    Replaces the legacy `{sa: '.x', o: 'prop'}` transforms with the
    //    assign-gingerly multi-invoke (`=*`) operator:
    //    https://github.com/bahrus/assign-gingerly/blob/baseline/docs/multi-invoke.md
    //    `!!` makes each toggle idempotent (missing source => class removed).
    {
        ifAllOf: [props.tableEl],
        ifKeyIn: [
            props.tableEl,
            props.isArea, props.isBar, props.isColumn, props.isLine, props.isPie,
            props.showLabels, props.showPrimaryAxis, props.showDataAxes,
            props.hideData, props.show2SecondaryAxes,
        ],
        assign: {
            '?.tableEl?.classList?.toggle =*': [
                ['area', '!!?.isArea'],
                ['bar', '!!?.isBar'],
                ['column', '!!?.isColumn'],
                ['line', '!!?.isLine'],
                ['pie', '!!?.isPie'],
                ['show-labels', '!!?.showLabels'],
                ['show-primary-axis', '!!?.showPrimaryAxis'],
                ['show-data-axes', '!!?.showDataAxes'],
                ['hide-data', '!!?.hideData'],
                ['show-2-secondary-axes', '!!?.show2SecondaryAxes'],
            ],
        },
    },

    // 3b. Pull the scraped + scaled rows out of the `h2oTable` feature into the
    //     `data` prop. `h2oTable.data` re-scrapes and re-runs CSSChartsH2OTable's
    //     `massageData()` on every read, so anything that changes the source or
    //     the scaling (`slotchange` bumps `slotChangeCount`; `chartType` changes
    //     the geometry) has to re-trigger this pull. Replaces the legacy
    //     `extractData` action.
    {
        ifKeyIn: [props.slotChangeCount, props.chartType],
        ifAllOf: [props.slotEl],
        assign: {
            [props.data]: '?.h2oTable?.data',
        },
    },

    // 4. Render one <tr> per `data` item into <tbody> and stamp the charts.css
    //    CSS custom properties on each <td>, via manageTemplateList.
    //    NB: `do: 'builtIns.manageTemplateList'` is broken in assign-gingerly@0.0.91
    //    (relative path in processHandlerCommands' BUILT_IN_MAP is re-based from
    //    utils/ by findClassPrototypeInPath → 404 on utils/handlers/…). Work
    //    around it by registering the handler by bare specifier in
    //    assignOptions.handlers and referencing that key here. See Conversion.md GAP 2.
    {
        ifKeyIn: [props.data],
        ifAllOf: [props.tbodyEl, props.rowTemplate],
        assign: {
            '?.tbodyEl =>': {
                do: 'manageTemplateList',
                resolve: {
                    forEach: '?.data',
                    instantiate: '?.rowTemplate',
                },
                fromEachItem: {
                    toClone: {
                        '?.querySelector?.th?.textContent': '?.key',
                        // CSS custom properties can't be set via a `style.setProperty`
                        // path (the RHS value isn't threaded in as arg 2 — it throws
                        // "2 arguments required"). Write the whole declaration block
                        // through `style.cssText` with the `=&` join op instead.
                        '?.querySelector?.td?.style?.cssText =&': {
                            join: ['--size:', '?.scaledVal', ';--start:', '?.start', ';--end:', '?.end'],
                        },
                    },
                    withOptions: { withMethods: ['querySelector'] },
                    resolve: { key: '?.key' },
                },
            },
        },
    },
];

/**
 * @type {RoundaboutOptions<AP, Actions, AP, 'slotchange'>}
 */
const raConfig = {
    weakRef: {
        properties: [props.slotEl, props.tableEl, props.tbodyEl, props.rowTemplate],
        logIfCollected: 'warn',
    },
    assignOptions: {
        akaMethods: {
            '🔍': m['🔍'],
        },
        withMethods: ['querySelector', 'toggle', 'setProperty'],
        // See merge #4 — bare-specifier route around the broken `builtIns.` loader.
        handlers: {
            manageTemplateList: 'assign-gingerly/handlers/manageTemplateList.js',
        },
    },
    compacts: {
        // Replaces the legacy slot xform: bump the counter on every slotchange
        // so data extraction can re-run.
        on_slotchange_of_slotEl_inc_slotChangeCount_by: 1,
    },
    // The legacy `extractData` action (Math.max / cumulative sums / per-chart-type
    // branching over the slotted <table>) now lives in the `h2oTable` feature —
    // generic scraping in el-maker/h2o-table, css-charts' scaling in
    // ./H2OTable.js (CSSChartsH2OTable#massageData). Merge 3b pulls its output.
    merges: smoothOver(merges),
    defaultPropVals: {
        [props.chartType]: 'bar',
        [props.showLabels]: false,
        [props.showPrimaryAxis]: false,
        [props.showDataAxes]: false,
        [props.hideData]: false,
        [props.show2SecondaryAxes]: false,
        [props.slotChangeCount]: 0,
    },
};

/** @type {AttrPatterns<AP>} */
const withAttrs = {
    [props.chartType]: 'chart-type',
    [`_${props.chartType}`]: { valIfNull: 'bar', mapsTo: props.chartType },
    [props.showLabels]: 'show-labels',
    [`_${props.showLabels}`]: { instanceOf: 'Boolean', mapsTo: props.showLabels },
    [props.showPrimaryAxis]: 'show-primary-axis',
    [`_${props.showPrimaryAxis}`]: { instanceOf: 'Boolean', mapsTo: props.showPrimaryAxis },
    [props.showDataAxes]: 'show-data-axes',
    [`_${props.showDataAxes}`]: { instanceOf: 'Boolean', mapsTo: props.showDataAxes },
    [props.hideData]: 'hide-data',
    [`_${props.hideData}`]: { instanceOf: 'Boolean', mapsTo: props.hideData },
    [props.show2SecondaryAxes]: 'show-2-secondary-axes',
    [`_${props.show2SecondaryAxes}`]: { instanceOf: 'Boolean', mapsTo: props.show2SecondaryAxes },
};

/** @type {ElMakerConfig<AP>} */
const features = {
    assignFeatures: {
        roundabout: {
            customData: { raConfig },
            withAttrs,
        },
        templateMaker: {},
        // Overrides el-maker's generic h2oTable fallbackSpawn with the
        // package-local subclass that adds charts.css scaling (./H2OTable.js →
        // CSSChartsH2OTable#massageData). `spawn` is a string so el-maker.json
        // stays JSON-serializable; it resolves through the page's import map
        // (`"css-charts/": "/"`).
        h2oTable: {
            spawn: 'css-charts/H2OTable.js',
            customData: {
                itemprops: ['key', 'value'],
            },
        },
    },
};

export function render() {
    return JSON.stringify(features, null, 4);
}

const __filename = fileURLToPath(import.meta.url);
const outputFile = __filename.replace(/\.mjs$/, '.json');
writeFileSync(outputFile, render(), 'utf8');
