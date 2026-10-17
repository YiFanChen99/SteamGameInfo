import { describe, expect, it } from 'vitest';

import { createChunkedCache, type CacheStore, type Codec } from '../src/chunkedCache';

function memoryStore(): CacheStore & { values: Map<string, string> } {
    const values = new Map<string, string>();
    return {
        values,
        get: key => values.get(key) ?? null,
        getAll: keys => Object.fromEntries(keys.flatMap(key => {
            const value = values.get(key);
            return value === undefined ? [] : [[key, value]];
        })),
        putAll: entries => {
            for (const [key, value] of Object.entries(entries)) {
                values.set(key, value);
            }
        },
        remove: key => {
            values.delete(key);
        },
    };
}

/** Reversible and visible in the stored chunks. */
const reverseCodec: Codec = {
    encode: text => [...text].reverse().join(''),
    decode: stored => [...stored].reverse().join(''),
};

function setup() {
    const store = memoryStore();
    const cache = createChunkedCache({ store, codec: reverseCodec, key: 'dump', chunkChars: 4, expirationInSeconds: 60 });
    return { store, cache };
}

describe('createChunkedCache', () => {
    it('misses when nothing is stored', () => {
        expect(setup().cache.get()).toBeNull();
    });

    it('stores the encoded text in chunks and reads it back', () => {
        const { store, cache } = setup();

        cache.put('0123456789');

        expect(store.values.get('dump:n')).toBe('3');
        expect(store.values.get('dump:0')).toBe('9876');
        expect(store.values.get('dump:2')).toBe('10');
        expect(cache.get()).toBe('0123456789');
    });

    it('misses when a chunk has been evicted', () => {
        const { store, cache } = setup();
        cache.put('0123456789');

        store.values.delete('dump:1');

        expect(cache.get()).toBeNull();
    });

    it('misses after invalidate', () => {
        const { cache } = setup();
        cache.put('0123456789');

        cache.invalidate();

        expect(cache.get()).toBeNull();
    });
});
