// @ts-check
import {Mount} from 'trans-render/Mount.js';
import {config} from './config.js';


/** @import {AllProps, Actions} from  './ts-refs/css-charts/types' */
/** @import {MntCfg, MountProps, MountActions, ITransformer} from './ts-refs/trans-render/types' */


/**
 * @implements {Actions}
 */
export class CSSCharts extends Mount {

    /**
     * @type {MntCfg<AllProps  & MountProps, Actions & MountActions>}
     */
    static config = config;

    /**
     * 
     * @param {ITransformer<AllProps>} transformer 
     * @param {Event} evt 
     */
    handleSlotChange(evt, transformer){
        transformer.model.slotChangeCount++;
        console.log({self, evt});
    }

}

await CSSCharts.bootUp();

customElements.define('css-charts', CSSCharts);
