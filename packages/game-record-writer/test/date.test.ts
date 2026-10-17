import { describe, expect, it } from 'vitest';

import { formatReleaseDate, formatSheetDate, parseSheetDate } from '../src';

describe('formatReleaseDate', () => {
    it('writes a full date as YYYY/M/D, and keeps Steam text otherwise', () => {
        expect(formatReleaseDate({ text: '2020 年 9 月 17 日', date: { year: 2020, month: 9, day: 17 } })).toBe('2020/9/17');
        expect(formatReleaseDate({ text: '2026 年第四季', date: null })).toBe('2026 年第四季');
    });
});

describe('parseSheetDate', () => {
    it.each([
        ['2026/3/5'],
        ['2026 年 3 月 5 日'],
        [new Date(2026, 2, 5, 13, 30).toISOString()],
    ])('reads %s as local midnight', (input) => {
        expect(parseSheetDate(input)).toEqual(new Date(2026, 2, 5));
    });

    it.each(['2026 年第四季', '', 45000])('returns null for %s', (input) => {
        expect(parseSheetDate(input)).toBeNull();
    });
});

describe('formatSheetDate', () => {
    it('does not zero-pad', () => {
        expect(formatSheetDate(new Date(2026, 0, 5))).toBe('2026/1/5');
    });
});
