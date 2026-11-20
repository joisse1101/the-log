interface CenterInput {
  /** Top of the box, measured from the top of the scrolling page's visible area. */
  boxTop: number
  boxHeight: number
  /** Height of the scrolling page's visible area. */
  viewHeight: number
  scrollTop: number
}

/** The scrollTop of the page that puts the box in the middle of its visible area. Never negative. */
export function centeringScrollTop({ boxTop, boxHeight, viewHeight, scrollTop }: CenterInput): number {
  return Math.max(0, scrollTop + boxTop + boxHeight / 2 - viewHeight / 2)
}

interface BelowInput {
  boxBottom: number
  /** Space to keep under the box. */
  margin: number
  /** Bottom of the scrolling page's visible area, in the same coordinates as `boxBottom`. */
  viewBottom: number
}

/** How far the page must scroll down so that the box and its margin end above the bottom of the view; 0 if they already do. */
export function scrollDownToShow({ boxBottom, margin, viewBottom }: BelowInput): number {
  return Math.max(0, boxBottom + margin - viewBottom)
}

interface TargetInput {
  /** Where the page should end up for the box's final height. */
  target: number
  /** Where the page is heading now, or null when it is not moving. */
  running: number | null
  /** Where the page is now. */
  current: number
  /** Differences up to this many pixels count as no difference. */
  tolerance: number
}

/**
 * Decides where the page should scroll next. Returns null when it should be left alone: it is
 * already close enough, or it is already heading to a target at least as far down. A new
 * target is never allowed below the one the page is already heading to, so the page never turns back.
 */
export function nextScrollTarget({ target, running, current, tolerance }: TargetInput): number | null {
  if (running !== null) {
    const next = Math.max(target, running)
    return next - running <= tolerance ? null : next
  }
  return Math.abs(target - current) <= tolerance ? null : target
}
