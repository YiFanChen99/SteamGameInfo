/**
 * Normalize a game name for comparison: trademark symbols, whitespace, case.
 */
export function normalizeName(name: string): string {
    return name
        .replace(/[™®©]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/**
 * Split a sheet name cell that packs aliases with `/`, e.g. `Settlement Survival / 部落幸存者`.
 *
 * @returns Normalized aliases, empty ones dropped.
 */
export function splitAliases(cell: string): string[] {
    return cell.split('/').map(normalizeName).filter(Boolean);
}

/** Drop a trailing `xxx Edition`, e.g. `Foo: Deluxe Edition` → `Foo`. */
function removeEditionSuffix(name: string): string {
    return name.replace(/[\s:-]+\w+\s+edition$/i, '');
}

/**
 * Build a matcher from game names (e.g. a store listing) to sheet rows.
 * Names are normalized once up front, so the matcher is cheap to call per listing.
 *
 * A row matches when its whole name cell contains the queried name (edition suffix removed).
 * Among those, exact matches on the whole cell or one alias win; otherwise all partial
 * matches are returned.
 *
 * @param getName Returns a row's name cell, aliases included.
 */
export function createNameMatcher<T>(rows: readonly T[], getName: (row: T) => string): (rawName: string) => T[] {
    const prepared = rows.map(row => {
        const cell = getName(row);
        return { row, name: normalizeName(cell), aliases: splitAliases(cell) };
    });

    return (rawName) => {
        const name = normalizeName(rawName);
        const nameWithoutEdition = normalizeName(removeEditionSuffix(rawName));

        const candidates = prepared.filter(item => item.name.includes(nameWithoutEdition));
        const isExact = (target: string) => (item: (typeof prepared)[number]) =>
            item.name === target || item.aliases.includes(target);

        const exact = candidates.filter(isExact(name));
        if (exact.length) {
            return exact.map(item => item.row);
        }
        const exactWithoutEdition = candidates.filter(isExact(nameWithoutEdition));
        return (exactWithoutEdition.length ? exactWithoutEdition : candidates).map(item => item.row);
    };
}
