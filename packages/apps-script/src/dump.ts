import type { SheetDump, SheetDumpRow } from '@watchlist/sheet-api';

/** What `Range.getValues()` puts in a cell. */
export type CellValue = string | number | boolean | Date;

export const worksheetName = 'STEAM';

/** The dump reads columns B through L; index 0 of a row is column B. */
export const firstColumn = 'B';
export const lastColumn = 'L';

/** Columns that go into the dump. */
const keptColumns = ['B', 'G', 'K'] as const;
/** AnyDeal: read only to spot the owned mark, then dropped. */
const ownedColumn = 'L';
const ownedMark = /[^\d]*已有[^\d]*/;

function columnLetter(index: number): string {
    return String.fromCharCode(firstColumn.charCodeAt(0) + index);
}

function cellsByColumn(row: readonly CellValue[]): Record<string, CellValue> {
    const cells: Record<string, CellValue> = {};
    row.forEach((value, index) => {
        cells[columnLetter(index)] = value;
    });
    return cells;
}

/** Same text the original web app returned, which the annotator parses with `new Date()`. */
function toDateString(value: CellValue): string {
    if (value instanceof Date) {
        return value.toDateString();
    }
    if (!value) {
        return '';
    }
    return new Date(typeof value === 'number' ? value : String(value)).toLocaleDateString();
}

function toRow(cells: Record<string, CellValue>): SheetDumpRow | null {
    const name = cells.B ?? '';
    const want = cells.K ?? '';
    // `Number()` keeps the original `== 0` check: 0, '0' and blank-ish strings all skip.
    if (name === '' || want === '' || Number(want) === 0) {
        return null;
    }

    const updatedOn = cells.G ?? '';
    const owned = ownedMark.exec(String(cells[ownedColumn] ?? ''))?.[0];
    return {
        B: String(name),
        G: updatedOn === '' ? '' : toDateString(updatedOn),
        K: owned ?? (typeof want === 'number' ? want : String(want)),
    };
}

/**
 * Turn the sheet's B:L values into the dump the annotator reads.
 *
 * Rows without a name, or whose want level is blank or 0, are skipped.
 * An owned mark (e.g. `已有`) in the AnyDeal column replaces the want level.
 *
 * @param header Row 1, B through L.
 * @param rows Rows 2 and below, B through L.
 */
export function buildDump(header: readonly CellValue[], rows: readonly (readonly CellValue[])[]): SheetDump {
    const headerCells = cellsByColumn(header);
    const labelMap: Record<string, unknown> = {};
    for (const column of keptColumns) {
        labelMap[column] = headerCells[column];
    }

    const games: SheetDumpRow[] = [];
    for (const row of rows) {
        const game = toRow(cellsByColumn(row));
        if (game) {
            games.push(game);
        }
    }
    return { games, labelMap };
}
