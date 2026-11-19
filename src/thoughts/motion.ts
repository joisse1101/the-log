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

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

/** Scrolls an element to `top` over `ms` milliseconds; with no time it jumps. */
export function animateScrollTop(area: HTMLElement, top: number, ms: number): void {
  const from = area.scrollTop
  if (ms <= 0 || from === top) {
    area.scrollTop = top
    return
  }
  const start = performance.now()
  function step(now: number) {
    const progress = Math.min(1, (now - start) / ms)
    area.scrollTop = from + (top - from) * easeOutCubic(progress)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
