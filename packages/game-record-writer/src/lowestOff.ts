import type { SteamDbPrices } from '@watchlist/steam-info-scraper';

/** 最低off of a new row whose page has no SteamDB block. */
export const defaultLowestOff = 0;

/**
 * The 最低off cell: the lowest-ever discount off the original price, in percent (COLUMNS.md 最低off).
 *
 * @param steamDb The SteamDB block; `null` when the page has none, which gives `defaultLowestOff`.
 *   A refresh only calls this with a block, so it leaves the cell alone without one.
 * @param originalPrice See `StorePageInfo.originalPrice`.
 * @returns `100` when free to play; `null` (blank) without an original price, or when the
 *   block shows no lowest price.
 */
export function planLowestOff(steamDb: SteamDbPrices | null, originalPrice: number | null): number | null {
    if (originalPrice === 0) {
        return 100;
    }
    if (originalPrice === null) {
        return null;
    }
    if (steamDb === null) {
        return defaultLowestOff;
    }
    if (steamDb.lowestPrice === null) {
        return null;
    }
    return Math.max(0, Math.round((1 - steamDb.lowestPrice / originalPrice) * 100));
}
