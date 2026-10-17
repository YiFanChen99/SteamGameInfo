/** The lowest-price block the SteamDB browser extension adds to a store page. */
export const steamDbPricesSelector = '.steamdb_prices_top';

/**
 * The lowest-ever discount, in percent, from the SteamDB extension's price block,
 * as the sheet's 最低off column holds it.
 *
 * @param text The block's text, e.g. `…NT$ 1,190…`; `null` when the extension added no block.
 * @param originalPrice See `StorePageInfo.originalPrice`.
 * @returns `100` when free to play; `-` without a readable lowest price;
 *   `null` without an original price to compare against (leave the cell alone).
 */
export function parseLowestOff(text: string | null, originalPrice: number | null): number | '-' | null {
    if (originalPrice === 0) {
        return 100;
    }
    if (originalPrice === null) {
        return null;
    }

    const matched = /\$\s*([\d,]+(?:\.\d+)?)/.exec(text ?? '');
    if (!matched) {
        return '-';
    }
    const lowest = Number(matched[1]!.replace(/,/g, ''));
    return Math.max(0, Math.round((1 - lowest / originalPrice) * 100));
}
