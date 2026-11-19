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

function thought(id: string, text: string, tags: string[], createdAt: string): Thought {
  return { id, text, tags, createdAt, editedAt: null }
}

const STORED = [
  thought('a', 'First', [], '2026-11-19T00:41:00.000Z'),
  thought('b', 'Second', [], '2026-11-18T12:15:00.000Z'),
]

async function openApp(thoughts: Thought[]) {
  storage.items.set(THOUGHTS_ITEM, JSON.stringify({ version: 1, thoughts }))
  await act(async () => {
    root.render(<AppShell />)
  })
}

beforeEach(() => {
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
  vi.unstubAllGlobals()
})

function timeline(): HTMLElement {
  const found = container.querySelector<HTMLElement>('.timeline')
  if (found === null) throw new Error('timeline not found')
  return found
}

function box(): HTMLTextAreaElement {
  const found = container.querySelector('textarea')
  if (found === null) throw new Error('box not found')
  return found
}

function hint(): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>('.fold-hint')
}

/** jsdom does not scroll, so give the timeline a scrollTop that holds what was set. */
function trackScroll(area: HTMLElement) {
  let top = 0
  Object.defineProperty(area, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = value
    },
  })
}

async function scrollTimeline(to: number) {
  await act(async () => {
    timeline().scrollTop = to
    timeline().dispatchEvent(new Event('scroll', { bubbles: true }))
  })
}

async function type(text: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  await act(async () => {
    setValue?.call(box(), text)
    box().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function saveWithShiftEnter() {
  await act(async () => {
    box().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }))
  })
}

test('puts the box on top and the log in its own scrolling area, with no hint at rest', async () => {
  await openApp(STORED)

  expect(timeline().querySelectorAll('.log-list__item')).toHaveLength(2)
  expect(box().closest('.thought-box')?.hasAttribute('hidden')).toBe(false)
  expect(hint()).toBeNull()
})

test('folds the box into the hint "Drag down to write a log" when the timeline scrolls', async () => {
  await openApp(STORED)
  trackScroll(timeline())

  await scrollTimeline(40)

  expect(hint()?.textContent).toBe('↓ Drag down to write a log')
  expect(box().closest('.thought-box')?.hasAttribute('hidden')).toBe(true)
  expect(container.querySelector('main')?.classList.contains('app-shell--folded')).toBe(true)
})

test('keeps the typed text when the box is folded and opened again, and focuses the box', async () => {
  await openApp(STORED)
  trackScroll(timeline())
  await type('half a thought')

  await scrollTimeline(40)
  expect(box().value).toBe('half a thought')
  await act(async () => {
    hint()?.click()
  })

  expect(hint()).toBeNull()
  expect(box().value).toBe('half a thought')
  expect(document.activeElement).toBe(box())
})

test('opening the box from the hint leaves the timeline where it was', async () => {
  await openApp(STORED)
  trackScroll(timeline())
  await scrollTimeline(40)

  await act(async () => {
    hint()?.click()
  })

  expect(timeline().scrollTop).toBe(40)
})

test('opens the box when the user wheels up at the top of the timeline', async () => {
  await openApp(STORED)
  trackScroll(timeline())
  await scrollTimeline(40)
  await scrollTimeline(0)
  expect(hint()).not.toBeNull()

  await act(async () => {
    timeline().dispatchEvent(new WheelEvent('wheel', { deltaY: -30, bubbles: true }))
  })

  expect(hint()).toBeNull()
})

test('does not open the box when the user wheels up in the middle of the timeline', async () => {
  await openApp(STORED)
  trackScroll(timeline())
  await scrollTimeline(40)

  await act(async () => {
    timeline().dispatchEvent(new WheelEvent('wheel', { deltaY: -30, bubbles: true }))
  })

  expect(hint()).not.toBeNull()
})

test('makes the hint a real button that stays in the tab order', async () => {
  await openApp(STORED)
  trackScroll(timeline())
  await scrollTimeline(40)

  expect(hint()?.tagName).toBe('BUTTON')
  expect(hint()?.getAttribute('type')).toBe('button')
  expect(hint()?.hasAttribute('tabindex')).toBe(false)
})

test('saving scrolls the timeline to the top, empties the box and folds it', async () => {
  await openApp(STORED)
  trackScroll(timeline())
  await type('A new one')
  timeline().scrollTop = 60

  await saveWithShiftEnter()

  expect(timeline().scrollTop).toBe(0)
  expect(box().value).toBe('')
  expect(hint()).not.toBeNull()
  expect(timeline().querySelector('.log-list__text')?.textContent).toBe('A new one')
})

