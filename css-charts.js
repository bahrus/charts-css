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
        const {$slot, chartType} = self;
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
        switch(chartType){
            case 'bar':
            case 'column':
                data.forEach(x => x.scaledVal = x.value / max);
                break;
            case 'area':
            case 'pie':
                let start = 0;
                for(const item of data){
                    const end = start + item.value / max;
                    item.start = start;
                    item.end = end;
                    start = end;
                }
                break;
        }
        
        console.log({data});
        return /** @type {PAP} */ ({
            data
        });
    }

    /**
     * 
     * @param {AllProps} self 
     */
    classify(self){
        const {chartType} = self;
        return /** @type {PAP} */ ({
            isArea: chartType === 'area',
            isBar: chartType === 'bar',
            isPie: chartType === 'pie',
            isColumn: chartType === 'column'
        })
    }
}

await CSSCharts.bootUp();

customElements.define('css-charts', CSSCharts);
