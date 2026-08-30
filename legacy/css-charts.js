// @ts-check
import {Mount} from 'trans-render/Mount.js';
import {config} from './config.js';


/** @import {AllProps, Actions, PAP, DataItem} from  './ts-refs/css-charts/types' */
/** @import {MntCfg, MountProps, MountActions, ITransformer} from './ts-refs/trans-render/types' */


/**
 * @implements {Actions}
 */
class CSSCharts extends Mount {

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
        let data = [];
        const {fromList} = await import('trans-render/asmr/extractData/fromList.js');
        for(const assignedElement of assignedElements){

            const items = /** @type {Array<DataItem>} */ (fromList(assignedElement, ['key', 'value']));
            data = [...data, ...items];
        }
        
        switch(chartType){
            case 'bar':
            case 'column':{
                const max = Math.max(...data.map(item => item.value));
                data.forEach(x => x.scaledVal = x.value / max);
            }
                break;
            case 'line':
            case 'area':{
                let last = 0;
                const max = Math.max(...data.map(item => item.value));
                for(const [idx, item] of data.entries()){
                    item.start = item.value / max;
                    if(idx === data.length - 1){
                        item.end = 1;
                    }
                    else{
                        item.end = data[idx + 1].value / max;
                    }
                }
                break;
            }
            case 'pie':
                //TODO logic might not be correct for area, line
                const sum = data.reduce((acc, item) => acc + item.value, 0);
                console.log({sum});
                let start = 0;
                for(const item of data){
                    item.start = start;
                    const end = start + item.value / sum;
                    item.end = end;
                    start = end;
                    //last = item.value;
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
            isColumn: chartType === 'column',
            isLine: chartType === 'line',
            isPie: chartType === 'pie',
        });
    }
}

await CSSCharts.bootUp();

export {CSSCharts};

