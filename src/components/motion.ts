/**
 * Reads a duration from a CSS custom property such as `--motion-fold` (`320ms` or `0.32s`).
 * Returns `fallback` when the property is not set, for example where no stylesheet is loaded.
 */
export function readMotionMs(from: Element | null, name: string, fallback: number): number {
  if (from === null) return fallback
  const raw = getComputedStyle(from).getPropertyValue(name).trim()
  const found = /^(-?\d*\.?\d+)(ms|s)$/.exec(raw)
  if (found === null) return fallback
  return found[2] === 's' ? Number(found[1]) * 1000 : Number(found[1])
}

/** An easing: maps the share of the time that has passed (0 to 1) to the share of the movement done. */
export type Ease = (progress: number) => number

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

/** The CSS `cubic-bezier(x1, y1, x2, y2)` curve as a function, so a script can move in step with a CSS transition. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const axis = (a: number, b: number, t: number) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3
  return (progress) => {
    if (progress <= 0) return 0
    if (progress >= 1) return 1
    let low = 0
    let high = 1
    let t = progress
    for (let step = 0; step < 24; step += 1) {
      const x = axis(x1, x2, t)
      if (Math.abs(x - progress) < 1e-5) break
      if (x < progress) low = t
      else high = t
      t = (low + high) / 2
    }
    return axis(y1, y2, t)
  }
}

/** Reads a `cubic-bezier(...)` easing from a CSS custom property. Falls back to ease-out where it is not set. */
export function readMotionEase(from: Element | null, name: string): Ease {
  if (from === null) return easeOutCubic
  const raw = getComputedStyle(from).getPropertyValue(name).trim()
  const found = /^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/.exec(raw)
  if (found === null) return easeOutCubic
  return cubicBezier(Number(found[1]), Number(found[2]), Number(found[3]), Number(found[4]))
}

/**
 * When a script animation should count as started so it keeps pace with a CSS transition set up
 * in the same task. The browser dates such a transition from the start of the current frame
 * (the document timeline's time), not from the moment the script ran; starting the script
 * animation at `now` instead would leave it up to a frame behind. Without a timeline, `now`.
 */
export function animationStart(timelineTime: number | null | undefined, now: number): number {
  return typeof timelineTime === 'number' && timelineTime <= now ? timelineTime : now
}

/**
 * Scrolls an element to `top` over `ms` milliseconds along `ease`; with no time it jumps.
 * `onDone` runs when the scroll ends on its own. Returns a function that stops it.
 */
export function animateScrollTop(
  area: HTMLElement,
  top: number,
  ms: number,
  ease: Ease = easeOutCubic,
  onDone?: () => void,
): () => void {
  const from = area.scrollTop
  if (ms <= 0 || from === top) {
    area.scrollTop = top
    onDone?.()
    return () => undefined
  }
  const start = animationStart(document.timeline?.currentTime as number | null | undefined, performance.now())
  let frame = 0
  function step(now: number) {
    const progress = Math.min(1, (now - start) / ms)
    area.scrollTop = from + (top - from) * ease(progress)
    if (progress < 1) frame = requestAnimationFrame(step)
    else onDone?.()
  }
  frame = requestAnimationFrame(step)
  return () => cancelAnimationFrame(frame)
}
