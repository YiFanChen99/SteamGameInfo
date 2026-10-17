import { storePageUrl } from '@watchlist/core';

/** Store page URL pinned to traditional Chinese and the TW store, which the parsers expect. */
export function storePageFetchUrl(appId: number): string {
    return `${storePageUrl(appId)}?l=tchinese&cc=tw`;
}

/**
 * Reviews of all languages and purchase types, most helpful first, 50 per request.
 */
export function appReviewsUrl(appId: number): string {
    return `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&filter=all&num_per_page=50`;
}
