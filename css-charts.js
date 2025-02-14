// @ts-check
import {Mount} from 'trans-render/Mount.js';
import {config} from './config.js';


/** @import {AllProps, Actions, PAP} from  './ts-refs/css-charts/types' */
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
     * @param {AllProps} self 
     * @returns 
     */
    extractData(self){
        const {$slot} = self;
        const assignedElements = $slot.assignedElements();
        const data = [];
        for(const assignedElement of assignedElements){
            if(!(assignedElement instanceof HTMLTableElement)) continue;
            
            const rows = assignedElement.querySelectorAll('tbody>tr');
            for(const row of rows){
                const item = {
                    [row.querySelector('th')?.textContent?.trim() ?? '']: Number(row.querySelector('data')?.value)
                }
                data.push(item);
            }
        }
        console.log({assignedElements});
        return /** @type {PAP} */ ({
            data
        })
    }

}

await CSSCharts.bootUp();

customElements.define('css-charts', CSSCharts);
