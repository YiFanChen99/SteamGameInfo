import { describe, expect, it } from 'vitest';

import { parseReviewSample, parseReviewSummary } from '../src';
import { loadAppReviewsJson, loadReviewSummaryJson } from './fixtures';

describe('parseReviewSummary', () => {
    it('reads the 所有評論 counts', () => {
        expect(parseReviewSummary(loadReviewSummaryJson(1145360))).toEqual({ totalPositive: 281300, totalReviews: 287080 });
    });

    it('reads a game without reviews', () => {
        expect(parseReviewSummary(loadReviewSummaryJson(3669620))).toEqual({ totalPositive: 0, totalReviews: 0 });
    });

    it('throws when Steam reports failure', () => {
        expect(() => parseReviewSummary('{"success":2}')).toThrow('success=2');
    });
});

describe('parseReviewSample', () => {
    it('reads each reviewer playtime', () => {
        const minutes = parseReviewSample(loadAppReviewsJson(1145360));

        expect(minutes).toHaveLength(50);
        expect(minutes.every(value => Number.isInteger(value) && value >= 0)).toBe(true);
    });

    it('reads a game without reviews', () => {
        expect(parseReviewSample(loadAppReviewsJson(3669620))).toEqual([]);
    });

    it('throws when Steam reports failure', () => {
        expect(() => parseReviewSample('{"success":2}')).toThrow('success=2');
    });
});
