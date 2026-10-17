import { formatSheetDate } from '../date';
import type { AppReviewsInfo } from '../steam/appReviews';
import type { PlaytimeStats } from '../steam/playtime';
import type { StorePageInfo } from '../steam/storePage';
import { Column, type SheetRowValues } from './columns';
import { buildDetail, mergeDetail } from './detail';

/** Everything fetched from Steam for one app. */
export interface SteamSnapshot {
    page: StorePageInfo;
    reviews: AppReviewsInfo;
    playtime: PlaytimeStats;
}

/**
 * Decide which cells of an existing row to write after fetching fresh Steam data.
 *
 * - Steam-owned values (price, release date, review score) are replaced when Steam has them,
 *   and left alone when it does not (e.g. no price before release).
 * - The update date becomes `today`.
 * - The detail cell only gets its playtime part replaced; see `mergeDetail`.
 * - Name, lowest price/off and mode are never touched.
 *
 * @param oldRow The row's current values; only the detail cell is read.
 * @returns Only the cells to write.
 */
export function buildRefreshUpdates(snapshot: SteamSnapshot, oldRow: SheetRowValues, today: Date): SheetRowValues {
    const { page, reviews, playtime } = snapshot;
    const updates: SheetRowValues = {};

    if (page.originalPrice !== null) {
        updates[Column.originalPrice] = page.originalPrice;
    }
    if (page.releaseDate !== null) {
        updates[Column.releaseDate] = page.releaseDate;
    }
    if (reviews.positivePercent !== null) {
        updates[Column.reviewScore] = reviews.positivePercent;
    }
    updates[Column.updatedOn] = formatSheetDate(today);

    const oldDetail = String(oldRow[Column.detail] ?? '').trim();
    updates[Column.detail] = oldDetail ? mergeDetail(oldDetail, playtime) : buildDetail(page, playtime);

    return updates;
}
