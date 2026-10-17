import type { SteamDbPrices } from '@watchlist/steam-info-scraper';

/**
 * The 最低off cell: the lowest-ever discount off the original price, in percent.
 *
 * @param steamDb The SteamDB block; `null` when the page has none.
 * @param originalPrice See `StorePageInfo.originalPrice`.
 * @returns `100` when free to play; `-` without a readable lowest price;
 *   `null` without an original price to compare against (leave the cell alone).
 */
export function planLowestOff(steamDb: SteamDbPrices | null, originalPrice: number | null): number | '-' | null {
    if (originalPrice === 0) {
        return 100;
    }
    if (originalPrice === null) {
        return null;
    }
    const lowest = steamDb?.lowestPrice ?? null;
    if (lowest === null) {
        return '-';
    }
    return Math.max(0, Math.round((1 - lowest / originalPrice) * 100));
}
