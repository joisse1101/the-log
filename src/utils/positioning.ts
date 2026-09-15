export const POSITION_GAP = 1000;
const MIN_POSITION_GAP = 1;

// Midpoint of prev/next; either may be omitted to insert at an end.
export function getInsertPosition(prev: number | undefined, next: number | undefined): number {
    if (prev === undefined && next === undefined) return POSITION_GAP;
    if (prev === undefined) return next! - POSITION_GAP;
    if (next === undefined) return prev + POSITION_GAP;
    return prev + (next - prev) / 2;
}

export function isGapTooTight(prev: number | undefined, next: number | undefined): boolean {
    if (prev === undefined || next === undefined) return false;
    return next - prev < MIN_POSITION_GAP;
}

export function rebalancePositions<T>(orderedItems: T[]): Array<T & { position: number }> {
    return orderedItems.map((item, index) => ({ ...item, position: (index + 1) * POSITION_GAP }));
}
