/**
 * Remembers which card sits at the bottom of the timeline's view and how far it sits below the
 * view's edge. The returned function, called when the timeline starts to change height, scrolls
 * so that card stays at the same place relative to the bottom edge, and keeps doing so for `ms`
 * milliseconds while the height animates. It returns a function that stops it early.
 * Returns null when the timeline is at its top: nothing to keep.
 */
export function rememberBottomCard(area: HTMLElement): ((ms?: number) => () => void) | null {
  if (area.scrollTop <= 0) return null
  const viewBottom = area.getBoundingClientRect().bottom
  const cards = [...area.querySelectorAll<HTMLElement>('.log-list__item')]
  const visible = cards.filter((card) => card.getBoundingClientRect().top < viewBottom)
  const anchor = visible[visible.length - 1]
  if (anchor === undefined) return null
  const gapBefore = anchor.getBoundingClientRect().bottom - viewBottom

  function apply() {
    const gapAfter = anchor.getBoundingClientRect().bottom - area.getBoundingClientRect().bottom
    area.scrollTop += gapAfter - gapBefore
  }

  return (ms = 0) => {
    apply()
    if (ms <= 0) return () => undefined
    const until = performance.now() + ms
    let frame = 0
    function follow(now: number) {
      apply()
      if (now < until) frame = requestAnimationFrame(follow)
    }
    frame = requestAnimationFrame(follow)
    return () => cancelAnimationFrame(frame)
  }
}
