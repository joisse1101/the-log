import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AppShell from '../AppShell'
import { FakeStorage } from '../test/fakeStorage'

let container: HTMLDivElement
let root: Root
let storage: FakeStorage

/** What the box measures. jsdom does no layout, so the test sets these by hand. */
const metrics = { client: 320, scroll: 320, text: 320 }

beforeEach(async () => {
  storage = new FakeStorage()
  vi.stubGlobal('localStorage', storage)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })
  Object.assign(metrics, { client: 320, scroll: 320, text: 320 })
  Object.defineProperty(box(), 'clientHeight', { configurable: true, get: () => metrics.client })
  Object.defineProperty(box(), 'scrollHeight', { configurable: true, get: () => metrics.scroll })
  // While tall the effect sets flex to none and reads the height of the text alone.
  Object.defineProperty(box(), 'offsetHeight', { configurable: true, get: () => metrics.text })
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

function isTall(): boolean {
  return container.querySelector('main')?.classList.contains('app-shell--tall') ?? false
}

async function type(text: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  await act(async () => {
    setValue?.call(box(), text)
    box().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function goTall() {
  metrics.scroll = 500
  metrics.text = 500
  await type('many\nlines\nof\ntext')
}

test('is not tall while the text fits the box', async () => {
  await type('short')

  expect(isTall()).toBe(false)
})

test('goes tall when the text overflows the box', async () => {
  await goTall()

  expect(isTall()).toBe(true)
})

test('stays tall when one line is deleted but the text is still taller than the box was', async () => {
  await goTall()

  metrics.text = 400
  await type('many\nlines\nof')

  expect(isTall()).toBe(true)
})

test('leaves tall when the text gets no taller than the box was', async () => {
  await goTall()

  metrics.text = 320
  metrics.scroll = 320
  await type('short')

  expect(isTall()).toBe(false)
})

test('leaves tall after a save and empties the box', async () => {
  await goTall()

  await act(async () => {
    box().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }))
  })

  expect(isTall()).toBe(false)
  expect(box().value).toBe('')
})

test('keeps the box, its text and its focus when it goes tall and leaves tall', async () => {
  const input = box()
  input.focus()
  await goTall()
  expect(box()).toBe(input)
  expect(document.activeElement).toBe(input)

  metrics.text = 100
  metrics.scroll = 320
  await type('short')
  expect(box()).toBe(input)
  expect(document.activeElement).toBe(input)
  expect(input.value).toBe('short')
})
