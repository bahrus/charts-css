import { ITransformer } from "../trans-render/types";

export interface EndUserProps {
    chartType: 'area' | 'bar' | 'column' | 'line' | 'pie',
    showLabels: boolean,
    showPrimaryAxis: boolean,
    showDataAxes: boolean,
    hideData: boolean,
    show2SecondaryAxes: boolean,
}

export interface AllProps extends EndUserProps{
    $slot: HTMLSlotElement,
    slotChangeCount: number,
    data: Array<DataItem>,
    isArea: boolean,
    isBar: boolean,
    isColumn: boolean,
    isLine: boolean,
    isPie: boolean,
}

export interface DataItem {
    key: string, 
    value: number, 
    scaledVal: number,
    start: number,
    end: number,
}

export type PAP = Partial<AllProps>;

export type ProPAP = Promise<PAP>;

export interface Actions {
    extractData(self: AllProps): ProPAP;
    classify(self: AllProps): PAP;
}