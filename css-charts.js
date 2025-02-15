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
            
            const itemScopes = assignedElement.querySelectorAll('itemscope');
            for(const row of itemScopes){
                const item = {
                    key: row.querySelector('[itemprop="key"]')?.textContent?.trim() ?? '',
                    value: Number( /** @type {HTMLDataElement} **/(row.querySelector('data[itemprop="value"]'))?.value),
                };
                data.push(item);
            }
        }
        console.log({assignedElements});
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
        const max = Math.max(...data.map(item => item.value));
        console.log({max});
        const html = String.raw `
<table class="charts-css bar show-labels show-primary-axis show-data-axes data-spacing-10">
    <caption> Bar Example #13 </caption>
    <thead>
      <tr>
        <th scope="col"> Year </th>
        <th scope="col"> Progress </th>
      </tr>
    </thead>
    <tbody>
        ${data.map(item => 
            String.raw `
            <tr>
                <th scope="row"> ${item.key} </th>
                <td class="bar" style="--size: ${item.value / max};"></td>
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
