import {
    appReviewsUrl,
    computePlaytimeStats,
    parseAppReviews,
    parseLowestOff,
    parseStorePage,
    planNewRow,
    planRefresh,
    refreshReadColumns,
    storePageFetchUrl,
    type ColumnName,
    type FetchText,
    type RefreshPlan,
    type SheetRowValues,
    type SteamSnapshot,
} from '@watchlist/core';
import type { SheetApi } from '@watchlist/sheet-api';

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
    /** Add a row for `appId`. Rejects when a row already has it. */
    append(appId: number, values: SheetRowValues): Promise<void>;
}

/** A `SheetRowStore` backed by the web app; `api` needs `postText` to write. */
export function sheetApiRowStore(api: SheetApi): SheetRowStore {
    return {
        read: async (appId, columns) => (await api.readRow(appId, columns)).values,
        write: async (appId, values) => {
            await api.updateRow(appId, values);
        },
        append: async (appId, values) => {
            await api.appendRow(appId, values);
        },
    };
}

export type ParseHtml = (html: string) => Document;

export interface RefreshDeps {
    fetchText: FetchText;
    store: SheetRowStore;
    /** Defaults to the browser's `DOMParser`. */
    parseHtml?: ParseHtml;
    /** Defaults to the current time; decides the update date. */
    now?: () => Date;
    /**
     * Text of the SteamDB extension's price block (`steamDbPricesSelector`), where the page has one.
     * Refresh: null or absent leaves 最低off alone. Add: null writes `-`.
     */
    steamDbText?: string | null;
}

const parseWithDomParser: ParseHtml = html => new DOMParser().parseFromString(html, 'text/html');

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
 * @returns The written cells, and the price / release date changes to show the user.
 */
export async function refreshGame(appId: number, deps: RefreshDeps): Promise<RefreshPlan> {
    const [snapshot, oldRow] = await Promise.all([
        fetchSteamSnapshot(appId, deps.fetchText, deps.parseHtml),
        deps.store.read(appId, refreshReadColumns),
    ]);
    const lowestOff = deps.steamDbText == null ? null : parseLowestOff(deps.steamDbText, snapshot.page.originalPrice);
    const plan = planRefresh(snapshot, oldRow, deps.now?.() ?? new Date(), { lowestOff });
    await deps.store.write(appId, plan.updates);
    return plan;
}

/**
 * Add a row for a game the sheet does not have yet; see `planNewRow`.
 *
 * @returns The written cells.
 */
export async function addGame(appId: number, deps: RefreshDeps): Promise<SheetRowValues> {
    const snapshot = await fetchSteamSnapshot(appId, deps.fetchText, deps.parseHtml);
    const row = planNewRow({
        appId,
        snapshot,
        lowestOff: parseLowestOff(deps.steamDbText ?? null, snapshot.page.originalPrice),
        today: deps.now?.() ?? new Date(),
    });
    await deps.store.append(appId, row);
    return row;
}
