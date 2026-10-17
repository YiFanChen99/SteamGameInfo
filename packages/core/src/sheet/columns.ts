/**
 * Sheet header names. Writes locate columns by these names, never by letter,
 * because columns get added and moved by hand.
 */
export const Column = {
    /** `=HYPERLINK("<store url>","<name>")`; the name may pack aliases separated by `/`. */
    name: '名稱',
    /** TWD, base game before discount. */
    originalPrice: '原價',
    lowestOff: '最低off',
    releaseDate: '上市日期',
    /** Positive review percent: an integer 0–100. */
    reviewScore: '評價度',
    updatedOn: '我更新日期',
    lowestPrice: '最低$',
    /** The user's own filter tag categories, derived from the store page (rules not defined yet). */
    mode: '模式',
    /** Space-separated tags: the language mark, `Demo`, and any hand-written ones. */
    special: '特',
    /** `[<date>EA。]中位<n>H，3rd.高<n>H。` plus any hand-written notes. */
    detail: '備註',
} as const;

export type ColumnName = (typeof Column)[keyof typeof Column];

export type CellValue = string | number;

/** Some cells of one row, keyed by header name. */
export type SheetRowValues = Partial<Record<ColumnName, CellValue>>;
