import { expect, test } from 'vitest'
import { animationStart, cubicBezier } from './motion'

test('runs a cubic-bezier from 0 to 1 and keeps the ends fixed', () => {
  const ease = cubicBezier(0.4, 0, 0.2, 1)

  expect(ease(0)).toBe(0)
  expect(ease(1)).toBe(1)
})

test('rises steadily along the curve, with no step back', () => {
  const ease = cubicBezier(0.4, 0, 0.2, 1)
  let last = 0

  for (let share = 0.05; share <= 1; share += 0.05) {
    const value = ease(share)
    expect(value).toBeGreaterThanOrEqual(last)
    last = value
  }
})

test('matches the straight line for the linear curve', () => {
  const ease = cubicBezier(0, 0, 1, 1)

  expect(ease(0.25)).toBeCloseTo(0.25, 3)
  expect(ease(0.5)).toBeCloseTo(0.5, 3)
})

test('starts slowly and ends slowly for the standard curve', () => {
  const ease = cubicBezier(0.4, 0, 0.2, 1)

  expect(ease(0.1)).toBeLessThan(0.1)
  expect(ease(0.5)).toBeGreaterThan(0.5)
})

test('dates a script animation from the start of the frame, as a CSS transition is dated', () => {
  expect(animationStart(1000, 1012)).toBe(1000)
})

test('dates a script animation from now when there is no timeline time', () => {
  expect(animationStart(null, 1012)).toBe(1012)
  expect(animationStart(undefined, 1012)).toBe(1012)
})

test('never dates a script animation from the future', () => {
  expect(animationStart(1030, 1012)).toBe(1012)
})
