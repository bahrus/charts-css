import {SimpleWCInfo} from './types/wc-info/SimpleWCInfo';
import {IH2OTable} from './el-maker/h2o-table/types/h2o-table/types';

/**
 * The public, author-facing API of <css-charts>.
 * Every one of these is sourced from an attribute (see `withAttrs` in el-maker.mjs).
 */
export interface EndUserProps {
    /**
     * Which charts.css layout to apply to the generated <table>.
     * Sourced from the `chart-type` attribute; defaults to `bar`.
     */
    chartType: 'area' | 'bar' | 'column' | 'line' | 'pie',
    /** Mirrors charts.css `.show-labels`. Attribute: `show-labels`. */
    showLabels: boolean,
    /** Mirrors charts.css `.show-primary-axis`. Attribute: `show-primary-axis`. */
    showPrimaryAxis: boolean,
    /** Mirrors charts.css `.show-data-axes`. Attribute: `show-data-axes`. */
    showDataAxes: boolean,
    /** Mirrors charts.css `.hide-data`. Attribute: `hide-data`. */
    hideData: boolean,
    /** Mirrors charts.css `.show-2-secondary-axes`. Attribute: `show-2-secondary-axes`. */
    show2SecondaryAxes: boolean,
}

/**
 * Full view-model: public props plus the internal/derived state the
 * roundabout config reads and writes.
 */
export interface AllProps extends EndUserProps {
    /** DocumentFragment handed over by the `templateMaker` feature. */
    clone: DocumentFragment,
    /** The <slot> inside the shadow root (light-DOM <table>s land here). */
    slotEl: HTMLSlotElement,
    /** The generated `.charts-css` <table>. */
    tableEl: HTMLTableElement,
    /** The <tbody itemprop=data> that repeated rows are rendered into. */
    tbodyEl: HTMLTableSectionElement,
    /** The <template id=css-charts-row> cloned once per data item. */
    rowTemplate: HTMLTemplateElement,
    /** Bumped on every `slotchange`; re-triggers the pull of `h2oTable.data`. */
    slotChangeCount: number,
    /**
     * Rows scraped from the slotted `<table>`(s) by the `h2oTable` feature, with
     * the charts.css geometry columns (`scaledVal` / `start` / `end`) added per
     * `chartType`. Pulled from `h2oTable.data` by a merge; rendered by merge #4.
     */
    data: Array<DataItem>,
    /**
     * The `h2oTable` custom-element feature instance (`CSSChartsH2OTable`).
     * Its `data` getter re-scrapes + re-scales on every read.
     */
    h2oTable: IH2OTable,
    isArea: boolean,
    isBar: boolean,
    isColumn: boolean,
    isLine: boolean,
    isPie: boolean,
}

export interface DataItem {
    key: string,
    value: number,
    /** bar / column: value / max. */
    scaledVal: number,
    /** line / area / pie: fractional start of this datum. */
    start: number,
    /** line / area / pie: fractional end of this datum. */
    end: number,
}

export type AP = AllProps;
export type PAP = Partial<AllProps>;
export type ProPAP = Promise<PAP>;

export interface RuntimeProps extends AllProps, HTMLElement {}

/**
 * No roundabout action methods — every legacy action is now either a declarative
 * merge (`classify`) or the `h2oTable` feature (`extractData`, via the
 * `CSSChartsH2OTable` subclass's `massageData` override).
 */
export interface Actions {}

export abstract class CSSCharts implements SimpleWCInfo {
    src: './el-maker.json';
    tagName: 'css-charts';
    props: EndUserProps;
    cssParts?: {};
}

export type Package = [CSSCharts];
