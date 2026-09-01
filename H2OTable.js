// @ts-check

/** @import {DataRecord} from './types/h2o-table/types' */
/** @import {DataItem, RuntimeProps} from './types' */

// Local dev: the generic base lives in the checked-out `el-maker/` clone, mapped
// by imports.html (`"el-maker/": "/el-maker/"`). Once h2o-table is published this
// becomes a bare specifier, e.g. `import { H2OTable } from 'h2o-table/H2OTable.js'`.
import { H2OTable } from 'el-maker/h2o-table/H2OTable.js';

/**
 * `css-charts`' flavour of the `h2o-table` feature. The generic base scrapes
 * `{ key, value }` rows out of the slotted `<table>`; this subclass adds the
 * charts.css geometry columns the legacy `extractData` action used to compute —
 * `scaledVal` (bar / column), `start` + `end` (line / area / pie) — the exact
 * calculation depending on the host's `chart-type`.
 *
 * Injected via el-maker.json:
 * ```json
 * "h2oTable": { "spawn": "css-charts/H2OTable.js", "customData": { "itemprops": ["key", "value"] } }
 * ```
 *
 * @extends {H2OTable}
 */
export default class CSSChartsH2OTable extends H2OTable {
    /**
     * @param {DataRecord[]} rows - scraped `{ key, value }` records, one per `[itemscope]`
     * @returns {DataItem[]} rows with `scaledVal` / `start` / `end` filled in for the current `chartType`
     * @override
     */
    massageData(rows) {
        const host = /** @type {RuntimeProps} */ (/** @type {any} */ (this.hostElement));
        const { chartType } = host;

        /** @type {DataItem[]} */
        const data = rows.map(r => ({
            key: String(r.key ?? ''),
            value: Number(r.value),
            scaledVal: 0,
            start: 0,
            end: 0,
        }));

        if (data.length === 0) return data;

        switch (chartType) {
            case 'bar':
            case 'column': {
                const max = Math.max(...data.map(d => d.value));
                for (const d of data) d.scaledVal = max === 0 ? 0 : d.value / max;
                break;
            }
            case 'line':
            case 'area': {
                const max = Math.max(...data.map(d => d.value));
                data.forEach((d, idx) => {
                    d.start = max === 0 ? 0 : d.value / max;
                    d.end = idx === data.length - 1
                        ? 1
                        : (max === 0 ? 0 : data[idx + 1].value / max);
                });
                break;
            }
            case 'pie': {
                const sum = data.reduce((acc, d) => acc + d.value, 0);
                let start = 0;
                for (const d of data) {
                    d.start = start;
                    d.end = sum === 0 ? start : start + d.value / sum;
                    start = d.end;
                }
                break;
            }
        }

        return data;
    }
}
