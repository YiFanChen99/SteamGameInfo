import { describe, expect, it } from 'vitest';

import { parseAppReviews } from '../src';
import { loadAppReviewsJson } from './fixtures';

describe('parseAppReviews', () => {
    it('reads the all-language review counts and each reviewer playtime', () => {
        const info = parseAppReviews(loadAppReviewsJson(1145360));

        expect(info.totalPositive).toBe(303821);
        expect(info.totalReviews).toBe(310049);
        expect(info.playtimeMinutes).toHaveLength(50);
        expect(info.playtimeMinutes.every(minutes => Number.isInteger(minutes) && minutes >= 0)).toBe(true);
    });

    it('reads a game without reviews', () => {
        expect(parseAppReviews(loadAppReviewsJson(3669620))).toEqual({
            totalPositive: 0,
            totalReviews: 0,
            playtimeMinutes: [],
        });
    });

    it('throws when Steam reports failure', () => {
        expect(() => parseAppReviews('{"success":2}')).toThrow('success=2');
    });
});
