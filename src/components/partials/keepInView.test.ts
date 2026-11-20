import { expect, test } from 'vitest'
import { rememberBottomCard } from './keepInView'

function rect(top: number, bottom: number): DOMRect {
  return { top, bottom, left: 0, right: 0, width: 0, height: bottom - top, x: 0, y: top, toJSON: () => ({}) }
}

/** An area and three cards whose positions the test moves by hand. */
function setup(scrollTop: number) {
  const area = document.createElement('div')
  const cards = [0, 1, 2].map(() => {
    const card = document.createElement('article')
    card.className = 'log-list__item'
    area.append(card)
    return card
  })
  area.scrollTop = scrollTop
  let top = scrollTop
  Object.defineProperty(area, 'scrollTop', { configurable: true, get: () => top, set: (value: number) => { top = value } })
  const place = (viewBottom: number, offsets: number[]) => {
    area.getBoundingClientRect = () => rect(0, viewBottom)
    cards.forEach((card, index) => {
      card.getBoundingClientRect = () => rect(offsets[index], offsets[index] + 100)
    })
  }
  return { area, place }
}

test('scrolls so the card at the bottom of the view stays at the bottom after the area gets shorter', () => {
  const { area, place } = setup(500)
  place(300, [-80, 20, 220]) // the third card is the last one that starts inside the view
  const restore = rememberBottomCard(area)

  place(100, [-80, 20, 220]) // the area is shorter; the third card now lies below the view
  restore?.()

  // The card's bottom was 20 below the view edge; after scrolling it must be 20 below the new edge again.
  expect(area.scrollTop).toBe(500 + (320 - 100 - 20))
})

test('keeps nothing when the area is at its top', () => {
  const { area, place } = setup(0)
  place(300, [0, 100, 200])

  expect(rememberBottomCard(area)).toBeNull()
})
