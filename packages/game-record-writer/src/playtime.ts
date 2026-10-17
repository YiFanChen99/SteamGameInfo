export interface PlaytimeStats {
    /** `null` without samples. */
    medianHours: number | null;
    /** `null` with fewer than 5 samples, where the 3rd highest says little. */
    thirdHighestHours: number | null;
}

/**
 * Median and 3rd highest playtime, in hours, both rounded.
 *
 * @param minutes One entry per reviewer, e.g. `AppReviewsInfo.playtimeMinutes`.
 */
export function computePlaytimeStats(minutes: readonly number[]): PlaytimeStats {
    const hours = minutes.map(value => value / 60).sort((a, b) => a - b);
    if (!hours.length) {
        return { medianHours: null, thirdHighestHours: null };
    }

    const half = Math.floor(hours.length / 2);
    const median = hours.length % 2 ? hours[half]! : (hours[half - 1]! + hours[half]!) / 2;
    return {
        medianHours: Math.round(median),
        thirdHighestHours: hours.length < 5 ? null : Math.round(hours[hours.length - 3]!),
    };
}
