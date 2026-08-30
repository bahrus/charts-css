import {SimpleWCInfo} from './types/wc-info/SimpleWCInfo';

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
    /** Bumped on every `slotchange`; gates `extractData`. */
    slotChangeCount: number,
    /** Rows extracted from the slotted <table>(s), with per-chart-type scaling applied. */
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

export interface Actions {
    /**
     * GAP (see Chats/Conversion.md): imperative data extraction + scaling.
     * Reads `slotEl.assignedElements()`, pulls `{key, value}` rows out of each
     * <table>, then computes `scaledVal` / `start` / `end` per `chartType`.
     * Not expressible as an assign-gingerly merge — needs a host method or a
     * dedicated el-maker feature.
     */
    extractData(self: AllProps): ProPAP;
}

export abstract class CSSCharts implements SimpleWCInfo {
    src: './el-maker.json';
    tagName: 'css-charts';
    props: EndUserProps;
    cssParts?: {};
}

export type Package = [CSSCharts];
