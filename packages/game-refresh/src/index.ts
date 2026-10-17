import {
    appReviewsUrl,
    buildRefreshUpdates,
    Column,
    computePlaytimeStats,
    parseAppReviews,
    parseStorePage,
    storePageFetchUrl,
    type ColumnName,
    type FetchText,
    type SheetRowValues,
    type SteamSnapshot,
} from '@watchlist/core';

/**
 * Where refreshed rows are read from and written to, keyed by Steam app id.
 * Implementations resolve the row themselves and must refuse to write when the row
 * no longer holds `appId` (rows move as the sheet is edited by hand).
 */
export interface SheetRowStore {
    /** The row's current values for `columns`. Rejects when no row has `appId`. */
    read(appId: number, columns: readonly ColumnName[]): Promise<SheetRowValues>;
    /** Write only the given cells, leaving the rest of the row alone. */
    write(appId: number, values: SheetRowValues): Promise<void>;
}

export type ParseHtml = (html: string) => Document;

export interface RefreshDeps {
    fetchText: FetchText;
    store: SheetRowStore;
    /** Defaults to the browser's `DOMParser`. */
    parseHtml?: ParseHtml;
    /** Defaults to the current time; decides the update date. */
    now?: () => Date;
}

const parseWithDomParser: ParseHtml = html => new DOMParser().parseFromString(html, 'text/html');

/** Columns `buildRefreshUpdates` reads from the old row. */
const columnsToRead: readonly ColumnName[] = [Column.detail];

/**
 * Fetch the store page and reviews of one app, in parallel.
 */
export async function fetchSteamSnapshot(
    appId: number,
    fetchText: FetchText,
    parseHtml: ParseHtml = parseWithDomParser,
): Promise<SteamSnapshot> {
    const [html, reviewsJson] = await Promise.all([
        fetchText(storePageFetchUrl(appId)),
        fetchText(appReviewsUrl(appId)),
    ]);
    const reviews = parseAppReviews(reviewsJson);
    return {
        page: parseStorePage(parseHtml(html)),
        reviews,
        playtime: computePlaytimeStats(reviews.playtimeMinutes),
    };
}

/**
 * Refresh one game's sheet row from Steam.
 *
 * @returns The cells that were written.
 */
export async function refreshGame(appId: number, deps: RefreshDeps): Promise<SheetRowValues> {
    const [snapshot, oldRow] = await Promise.all([
        fetchSteamSnapshot(appId, deps.fetchText, deps.parseHtml),
        deps.store.read(appId, columnsToRead),
    ]);
    const updates = buildRefreshUpdates(snapshot, oldRow, deps.now?.() ?? new Date());
    await deps.store.write(appId, updates);
    return updates;
}
