import type { ReleaseDate, StorePageInfo } from '@watchlist/steam-info-scraper';

import { todoPlaceholder } from './columns';
import type { PlaytimeStats } from './playtime';

/** Matches what `formatPlaytime` writes, including old `NaN` values from the legacy scraper. */
const playtimePattern = /中位[^，。]*H，3rd\.高[^。]*H。/;

/**
 * @returns e.g. `中位12H，3rd.高85H。`; unknown numbers become `-`.
 */
export function formatPlaytime(stats: PlaytimeStats): string {
    return `中位${stats.medianHours ?? '-'}H，3rd.高${stats.thirdHighestHours ?? '-'}H。`;
}

/** `YY/MM`, e.g. `26/03`; Steam's text when it is not a full date. */
function formatEarlyAccessDate(releaseDate: ReleaseDate | null): string {
    if (!releaseDate?.date) {
        return releaseDate?.text ?? '';
    }
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(releaseDate.date.year % 100)}/${pad(releaseDate.date.month)}`;
}

/**
 * The detail cell of a new row (COLUMNS.md 備註): the game feature description, then the
 * added structure — `YY/MMEA。` for early access, then the playtime.
 *
 * The feature description has no rule yet, so it is `TODO。` for now.
 *
 * @returns e.g. `TODO。26/03EA。中位12H，3rd.高85H。`
 */
export function buildDetail(page: StorePageInfo, playtime: PlaytimeStats): string {
    const features = `${todoPlaceholder}。`;
    const earlyAccess = page.isEarlyAccess ? `${formatEarlyAccessDate(page.releaseDate)}EA。` : '';
    return `${features}${earlyAccess}${formatPlaytime(playtime)}`;
}

/**
 * @returns The playtime part of a detail cell, e.g. `中位12H，3rd.高85H。`; `null` when it has none.
 */
export function extractPlaytime(detail: string): string | null {
    return playtimePattern.exec(detail)?.[0] ?? null;
}

/**
 * Refresh only the playtime part of an existing detail cell and keep everything else.
 * Appends when there is no playtime part yet.
 */
export function mergeDetail(oldDetail: string, playtime: PlaytimeStats): string {
    const fresh = formatPlaytime(playtime);
    return playtimePattern.test(oldDetail)
        ? oldDetail.replace(playtimePattern, fresh)
        : `${oldDetail}${fresh}`;
}
