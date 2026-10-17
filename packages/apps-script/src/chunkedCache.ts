/** The parts of `GoogleAppsScript.Cache.Cache` this module uses. */
export interface CacheStore {
    get(key: string): string | null;
    getAll(keys: string[]): Record<string, string>;
    putAll(values: Record<string, string>, expirationInSeconds: number): void;
    remove(key: string): void;
}

/** Turns text into something smaller to store, and back. */
export interface Codec {
    encode(text: string): string;
    decode(stored: string): string;
}

export interface ChunkedCacheOptions {
    store: CacheStore;
    codec: Codec;
    /** Prefix of every key; bump it when the stored format changes. */
    key: string;
    /** CacheService caps one value at 100KB. */
    chunkChars: number;
    /** CacheService caps expiry at 6 hours. */
    expirationInSeconds: number;
}

export interface ChunkedCache {
    /** @returns The cached text, or null on a miss or a partly evicted entry. */
    get(): string | null;
    put(text: string): void;
    /** Drop the entry; the stale chunks expire on their own. */
    invalidate(): void;
}

/**
 * Cache one text value larger than CacheService allows for a single key:
 * encode it, split it into chunks, and record the chunk count under `<key>:n`.
 */
export function createChunkedCache({ store, codec, key, chunkChars, expirationInSeconds }: ChunkedCacheOptions): ChunkedCache {
    const countKey = `${key}:n`;
    const chunkKey = (index: number) => `${key}:${index}`;

    return {
        get() {
            const count = Number(store.get(countKey));
            if (!count) {
                return null;
            }
            const keys = Array.from({ length: count }, (_, index) => chunkKey(index));
            const chunks = store.getAll(keys);
            const parts = keys.map(chunk => chunks[chunk]);
            if (parts.some(part => part === undefined)) {
                return null;
            }
            return codec.decode(parts.join(''));
        },

        put(text) {
            const encoded = codec.encode(text);
            const values: Record<string, string> = {};
            let count = 0;
            for (let start = 0; start < encoded.length; start += chunkChars) {
                values[chunkKey(count)] = encoded.slice(start, start + chunkChars);
                count += 1;
            }
            values[countKey] = String(count);
            store.putAll(values, expirationInSeconds);
        },

        invalidate() {
            store.remove(countKey);
        },
    };
}
