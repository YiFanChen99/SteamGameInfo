const monthByName: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
};

/**
 * Format as the sheet's date style: `YYYY/M/D`, no zero padding.
 */
export function formatSheetDate(date: Date): string {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * Convert a Steam release date text to `YYYY/M/D`.
 *
 * @returns The trimmed input when it is not a full date, e.g. `2026 年第四季` or `即將推出`.
 */
export function normalizeReleaseDate(text: string): string {
    const trimmed = text.trim();

    const numeric = /^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$/.exec(trimmed)
        ?? /^(\d{4})[-/]\s*(\d{1,2})[-/]\s*(\d{1,2})$/.exec(trimmed);
    if (numeric) {
        return `${Number(numeric[1])}/${Number(numeric[2])}/${Number(numeric[3])}`;
    }

    // e.g. `17 Sep, 2020`
    const dayFirst = /^(\d{1,2})\s+([A-Za-z]{3,})\s*,?\s*(\d{4})$/.exec(trimmed);
    if (dayFirst) {
        const month = monthByName[dayFirst[2]!.toLowerCase()];
        if (month) {
            return `${Number(dayFirst[3])}/${month}/${Number(dayFirst[1])}`;
        }
    }

    // e.g. `Sep 17, 2020`
    const monthFirst = /^([A-Za-z]{3,})\s+(\d{1,2})\s*,?\s*(\d{4})$/.exec(trimmed);
    if (monthFirst) {
        const month = monthByName[monthFirst[1]!.toLowerCase()];
        if (month) {
            return `${Number(monthFirst[3])}/${month}/${Number(monthFirst[2])}`;
        }
    }

    return trimmed;
}