test('shows a fade at the bottom edge when more logs wait below, none when it fits', async () => {
  await openApp(STORED)
  const area = timeline()
  Object.defineProperty(area, 'clientHeight', { configurable: true, value: 100 })
  Object.defineProperty(area, 'scrollHeight', { configurable: true, value: 400 })
  trackScroll(area)

  await scrollTimeline(10)
  expect(area.classList.contains('timeline--fade-top')).toBe(true)
  expect(area.classList.contains('timeline--fade-bottom')).toBe(true)

  await scrollTimeline(300)
  expect(area.classList.contains('timeline--fade-bottom')).toBe(false)
})

function setSizes(area: HTMLElement, client: number, content: number) {
  Object.defineProperty(area, 'clientHeight', { configurable: true, value: client })
  Object.defineProperty(area, 'scrollHeight', { configurable: true, value: content })
}

async function touch(type: 'touchstart' | 'touchmove', clientY: number) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: [{ clientY }] })
  await act(async () => {
    timeline().dispatchEvent(event)
  })
}

test('keeps the box open when the browser moves scrollTop because the timeline changed height', async () => {
  await openApp(STORED)
  const area = timeline()
  trackScroll(area)
  setSizes(area, 282, 3000)
  await scrollTimeline(10)
  await scrollTimeline(2963)
  expect(hint()).not.toBeNull()

  await act(async () => {
    hint()?.click()
  })
  setSizes(area, 704, 3000)
  await scrollTimeline(2296)

  expect(hint()).toBeNull()
  expect(box().closest('.thought-box')?.hasAttribute('hidden')).toBe(false)
})

test('keeps the box open when the content gets shorter and the browser lowers scrollTop', async () => {
  await openApp(STORED)
  const area = timeline()
  trackScroll(area)
  setSizes(area, 300, 1000)
  await scrollTimeline(10)
  await scrollTimeline(600)
  await act(async () => {
    hint()?.click()
  })

  setSizes(area, 300, 800)
  await scrollTimeline(500)

  expect(hint()).toBeNull()
})

test('ignores a scroll right after a size change, and folds the box on a real scroll after that', async () => {
  vi.useFakeTimers({ toFake: ['performance'] })
  try {
    await openApp(STORED)
    const area = timeline()
    trackScroll(area)
    // A size change that reaches a commit: the dialog opening re-renders the page.
    setSizes(area, 300, 900)
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.log-list__edit')?.click()
    })
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(container.querySelector('[role="dialog"]')).toBeNull()

    await scrollTimeline(40)
    expect(hint()).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    await scrollTimeline(80)
    expect(hint()).not.toBeNull()
  } finally {
    vi.useRealTimers()
  }
})

test('shows no fade when everything fits in the timeline', async () => {
  await openApp(STORED)
  const area = timeline()
  setSizes(area, 300, 300)

  await scrollTimeline(0)

  expect(area.classList.contains('timeline--fade-top')).toBe(false)
  expect(area.classList.contains('timeline--fade-bottom')).toBe(false)
})

test('opens the box when a finger drags down at the top of the timeline', async () => {
  await openApp(STORED)
  trackScroll(timeline())
  await scrollTimeline(40)
  await scrollTimeline(0)
  expect(hint()).not.toBeNull()

  await touch('touchstart', 100)
  await touch('touchmove', 150)

  expect(hint()).toBeNull()
})

test('does not open the box for a short touch move or one in the middle of the timeline', async () => {
  await openApp(STORED)
  trackScroll(timeline())
  await scrollTimeline(40)
  await scrollTimeline(0)

  await touch('touchstart', 100)
  await touch('touchmove', 110)
  expect(hint()).not.toBeNull()

  await scrollTimeline(40)
  await touch('touchstart', 100)
  await touch('touchmove', 200)
  expect(hint()).not.toBeNull()
})

test('shows the tags line as chips and not as text, with the text as markdown', async () => {
  await openApp([thought('m', '## Plan\n\n- [x] done\n- [ ] later', ['books', 'notes'], '2026-11-19T00:41:00.000Z')])

  const card = container.querySelector('.log-list__item')
  expect(card?.querySelector('h3')?.textContent).toBe('Plan')
  expect(card?.querySelectorAll('input[type="checkbox"]')).toHaveLength(2)
  expect([...(card?.querySelectorAll('.log-list__tag') ?? [])].map((tag) => tag.textContent)).toEqual([
    '#books',
    '#notes',
  ])
  expect(card?.querySelector('.log-list__text')?.textContent).not.toContain('books')
})
