import { expect, test } from 'vitest'
import { formatThoughtTime } from './formatThoughtTime'

// Local-time constructors keep these tests independent of the machine's time zone.
const NOW = new Date(2026, 10, 19, 12, 0)

test('shows "Today, HH:MM" for a thought written today', () => {
  expect(formatThoughtTime(new Date(2026, 10, 19, 9, 41).toISOString(), NOW)).toBe('Today, 09:41')
})

test('shows "Yesterday, HH:MM" for a thought written the day before', () => {
  expect(formatThoughtTime(new Date(2026, 10, 18, 21, 15).toISOString(), NOW)).toBe('Yesterday, 21:15')
})

test('shows weekday, day and month for an older thought', () => {
  expect(formatThoughtTime(new Date(2026, 10, 15, 22, 10).toISOString(), NOW)).toBe('Sun 15 Nov, 22:10')
})
