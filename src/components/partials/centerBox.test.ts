import { expect, test } from 'vitest'
import { centeringScrollTop, nextScrollTarget, scrollDownToShow } from './centerBox'

test('scrolls down so a box sitting low on the screen ends up in the middle', () => {
  // View 800 high, box 704 high with its top at 96: its middle is at 448, the view's at 400.
  expect(centeringScrollTop({ boxTop: 96, boxHeight: 704, viewHeight: 800, scrollTop: 100 })).toBe(148)
})

test('leaves the page where it is when the box is already centred', () => {
  expect(centeringScrollTop({ boxTop: 48, boxHeight: 704, viewHeight: 800, scrollTop: 130 })).toBe(130)
})

test('scrolls up when the box sits above the middle', () => {
  expect(centeringScrollTop({ boxTop: 20, boxHeight: 400, viewHeight: 800, scrollTop: 300 })).toBe(120)
})

test('never goes above the top of the page', () => {
  expect(centeringScrollTop({ boxTop: 10, boxHeight: 100, viewHeight: 800, scrollTop: 20 })).toBe(0)
})

test('asks for no scroll while the box and its margin end above the bottom of the view', () => {
  expect(scrollDownToShow({ boxBottom: 700, margin: 12, viewBottom: 800 })).toBe(0)
})

test('asks to scroll down by exactly how far the box and its margin pass the bottom of the view', () => {
  expect(scrollDownToShow({ boxBottom: 830, margin: 12, viewBottom: 800 })).toBe(42)
})


test('leaves the page alone when it is already within the tolerance of the target', () => {
  expect(nextScrollTarget({ target: 101, running: null, current: 100, tolerance: 2 })).toBeNull()
})

test('moves a resting page to a target that is further away', () => {
  expect(nextScrollTarget({ target: 140, running: null, current: 100, tolerance: 2 })).toBe(140)
})

test('can move a resting page up, for a page the user scrolled far down', () => {
  expect(nextScrollTarget({ target: 60, running: null, current: 100, tolerance: 2 })).toBe(60)
})

test('keeps going to the running target when the new one is within the tolerance of it', () => {
  expect(nextScrollTarget({ target: 119, running: 118, current: 60, tolerance: 2 })).toBeNull()
})

test('never turns back: a new target below the running one is ignored', () => {
  expect(nextScrollTarget({ target: 90, running: 118, current: 60, tolerance: 2 })).toBeNull()
})

test('extends the running target when the new one is further down', () => {
  expect(nextScrollTarget({ target: 150, running: 118, current: 60, tolerance: 2 })).toBe(150)
})
