const storeOrigin = 'https://store.steampowered.com';

/** Canonical store page URL, as stored in the sheet's name HYPERLINK. */
export function storePageUrl(appId: number): string {
    return `${storeOrigin}/app/${appId}/`;
}

/**
 * Find a Steam app id in a store URL, a `=HYPERLINK(...)` formula, or any text containing `/app/<id>`.
 */
export function extractAppId(text: string): number | null {
    const matched = /\/app\/(\d+)/i.exec(text);
    return matched ? Number(matched[1]) : null;
}
