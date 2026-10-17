/** The lowest-price block the SteamDB browser extension adds to a store page. */
export const steamDbPricesSelector = '.steamdb_prices_top';

export interface SteamDbPrices {
    /** The lowest recorded price, e.g. `1190` from `…NT$ 1,190…`; `null` when the block shows none. */
    lowestPrice: number | null;
}

/**
 * @param text The SteamDB block's text; the first `$ <amount>` in it is the lowest price.
 */
export function parseSteamDbPrices(text: string): SteamDbPrices {
    const matched = /\$\s*([\d,]+(?:\.\d+)?)/.exec(text);
    return { lowestPrice: matched ? Number(matched[1]!.replace(/,/g, '')) : null };
}

/**
 * Read the SteamDB block of a live store page. Read it when needed: the extension adds it after the page loads.
 *
 * @returns `null` when the page has no block (the extension is missing or not done yet).
 */
export function readSteamDbPrices(doc: ParentNode): SteamDbPrices | null {
    const text = doc.querySelector(steamDbPricesSelector)?.textContent;
    return typeof text === 'string' ? parseSteamDbPrices(text) : null;
}
