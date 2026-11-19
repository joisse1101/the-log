/**
 * Remembers which card sits at the bottom of the timeline's view and where. The returned function,
 * called after the timeline has changed height, scrolls so that card is at the same place
 * relative to the bottom edge. Returns null when the timeline is at its top: nothing to keep.
 */
export function rememberBottomCard(area: HTMLElement): (() => void) | null {
  if (area.scrollTop <= 0) return null
  const viewBottom = area.getBoundingClientRect().bottom
  const cards = [...area.querySelectorAll<HTMLElement>('.log-list__item')]
  const visible = cards.filter((card) => card.getBoundingClientRect().top < viewBottom)
  const anchor = visible[visible.length - 1]
  if (anchor === undefined) return null
  const gapBefore = anchor.getBoundingClientRect().bottom - viewBottom
  return () => {
    const gapAfter = anchor.getBoundingClientRect().bottom - area.getBoundingClientRect().bottom
    area.scrollTop += gapAfter - gapBefore
  }
}
