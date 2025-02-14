// @ts-check
import {Mount} from 'trans-render/Mount.js';
import {config} from './config.js';

/** @import {AllProps, Actions} from  './ts-refs/css-charts/types' */
/** @import {MntCfg, MountProps, MountActions} from './ts-refs/trans-render/types' */


/**
 * @implements {Actions}
 */
export class CSSCharts extends Mount {

    /**
     * @type {MntCfg<AllProps  & MountProps, Actions & MountActions>}
     */
    static config = config;

}

await CSSCharts.bootUp();

customElements.define('css-charts', CSSCharts);
