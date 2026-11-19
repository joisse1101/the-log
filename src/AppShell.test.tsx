import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AppShell from './AppShell'
import { FakeStorage } from './test/fakeStorage'
import { THOUGHTS_ITEM } from './thoughts/localThoughtStore'
import type { Thought } from './thoughts/thought'

let container: HTMLDivElement
let root: Root
let storage: FakeStorage

beforeEach(async () => {
  storage = new FakeStorage()
  vi.stubGlobal('localStorage', storage)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })
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
  if (found === null) throw new Error('thought box not found')
  return found
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

async function saveWithButton() {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Save')
  if (button === undefined) throw new Error('Save button not found')
  await act(async () => {
    button.click()
  })
}

function storedThoughts(): Thought[] {
  const raw = storage.items.get(THOUGHTS_ITEM)
  return raw === undefined ? [] : (JSON.parse(raw) as { thoughts: Thought[] }).thoughts
}

function shownTexts(): string[] {
  return [...container.querySelectorAll('.log-list__text')].map((node) => node.textContent ?? '')
}

test('renders the title "The Log" with createRoot', () => {
  expect(container.querySelector('h1')?.textContent).toBe('The Log')
})

test('saves a typed thought with Shift + Enter and shows it first with "Today, HH:MM"', async () => {
  await type('First thought')
  await saveWithShiftEnter()

  expect(shownTexts()).toEqual(['First thought'])
  expect(container.querySelector('.log-list__time')?.textContent).toMatch(/^Today, \d{2}:\d{2}$/)
  const stored = storedThoughts()
  expect(stored).toHaveLength(1)
  expect(stored[0].id).toMatch(/^[0-9a-f-]{36}$/)
  expect(stored[0].createdAt).not.toBe('')
  expect(stored[0].editedAt).toBeNull()
})

test('saves with the Save button', async () => {
  await type('By button')
  await saveWithButton()

  expect(shownTexts()).toEqual(['By button'])
})

test('empties the box, keeps focus and puts the next thought above the first', async () => {
  await type('First thought')
  await saveWithShiftEnter()

  expect(box().value).toBe('')
  expect(document.activeElement).toBe(box())

  await type('Second')
  await saveWithShiftEnter()

  expect(shownTexts()).toEqual(['Second', 'First thought'])
})

test('keeps focus in the box after saving with the Save button', async () => {
  await type('First thought')
  await saveWithButton()

  expect(document.activeElement).toBe(box())
})

test.each(['', '   '])('refuses blank text %j and leaves the stored item unchanged', async (text) => {
  await type(text)
  await saveWithShiftEnter()

  expect(container.querySelector('[role="alert"]')?.textContent).toBe('A thought needs some text.')
  expect(storage.items.has(THOUGHTS_ITEM)).toBe(false)
  expect(shownTexts()).toEqual([])
})

test('keeps the text and the log when the storage write fails', async () => {
  await type('Earlier')
  await saveWithShiftEnter()
  const before = storage.items.get(THOUGHTS_ITEM)
  storage.failWrites = true

  await type('Lost?')
  await saveWithShiftEnter()

  expect(container.querySelector('[role="alert"]')?.textContent).toBe(
    "Couldn't save your thought. Your text is still in the box.",
  )
  expect(box().value).toBe('Lost?')
  expect(shownTexts()).toEqual(['Earlier'])
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test('offers no place choice and makes no network request when saving', async () => {
  const fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)

  expect(container.querySelector('select, input[type="radio"], input[type="checkbox"]')).toBeNull()
  expect([...container.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Save'])

  await type('Here')
  await saveWithShiftEnter()

  expect(storedThoughts().map((thought) => thought.text)).toEqual(['Here'])
  expect(fetchSpy).not.toHaveBeenCalled()
})

test('shows text as plain text, not HTML', async () => {
  await type('<b>bold</b>')
  await saveWithShiftEnter()

  expect(container.querySelector('.log-list__text b')).toBeNull()
  expect(shownTexts()).toEqual(['<b>bold</b>'])
})
