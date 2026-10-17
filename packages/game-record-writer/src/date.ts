import { parseReleaseDate, type ReleaseDate } from '@watchlist/steam-info-scraper';

/**
 * Format as the sheet's date style: `YYYY/M/D`, no zero padding.
 */
export function formatSheetDate(date: Date): string {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * The 上市 cell: `YYYY/M/D`, or Steam's text when it is not a full date, e.g. `2026 年第四季`.
 */
export function formatReleaseDate({ text, date }: ReleaseDate): string {
    return date ? `${date.year}/${date.month}/${date.day}` : text;
}

/**
 * Parse a sheet date cell to local midnight: `YYYY/M/D`, any full date Steam writes
 * (see `parseReleaseDate`), or an ISO timestamp (how a date cell may come back as JSON).
 *
 * @returns `null` for anything else, e.g. `2026 年第四季`.
 */
export function parseSheetDate(value: string | number): Date | null {
    const text = String(value).trim();
    const date = parseReleaseDate(text).date;
    if (date) {
        return new Date(date.year, date.month - 1, date.day);
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
        const parsed = new Date(text);
        if (!Number.isNaN(parsed.getTime())) {
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        }
    }
    return null;
}
