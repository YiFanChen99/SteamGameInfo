import { storePageUrl } from '../steam/urls';
import { Column, type SheetRowValues } from './columns';
import { planRefresh, unknownPricePlaceholder, type SteamSnapshot } from './refresh';

/** Written to the want level column of a new row: not rated yet. */
export const unratedWantLevel = '?';

/**
 * The name cell: `=HYPERLINK("<store url>","<name>")`, which is also where the sheet keeps the app id.
 */
export function buildNameFormula(appId: number, name: string): string {
    const quote = (text: string) => `"${text.replace(/"/g, '""')}"`;
    return `=HYPERLINK(${quote(storePageUrl(appId))},${quote(name)})`;
}

export interface NewRowInput {
    appId: number;
    snapshot: SteamSnapshot;
    /** From `parseLowestOff`; `null` leaves the cell blank (as it is without a price). */
    lowestOff: number | '-' | null;
    today: Date;
}

/**
 * The cells of a row for a game the sheet does not have yet.
 *
 * Steam-owned cells and the lowest discount follow `planRefresh` with a blank old row.
 * On top of that: the name HYPERLINK (the page's name, or the app id without one),
 * `unknownPricePlaceholder` when the page has no price, and `?` as the want level.
 * Mode is not written.
 */
export function planNewRow({ appId, snapshot, lowestOff, today }: NewRowInput): SheetRowValues {
    return {
        [Column.name]: buildNameFormula(appId, snapshot.page.name ?? String(appId)),
        [Column.originalPrice]: unknownPricePlaceholder,
        ...planRefresh(snapshot, {}, today, { lowestOff }).updates,
        [Column.wantLevel]: unratedWantLevel,
    };
}
