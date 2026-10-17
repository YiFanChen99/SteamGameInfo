import { storePageUrl } from '@watchlist/core';

/** Store page URL pinned to traditional Chinese and the TW store, which the parsers expect. */
export function storePageFetchUrl(appId: number): string {
    return `${storePageUrl(appId)}?l=tchinese&cc=tw`;
}

/**
 * The store page's own review query (most helpful within the last 30 days, review quality on,
 * off-topic activity kept), except for every language instead of the visitor's: the review
 * score needs all of them. Every parameter is spelled out so a Steam default change cannot
 * move the sample. 40 reviews per request.
 */
const appReviewsQuery = new URLSearchParams({
    json: '1',
    filter: 'all',
    day_range: '30',
    language: 'all',
    review_type: 'all',
    purchase_type: 'all',
    filter_offtopic_activity: '0',
    use_review_quality: '1',
    num_per_page: '40',
}).toString();

export function appReviewsUrl(appId: number): string {
    return `https://store.steampowered.com/appreviews/${appId}?${appReviewsQuery}`;
}
