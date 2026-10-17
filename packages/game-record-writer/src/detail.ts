import type { StorePageInfo } from '@watchlist/steam-info-scraper';

import { formatReleaseDate } from './date';
import type { PlaytimeStats } from './playtime';

/** Matches what `formatPlaytime` writes, including old `NaN` values from the legacy scraper. */
const playtimePattern = /中位[^，。]*H，3rd\.高[^。]*H。/;

/**
 * @returns e.g. `中位12H，3rd.高85H。`; unknown numbers become `-`.
 */
export function formatPlaytime(stats: PlaytimeStats): string {
    return `中位${stats.medianHours ?? '-'}H，3rd.高${stats.thirdHighestHours ?? '-'}H。`;
}

/**
 * The detail cell for a row that has none yet.
 *
 * @returns e.g. `2026/3/5EA。中位12H，3rd.高85H。`
 */
export function buildDetail(page: StorePageInfo, playtime: PlaytimeStats): string {
    const releaseDate = page.releaseDate ? formatReleaseDate(page.releaseDate) : '';
    const earlyAccess = page.isEarlyAccess ? `${releaseDate}EA。` : '';
    return `${earlyAccess}${formatPlaytime(playtime)}`;
}

/**
 * Refresh the playtime part of an existing detail cell and keep everything else,
 * since the cell also holds hand-written notes. Appends when there is no playtime part yet.
 */
export function mergeDetail(oldDetail: string, playtime: PlaytimeStats): string {
    const fresh = formatPlaytime(playtime);
    return playtimePattern.test(oldDetail)
        ? oldDetail.replace(playtimePattern, fresh)
        : `${oldDetail}${fresh}`;
}
