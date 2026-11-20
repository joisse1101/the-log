import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AppShell from './AppShell'
import { FakeStorage } from './test/fakeStorage'
import { readMotionMs } from './components/motion'

let container: HTMLDivElement
let root: Root
let storage: FakeStorage

/** What the box's text needs. jsdom does no layout, so the test sets it by hand. */
const content = { height: 100 }

beforeEach(async () => {
  storage = new FakeStorage()
  vi.stubGlobal('localStorage', storage)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })
  box().style.minHeight = '120px'
  box().style.maxHeight = '300px'
  // The text is measured in the hidden copy of the box, which is the second textarea.
  Object.defineProperty(mirror(), 'scrollHeight', { configurable: true, get: () => content.height })
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

function box(): HTMLTextAreaElement {
  const found = container.querySelector('textarea')
  if (found === null) throw new Error('box not found')
  return found
}

function mirror(): HTMLTextAreaElement {
  const found = container.querySelectorAll('textarea')[1]
  if (found === undefined) throw new Error('measuring copy not found')
  return found
}

async function type(text: string, textHeight: number) {
  content.height = textHeight
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  await act(async () => {
    setValue?.call(box(), text)
    box().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

test('sets the box height from its text', async () => {
  await type('a\nb\nc', 200)

  expect(box().style.height).toBe('200px')
})

test('keeps the box at its minimum height while the text is short', async () => {
  await type('a', 40)

  expect(box().style.height).toBe('120px')
})

test('stops growing the box at its cap', async () => {
  await type('many lines', 900)

  expect(box().style.height).toBe('300px')
})

test('shrinks the box again when text is deleted, and keeps focus and text', async () => {
  box().focus()
  await type('many lines', 900)

  await type('one', 150)

  expect(box().style.height).toBe('150px')
  expect(box().value).toBe('one')
  expect(document.activeElement).toBe(box())
})

test('reads a duration from a custom property in milliseconds or seconds, or falls back', () => {
  const probe = document.createElement('div')
  document.body.append(probe)
  probe.style.setProperty('--motion-fold', '0.5s')
  probe.style.setProperty('--motion-grow', '160ms')

  expect(readMotionMs(probe, '--motion-fold', 1)).toBe(500)
  expect(readMotionMs(probe, '--motion-grow', 1)).toBe(160)
  expect(readMotionMs(probe, '--motion-scroll', 7)).toBe(7)
  expect(readMotionMs(null, '--motion-fold', 9)).toBe(9)
  probe.remove()
})

test('closes the folded parts to the keyboard and screen readers and opens the shown ones', () => {
  const parts = [...container.querySelectorAll('.collapse')].map((part) => part.getAttribute('data-open'))

  // Header, hint and box: open at rest means header and box shown, hint closed.
  expect(parts).toEqual(['true', 'false', 'true'])
  expect(container.querySelector('.fold-hint')?.closest('.collapse')?.hasAttribute('inert')).toBe(true)
})

test('measures the text without ever setting the real box to a zero height', async () => {
  const heights: string[] = []
  const style = box().style
  let current = style.height
  Object.defineProperty(style, 'height', {
    configurable: true,
    get: () => current,
    set: (value: string) => {
      heights.push(value)
      current = value
    },
  })

  await type('first', 200)
  await type('second', 260)

  expect(heights.length).toBeGreaterThan(0)
  expect(heights.every((value) => Number.parseFloat(value) >= 120)).toBe(true)
})

test('keeps the measuring copy out of reach: hidden from screen readers and the keyboard', () => {
  expect(mirror().getAttribute('aria-hidden')).toBe('true')
  expect(mirror().tabIndex).toBe(-1)
  expect(mirror().readOnly).toBe(true)
})
