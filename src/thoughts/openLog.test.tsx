import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AppShell from '../AppShell'
import { FakeStorage } from '../test/fakeStorage'
import { THOUGHTS_ITEM } from './localThoughtStore'
import type { Thought } from './thought'

let container: HTMLDivElement
let root: Root
let storage: FakeStorage
let originalTimeZone: string | undefined

function thought(id: string, text: string, tags: string[], createdAt: string): Thought {
  return { id, text, tags, createdAt, editedAt: null }
}

async function openLog(thoughts: Thought[] | null, timeZone: string, now: string) {
  process.env.TZ = timeZone
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(now))
  if (thoughts !== null) {
    storage.items.set(THOUGHTS_ITEM, JSON.stringify({ version: 1, thoughts }))
  }
  await act(async () => {
    root.render(<AppShell />)
  })
}

function cards() {
  return [...container.querySelectorAll('.log-list__item')].map((card) => ({
    time: card.querySelector('.log-list__time')?.textContent,
    text: card.querySelector('.log-list__text')?.textContent,
    tags: [...card.querySelectorAll('.log-list__tag')].map((tag) => tag.textContent),
  }))
}

beforeEach(() => {
  originalTimeZone = process.env.TZ
  storage = new FakeStorage()
  vi.stubGlobal('localStorage', storage)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (originalTimeZone === undefined) {
    delete process.env.TZ
  } else {
    process.env.TZ = originalTimeZone
  }
})

// "Now" is Thu 19 Nov 2026 12:00 in Asia/Seoul (UTC+9, no daylight saving).
const SEOUL_NOW = '2026-11-19T03:00:00.000Z'

test('shows three stored thoughts newest first with today, yesterday and dated times, text and tags', async () => {
  await openLog(
    [
      thought('c', 'Sunday one', [], '2026-11-15T13:10:00.000Z'),
      thought('a', 'This morning', ['books', 'notes'], '2026-11-19T00:41:00.000Z'),
      thought('b', 'Last night', ['home'], '2026-11-18T12:15:00.000Z'),
    ],
    'Asia/Seoul',
    SEOUL_NOW,
  )

  expect(cards()).toEqual([
    { time: 'Today, 09:41', text: 'This morning', tags: ['#books', '#notes'] },
    { time: 'Yesterday, 21:15', text: 'Last night', tags: ['#home'] },
    { time: 'Sun 15 Nov, 22:10', text: 'Sunday one', tags: [] },
  ])
})

test('shows a stored thought whose text is "<b>hi</b>" as those characters, not as HTML', async () => {
  await openLog([thought('x', '<b>hi</b>', [], '2026-11-19T00:41:00.000Z')], 'Asia/Seoul', SEOUL_NOW)

  expect(container.querySelector('.log-list__text b')).toBeNull()
  expect(cards().map((card) => card.text)).toEqual(['<b>hi</b>'])
})

test('shows no thoughts and no error when the item is missing', async () => {
  await openLog(null, 'Asia/Seoul', SEOUL_NOW)

  expect(storage.items.has(THOUGHTS_ITEM)).toBe(false)
  expect(cards()).toEqual([])
  expect(container.querySelector('[role="alert"]')).toBeNull()
})

test.each([
  { timeZone: 'Asia/Seoul', now: SEOUL_NOW, shown: 'Today, 19:41' },
  { timeZone: 'America/New_York', now: '2026-11-19T17:00:00.000Z', shown: 'Today, 05:41' },
])('shows a time stored as 2026-11-19T10:41:00Z in the local zone $timeZone', async ({ timeZone, now, shown }) => {
  await openLog([thought('z', 'Zoned', [], '2026-11-19T10:41:00.000Z')], timeZone, now)

  expect(cards()[0].time).toBe(shown)
})
