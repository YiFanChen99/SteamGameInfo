const storeOrigin = 'https://store.steampowered.com';

/** Canonical store page URL, as stored in the sheet's name HYPERLINK. */
export function storePageUrl(appId: number): string {
    return `${storeOrigin}/app/${appId}/`;
}

/** Store page URL pinned to traditional Chinese and the TW store, which the parsers expect. */
export function storePageFetchUrl(appId: number): string {
    return `${storePageUrl(appId)}?l=tchinese&cc=tw`;
}

/**
 * Reviews of all languages and purchase types, most helpful first, 50 per request.
 */
export function appReviewsUrl(appId: number): string {
    return `${storeOrigin}/appreviews/${appId}?json=1&language=all&purchase_type=all&filter=all&num_per_page=50`;
}

/**
 * Find a Steam app id in a store URL, a `=HYPERLINK(...)` formula, or any text containing `/app/<id>`.
 */
export function extractAppId(text: string): number | null {
    const matched = /\/app\/(\d+)/i.exec(text);
    return matched ? Number(matched[1]) : null;
}
