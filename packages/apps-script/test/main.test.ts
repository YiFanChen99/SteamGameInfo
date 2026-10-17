import { describe, expect, it } from 'vitest';

import { isAuthorized, WantToOwned } from '../src/main';

describe('isAuthorized', () => {
    it('accepts only the exact token', () => {
        expect(isAuthorized('secret', 'secret')).toBe(true);
        expect(isAuthorized('Secret', 'secret')).toBe(false);
        expect(isAuthorized(undefined, 'secret')).toBe(false);
    });

    it('rejects everything while the token property is unset or empty', () => {
        expect(isAuthorized(undefined, null)).toBe(false);
        expect(isAuthorized('', '')).toBe(false);
    });
});

describe('WantToOwned', () => {
    it('keeps the original output layout', () => {
        const record = ['=HYPERLINK(...)', 1, 2, 3, '2020/1/2', 5, 6, 7, 8, 9, 10, 'AnyDeal', 'Spec', 'Note'];

        expect(WantToOwned([record])).toEqual([[
            '=HYPERLINK(...)', undefined, 'AnyDeal', undefined, undefined, undefined, 'O', '2020/1/2，Spec，Note',
        ]]);
    });
});
