// @ts-check
import {Mount} from 'trans-render/Mount.js';
import {config} from './config.js';


/** @import {AllProps, Actions, PAP, DataItem} from  './ts-refs/css-charts/types' */
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
    async extractData(self){
        const {$slot} = self;
        const assignedElements = $slot.assignedElements().filter(x => x instanceof HTMLTableElement);
        /**
         * @type {Array<DataItem>}
         */
        const data = [];
        const {fromList} = await import('trans-render/asmr/extractData/fromList.js');
        for(const assignedElement of assignedElements){
            const items = await fromList(assignedElement, ['key', 'value'])
            data.push(...items);
        }
        const max = Math.max(...data.map(item => item.value));
        data.forEach(x => x.scaledVal = x.value / max);
        console.log({data});
        return /** @type {PAP} */ ({
            data
        })
    }

    /**
     * @param {AllProps} self
     * @returns 
     */
    buildTable(self){
        const {data} = self;
        //const max = Math.max(...data.map(item => item.value));
        //console.log({max});
        const html = String.raw `
<table class="charts-css bar show-labels show-primary-axis show-data-axes data-spacing-10">
    <tbody>
        ${data.map(item => 
            String.raw `
            <tr>
                <th scope="row"> ${item.key} </th>
                <td class="bar" style="--size: ${item.scaledVal};"></td>
            </tr>
            `
        ).join('')}
    </tbody>
</table>
        `;
        const target = this.shadowRoot?.querySelector('#table-target');
        if(!target) return ({});
        target.innerHTML = html;
        return /** @type {PAP} */ ({

        })
    }

}

await CSSCharts.bootUp();

customElements.define('css-charts', CSSCharts);
