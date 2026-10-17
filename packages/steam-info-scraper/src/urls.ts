import { storePageUrl } from '@watchlist/core';

/** Store page URL pinned to traditional Chinese and the TW store, which the parsers expect. */
export function storePageFetchUrl(appId: number): string {
    return `${storePageUrl(appId)}?l=tchinese&cc=tw`;
}

/** Reviews per playtime sample request. */
export const reviewSampleSize = 40;

/**
 * Day ranges the playtime sample tries in turn: the store page's own 30 days, then the widest
 * the API takes, when 30 days hold fewer than `reviewSampleSize` reviews.
 */
export const reviewSampleDayRanges: readonly number[] = [30, 365];

/**
 * The store page's own review query (most helpful within `dayRange` days, review quality on,
 * off-topic activity kept), except for every language instead of the visitor's. Every parameter
 * is spelled out so a Steam default change cannot move the sample.
 */
export function appReviewsUrl(appId: number, dayRange = reviewSampleDayRanges[0]!): string {
    const query = new URLSearchParams({
        json: '1',
        filter: 'all',
        day_range: String(dayRange),
        language: 'all',
        review_type: 'all',
        purchase_type: 'all',
        filter_offtopic_activity: '0',
        use_review_quality: '1',
        num_per_page: String(reviewSampleSize),
    }).toString();
    return `https://store.steampowered.com/appreviews/${appId}?${query}`;
}

/**
 * Whose reviews the store page's 「所有評論」 counts: Steam purchasers (not key activations),
 * or everyone for a free game, which has no purchasers to speak of.
 */
export type ReviewPurchaseType = 'steam' | 'all';

/**
 * The counts behind the store page's 「所有評論」: every language and all time, off-topic review
 * activity left out. No reviews are returned, only `query_summary`.
 */
export function reviewSummaryUrl(appId: number, purchaseType: ReviewPurchaseType): string {
    const query = new URLSearchParams({
        json: '1',
        filter: 'all',
        language: 'all',
        review_type: 'all',
        purchase_type: purchaseType,
        filter_offtopic_activity: '1',
        num_per_page: '0',
    }).toString();
    return `https://store.steampowered.com/appreviews/${appId}?${query}`;
}
