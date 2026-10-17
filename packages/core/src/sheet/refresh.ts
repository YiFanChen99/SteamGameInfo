import { formatSheetDate, parseSheetDate } from '../date';
import type { AppReviewsInfo } from '../steam/appReviews';
import type { PlaytimeStats } from '../steam/playtime';
import type { StorePageInfo } from '../steam/storePage';
import { Column, type CellValue, type ColumnName, type SheetRowValues } from './columns';
import { buildDetail, mergeDetail } from './detail';
import { mergeSpecial } from './special';

/** Everything fetched from Steam for one app. */
export interface SteamSnapshot {
    page: StorePageInfo;
    reviews: AppReviewsInfo;
    playtime: PlaytimeStats;
}

/** A value the refresh changed, worth showing to the user. */
export interface ValueChange {
    column: ColumnName;
    oldValue: CellValue;
    newValue: CellValue;
    /**
     * Price: new − old, in TWD. Release date: new − old, in days.
     * `null` when the old value is not a number / full date, e.g. `2026 年第四季`.
     */
    delta: number | null;
}

export interface RefreshPlan {
    /** Only the cells to write. */
    updates: SheetRowValues;
    /** Changed price and release date. Filling a blank cell is not a change. */
    changes: ValueChange[];
}

/** Old-row columns `planRefresh` reads. */
export const refreshReadColumns: readonly ColumnName[] = [
    Column.originalPrice,
    Column.releaseDate,
    Column.special,
    Column.detail,
];

const msPerDay = 24 * 60 * 60 * 1000;

function isBlank(value: CellValue | undefined): value is undefined {
    return value === undefined || String(value).trim() === '';
}

function priceChange(oldValue: CellValue | undefined, newValue: number): ValueChange | null {
    if (isBlank(oldValue)) {
        return null;
    }
    const digits = String(oldValue).replace(/[^\d.]/g, '');
    const oldPrice = digits ? Number(digits) : NaN;
    if (oldPrice === newValue) {
        return null;
    }
    const delta = Number.isFinite(oldPrice) ? Math.round((newValue - oldPrice) * 100) / 100 : null;
    return { column: Column.originalPrice, oldValue, newValue, delta };
}

function releaseDateChange(oldValue: CellValue | undefined, newValue: string): ValueChange | null {
    if (isBlank(oldValue)) {
        return null;
    }
    const oldDate = parseSheetDate(oldValue);
    const newDate = parseSheetDate(newValue);
    if (oldDate && newDate) {
        const delta = Math.round((newDate.getTime() - oldDate.getTime()) / msPerDay);
        return delta === 0 ? null : { column: Column.releaseDate, oldValue, newValue, delta };
    }
    return String(oldValue).trim() === newValue ? null : { column: Column.releaseDate, oldValue, newValue, delta: null };
}

/**
 * Decide which cells of an existing row to write after fetching fresh Steam data.
 *
 * - Price, release date and review score are replaced when Steam has them, and left alone
 *   when it does not (e.g. no price before release). Price and date changes are reported.
 * - The update date becomes `today`.
 * - The special cell gets its language mark and `Demo` tag refreshed; see `mergeSpecial`.
 * - The detail cell only gets its playtime part replaced; see `mergeDetail`.
 * - Name, lowest price/off and mode are never touched.
 *
 * @param oldRow The row's current values for `refreshReadColumns`.
 */
export function planRefresh(snapshot: SteamSnapshot, oldRow: SheetRowValues, today: Date): RefreshPlan {
    const { page, reviews, playtime } = snapshot;
    const updates: SheetRowValues = {};
    const changes: ValueChange[] = [];

    if (page.originalPrice !== null) {
        updates[Column.originalPrice] = page.originalPrice;
        const change = priceChange(oldRow[Column.originalPrice], page.originalPrice);
        if (change) changes.push(change);
    }
    if (page.releaseDate !== null) {
        updates[Column.releaseDate] = page.releaseDate;
        const change = releaseDateChange(oldRow[Column.releaseDate], page.releaseDate);
        if (change) changes.push(change);
    }
    if (reviews.positivePercent !== null) {
        updates[Column.reviewScore] = reviews.positivePercent;
    }
    updates[Column.updatedOn] = formatSheetDate(today);

    updates[Column.special] = mergeSpecial(String(oldRow[Column.special] ?? ''), page);

    const oldDetail = oldRow[Column.detail];
    updates[Column.detail] = isBlank(oldDetail)
        ? buildDetail(page, playtime)
        : mergeDetail(String(oldDetail).trim(), playtime);

    return { updates, changes };
}
