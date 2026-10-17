import { describe, expect, it } from 'vitest';

import { computePlaytimeStats } from '../src';

const hours = (...values: number[]) => values.map(value => value * 60);

describe('computePlaytimeStats', () => {
    it('takes the middle value of an odd count, regardless of input order', () => {
        expect(computePlaytimeStats(hours(50, 1, 9, 3, 20))).toEqual({ medianHours: 9, thirdHighestHours: 9 });
    });

    it('averages the two middle values of an even count', () => {
        // (4 + 7) / 2 = 5.5
        expect(computePlaytimeStats(hours(1, 2, 4, 7, 30, 100)).medianHours).toBe(6);
    });

    it('rounds to whole hours', () => {
        expect(computePlaytimeStats([89, 90, 91, 200, 1000])).toEqual({ medianHours: 2, thirdHighestHours: 2 });
    });

    it('omits the 3rd highest with fewer than 5 samples', () => {
        expect(computePlaytimeStats(hours(1, 2, 3, 4))).toEqual({ medianHours: 3, thirdHighestHours: null });
    });

    it('returns nulls without samples', () => {
        expect(computePlaytimeStats([])).toEqual({ medianHours: null, thirdHighestHours: null });
    });
});
