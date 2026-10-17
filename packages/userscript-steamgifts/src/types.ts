import type { SheetDump, SheetDumpRow } from '@watchlist/sheet-api';

/**
 * A row from the Google Sheet, accessed by column letter.
 */
export type SheetGame = SheetDumpRow;

export interface SheetData extends SheetDump {
    /** Fetch timestamp, in ms. */
    time: number;
}
