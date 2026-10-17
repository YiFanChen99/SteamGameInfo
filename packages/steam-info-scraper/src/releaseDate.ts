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

export interface CalendarDate {
    year: number;
    /** 1–12 */
    month: number;
    day: number;
}

/** A date as Steam shows it, and the calendar date when the text is a full one. */
export interface ReleaseDate {
    /** Trimmed, e.g. `2020 年 9 月 17 日` or `2026 年第四季`. */
    text: string;
    /** `null` when the text is not a full date, e.g. `2026 年第四季` or `即將推出`. */
    date: CalendarDate | null;
}

function calendarDate(year: string, month: number | string | undefined, day: string): CalendarDate | null {
    return month === undefined ? null : { year: Number(year), month: Number(month), day: Number(day) };
}

function parseCalendarDate(text: string): CalendarDate | null {
    const numeric = /^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$/.exec(text)
        ?? /^(\d{4})[-/]\s*(\d{1,2})[-/]\s*(\d{1,2})$/.exec(text);
    if (numeric) {
        return calendarDate(numeric[1]!, numeric[2], numeric[3]!);
    }

    // e.g. `17 Sep, 2020`
    const dayFirst = /^(\d{1,2})\s+([A-Za-z]{3,})\s*,?\s*(\d{4})$/.exec(text);
    if (dayFirst) {
        return calendarDate(dayFirst[3]!, monthByName[dayFirst[2]!.toLowerCase()], dayFirst[1]!);
    }

    // e.g. `Sep 17, 2020`
    const monthFirst = /^([A-Za-z]{3,})\s+(\d{1,2})\s*,?\s*(\d{4})$/.exec(text);
    if (monthFirst) {
        return calendarDate(monthFirst[3]!, monthByName[monthFirst[1]!.toLowerCase()], monthFirst[2]!);
    }
    return null;
}

/**
 * Read a Steam date text: `2020 年 9 月 17 日`, `2020-09-17`, `2020/9/7`, `17 Sep, 2020` or `Sep 17, 2020`.
 */
export function parseReleaseDate(text: string): ReleaseDate {
    const trimmed = text.trim();
    return { text: trimmed, date: parseCalendarDate(trimmed) };
}
