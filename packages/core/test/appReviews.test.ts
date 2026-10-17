import { describe, expect, it } from 'vitest';

import { parseAppReviews } from '../src';
import { loadAppReviewsJson } from './fixtures';

describe('parseAppReviews', () => {
    it('reads the all-language positive percent and each reviewer playtime', () => {
        const info = parseAppReviews(loadAppReviewsJson(1145360));

        // 303821 / 310049
        expect(info.positivePercent).toBe(98);
        expect(info.totalReviews).toBe(310049);
        expect(info.playtimeMinutes).toHaveLength(100);
        expect(info.playtimeMinutes.every(minutes => Number.isInteger(minutes) && minutes >= 0)).toBe(true);
    });

    it('returns a null percent without reviews', () => {
        expect(parseAppReviews(loadAppReviewsJson(3669620))).toEqual({
            positivePercent: null,
            totalReviews: 0,
            playtimeMinutes: [],
        });
    });

    it('throws when Steam reports failure', () => {
        expect(() => parseAppReviews('{"success":2}')).toThrow('success=2');
    });
});
