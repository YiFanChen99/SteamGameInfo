import type { FetchText } from '@watchlist/core';

import { parseAppReviews, type AppReviewsInfo } from './appReviews';
import { parseStorePage, type StorePageInfo } from './storePage';
import { appReviewsUrl, storePageFetchUrl } from './urls';

/** Everything fetched from Steam for one app. */
export interface SteamSnapshot {
    page: StorePageInfo;
    reviews: AppReviewsInfo;
}

export type ParseHtml = (html: string) => Document;

const parseWithDomParser: ParseHtml = html => new DOMParser().parseFromString(html, 'text/html');

/**
 * Fetch the store page and reviews of one app, in parallel.
 *
 * @param parseHtml Defaults to the browser's `DOMParser`.
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
    return {
        page: parseStorePage(parseHtml(html)),
        reviews: parseAppReviews(reviewsJson),
    };
}
