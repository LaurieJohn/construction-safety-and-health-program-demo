/**
 * The formatting the PHP views did inline: number_format, date() and the little
 * string helpers that were repeated in every template.
 *
 * These are auto-imported — call them straight from a page.
 */

/** `₱ 1,234.56`, matching number_format($value, 2). */
export function peso(value: number | null | undefined): string {
    return `₱ ${amount(value)}`
}

/** `1,234.56` — the figure alone, for cells that print their own symbol. */
export function amount(value: number | null | undefined): string {
    return Number(value ?? 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

/** A plain thousands-separated integer. */
export function count(value: number | null | undefined): string {
    return Number(value ?? 0).toLocaleString('en-US')
}

/**
 * `₱ 486.0M` — project costs run to nine figures, and a dashboard tile has no
 * room for all of them.
 */
export function compactPeso(value: number | null | undefined): string {
    const figure = Number(value ?? 0)

    if (figure >= 1_000_000_000) {
        return `₱ ${(figure / 1_000_000_000).toFixed(1)}B`
    }

    if (figure >= 1_000_000) {
        return `₱ ${(figure / 1_000_000).toFixed(1)}M`
    }

    if (figure >= 1_000) {
        return `₱ ${(figure / 1_000).toFixed(0)}K`
    }

    return peso(figure)
}

/** `September 13, 2026` — the old views' date('F d, Y'). */
export function longDate(value: string | null | undefined): string {
    const date = parse(value)

    if (!date) {
        return '—'
    }

    return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
}

/** `09/13/2026` — the old views' date('m/d/Y'), for dense table cells. */
export function shortDate(value: string | null | undefined): string {
    const date = parse(value)

    if (!date) {
        return '—'
    }

    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

/** `September 13, 2026 02:15 PM`. */
export function longDateTime(value: string | null | undefined): string {
    const date = parse(value)

    if (!date) {
        return '—'
    }

    return `${longDate(value)} ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })}`
}

/** `YYYY-MM-DD`, for prefilling a date input. */
export function inputDate(value: string | null | undefined): string {
    const date = parse(value)

    if (!date) {
        return ''
    }

    // Local parts, not toISOString: the latter shifts to UTC and can hand back
    // the previous day for anyone east of Greenwich.
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today as `YYYY-MM-DD`. */
export function today(): string {
    return inputDate(new Date().toISOString())
}

/** Now as `YYYY-MM-DD HH:MM:SS`, the shape the seed data stores. */
export function now(): string {
    const at = new Date()

    return `${inputDate(at.toISOString())} ${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`
}

/** True when the date has passed. Used for lapsed first-aid cards. */
export function isPast(value: string | null | undefined): boolean {
    const date = parse(value)

    if (!date) {
        return false
    }

    return date.getTime() < new Date().setHours(0, 0, 0, 0)
}

/** `12 days`, `1 day` — good enough for the words these pages pluralise. */
export function plural(word: string, quantity: number): string {
    return quantity === 1 ? word : `${word}s`
}

/** `Ferrer, Marisol` from the parts, the way the old list views printed a name. */
export function fullName(
    first: string,
    last: string,
    middle = '',
): string {
    const initial = middle.trim() ? ` ${middle.trim().charAt(0)}.` : ''

    return `${last}, ${first}${initial}`
}

/** Two letters for an avatar. */
export function initials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

function pad(value: number): string {
    return String(value).padStart(2, '0')
}

function parse(value: string | null | undefined): Date | null {
    if (!value) {
        return null
    }

    // The demo data stores `YYYY-MM-DD HH:MM:SS`, which Safari will not parse
    // without the separator.
    const date = new Date(value.replace(' ', 'T'))

    return Number.isNaN(date.getTime()) ? null : date
}
