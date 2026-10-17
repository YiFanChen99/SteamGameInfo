import { describe, expect, it } from 'vitest';

import { createNameMatcher, normalizeName, splitAliases } from '../src';

interface Row { B: string }

const rows: Row[] = [
    { B: 'Hades' },
    { B: 'Hades II' },
    { B: 'Settlement Survival / 部落幸存者' },
    { B: 'Portal™ 2' },
    { B: 'Dark Souls: Remastered' },
];
const match = createNameMatcher(rows, row => row.B);
const names = (raw: string) => match(raw).map(row => row.B);

describe('normalizeName', () => {
    it('drops trademark symbols, collapses whitespace and lowercases', () => {
        expect(normalizeName('  Portal™   2® ')).toBe('portal 2');
    });
});

describe('splitAliases', () => {
    it('splits on / and drops empty parts', () => {
        expect(splitAliases('Settlement Survival / 部落幸存者 /')).toEqual(['settlement survival', '部落幸存者']);
    });
});

describe('createNameMatcher', () => {
    it('prefers an exact match over partial ones', () => {
        expect(names('Hades')).toEqual(['Hades']);
    });

    it('matches one alias exactly', () => {
        expect(names('settlement survival')).toEqual(['Settlement Survival / 部落幸存者']);
    });

    it('ignores trademark symbols and case', () => {
        expect(names('PORTAL 2')).toEqual(['Portal™ 2']);
    });

    it('falls back to the name without an edition suffix', () => {
        expect(names('Hades II - Deluxe Edition')).toEqual(['Hades II']);
    });

    it('returns every partial match when nothing is exact', () => {
        expect(names('Dark Souls')).toEqual(['Dark Souls: Remastered']);
        expect(names('ade')).toEqual(['Hades', 'Hades II']);
    });

    it('returns nothing when no row contains the name', () => {
        expect(names('Celeste')).toEqual([]);
    });
});
