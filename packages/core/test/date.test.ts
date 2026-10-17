import { describe, expect, it } from 'vitest';

import { formatSheetDate, normalizeReleaseDate } from '../src';

describe('normalizeReleaseDate', () => {
    it.each([
        ['2020 年 9 月 17 日', '2020/9/17'],
        ['2026年3月5日', '2026/3/5'],
        ['2020-09-17', '2020/9/17'],
        ['2020/9/7', '2020/9/7'],
        ['17 Sep, 2020', '2020/9/17'],
        ['Sep 17, 2020', '2020/9/17'],
    ])('converts %s', (input, expected) => {
        expect(normalizeReleaseDate(input)).toBe(expected);
    });

    it.each(['2026 年第四季', '即將推出', ' 待定 '])('keeps partial date %s as text', (input) => {
        expect(normalizeReleaseDate(input)).toBe(input.trim());
    });
});

describe('formatSheetDate', () => {
    it('does not zero-pad', () => {
        expect(formatSheetDate(new Date(2026, 0, 5))).toBe('2026/1/5');
    });
});
