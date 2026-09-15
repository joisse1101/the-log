
export function isValidDateString(value: string | undefined | null): value is string {
    if (!value) return false;
    return !Number.isNaN(new Date(value).getTime());
}

export function getDisplayDate(date: Date): string {
    const formattedDate = new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);

    return formattedDate
}

export function getShortDisplayDateTime(date: Date): string {
    const formattedDate = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    }).format(date);

    return formattedDate;
}

export function getDisplayTime(date: Date): string {
    const formattedTime = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
    }).format(date);

    return formattedTime;
}