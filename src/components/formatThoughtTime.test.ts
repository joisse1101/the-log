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

test('adds the year to a thought from an earlier year', () => {
  expect(formatThoughtTime(new Date(2025, 9, 16, 7, 50).toISOString(), NOW)).toBe('Thu 16 Oct 2025, 07:50')
})

test('adds no year to a thought from earlier this year', () => {
  expect(formatThoughtTime(new Date(2026, 0, 2, 7, 50).toISOString(), NOW)).toBe('Fri 2 Jan, 07:50')
})
